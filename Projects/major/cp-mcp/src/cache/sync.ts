import { getDb } from "./db.js";
import { cfCall } from "../upstream/codeforces.js";
import { acCall } from "../upstream/atcoder.js";
import { getDbKv, setDbKv } from "./kv.js";
import { Submission, Site } from "../domain/types.js";

export interface RawCfProblem {
  contestId?: number;
  problemsetName?: string | null;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
}

export interface RawCfProblemStats {
  contestId?: number;
  index: string;
  solvedCount: number;
}

export interface ProblemCatalogueInfo {
  problems: RawCfProblem[];
  problemStatistics: RawCfProblemStats[];
}

/**
 * Synchronizes the Codeforces problem catalogue.
 * Caches the sync state for 12 hours unless `force` is set.
 */
export async function syncCfProblemCatalogue(
  force?: boolean
): Promise<{ count: number; source: "live" | "cache" }> {
  const syncKey = "cf:problem_catalogue_last_sync";

  if (!force) {
    const lastSync = getDbKv<boolean>(syncKey);
    if (lastSync && lastSync.status === "hit") {
      const db = getDb();
      const row = db
        .prepare(
          "SELECT count(*) as count FROM problems WHERE site = 'codeforces'"
        )
        .get() as { count: number };
      return { count: row.count, source: "cache" };
    }
  }

  // Fetch the latest lists from Codeforces
  const data = await cfCall<ProblemCatalogueInfo>("problemset.problems");
  if (!data?.problems || !data?.problemStatistics) {
    throw new Error("Invalid response structure from problemset.problems");
  }

  const { problems, problemStatistics } = data;

  // Build a map of solved statistics
  const statsMap = new Map<string, number>();
  for (const stats of problemStatistics) {
    if (stats.contestId) {
      statsMap.set(`${stats.contestId}_${stats.index}`, stats.solvedCount);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const db = getDb();

  const insertStmt = db.prepare(`
    INSERT INTO problems (
      id, site, site_id, name, url, contest_id,
      difficulty, difficulty_source, difficulty_confidence,
      tags, solved_count, points, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      url = excluded.url,
      contest_id = excluded.contest_id,
      difficulty = excluded.difficulty,
      difficulty_source = excluded.difficulty_source,
      difficulty_confidence = excluded.difficulty_confidence,
      tags = excluded.tags,
      solved_count = excluded.solved_count,
      points = excluded.points,
      updated_at = excluded.updated_at
  `);

  let count = 0;
  db.transaction(() => {
    for (const p of problems) {
      // Exclude Gym and ACMSGURU problems in v1
      if (p.problemsetName || !p.contestId || p.contestId >= 100000) {
        continue;
      }

      const siteId = `${p.contestId}${p.index}`;
      const id = `cf:${siteId}`;
      const url = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
      const tagsJson = JSON.stringify(p.tags || []);
      const solvedCount = statsMap.get(`${p.contestId}_${p.index}`) || 0;

      insertStmt.run(
        id,
        "codeforces",
        siteId,
        p.name,
        url,
        String(p.contestId),
        p.rating ?? null, // handle undefined/null ratings
        "official",
        "high",
        tagsJson,
        solvedCount,
        p.points ?? null,
        now
      );
      count++;
    }
  })();

  // Mark the sync as successful for 12 hours
  setDbKv(syncKey, true, 12 * 60 * 60);

  return { count, source: "live" };
}


const currentlySyncing = new Set<string>();

export interface SyncStatus {
  partial: boolean;
  partialNote?: string;
  upstreamCalls: number;
  /**
   * Whether a full backfill of this handle's submission history has ever
   * finished. Derived from the user_sync watermark, which is written only
   * when a sync pass completes without hitting its time limit (see
   * performSync below). NOT the inverse of `partial` — `partial` also means
   * "a background job is running", while `complete` is specifically about
   * whether absence of a submission in the cache is meaningful.
   */
  complete: boolean;
}

/**
 * Synchronizes a user's submissions.
 * For cold handles, performs a partial sync and spawns a background job.
 */
export async function syncUserSubmissions(
  site: Site,
  handle: string
): Promise<SyncStatus> {
  const db = getDb();
  let upstreamCalls = 0;

  // Get current watermark
  const row = db.prepare("SELECT last_synced_epoch, last_run_at FROM user_sync WHERE site = ? AND handle = ?").get(site, handle) as { last_synced_epoch: number, last_run_at: number } | undefined;
  const wm = row ? row.last_synced_epoch : 0;
  
  const nowEpoch = Math.floor(Date.now() / 1000);
  // If recent run, return fast (already synced recently)
  if (row && nowEpoch - row.last_run_at < 60) {
    // A watermark row only exists once a full pass has completed at least
    // once (see the !hitTimeLimit branch in performSync), so its presence
    // here means the backfill is done.
    return { partial: false, upstreamCalls: 0, complete: true };
  }

  const syncKey = `${site}:${handle}`;

  if (currentlySyncing.has(syncKey)) {
    return {
      partial: true,
      partialNote: "Background sync still in progress",
      upstreamCalls: 0,
      // A backfill from before this in-flight sync already finished
      // (wm > 0) means the cache still holds a complete history even
      // while this refresh runs. A cold handle mid-backfill has no such
      // history yet.
      complete: wm > 0,
    };
  }

  let cfFrom = 1;
  let acCursor = wm;
  const performSync = async (maxDurationMs: number): Promise<{ hitTimeLimit: boolean, calls: number }> => {
    const start = Date.now();
    let calls = 0;
    let hitTimeLimit = false;

    if (site === "codeforces") {
       const count = 200;
       while (true) {
          if (Date.now() - start > maxDurationMs) {
            hitTimeLimit = true;
            break;
          }
          const page = await cfCall<any[]>("user.status", { handle, from: cfFrom, count });
          calls++;
          if (!page || page.length === 0) break;

          const lastPageItem = page[page.length - 1]; // Oldest in this page
          
          db.transaction(() => {
              for (const p of page) {
                  db.prepare(`
                      INSERT INTO submissions (id, site, handle, problem_id, at, verdict, testset, language, participation)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                      ON CONFLICT(id) DO UPDATE SET
                        verdict = excluded.verdict,
                        testset = excluded.testset
                  `).run(
                      String(p.id),
                      site,
                      handle,
                      `cf:${p.problem.contestId}${p.problem.index}`,
                      p.creationTimeSeconds,
                      p.verdict,
                      p.testset,
                      p.programmingLanguage,
                      p.author.participantType
                  );
              }
          })();

          if (lastPageItem.creationTimeSeconds <= wm) break;

          cfFrom += count;
          if (cfFrom > 10000) break; // safety cap
       }
    } else if (site === "atcoder") {
      while (true) {
        if (Date.now() - start > maxDurationMs) {
          hitTimeLimit = true;
          break;
        }
        const page = await acCall<any[]>("user/submissions", { user: handle, from_second: acCursor });
        calls++;
        if (!page || page.length === 0) break;

        db.transaction(() => {
          for (const p of page) {
            db.prepare(`
              INSERT INTO submissions (id, site, handle, problem_id, at, verdict, testset, language, participation)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                verdict = excluded.verdict
            `).run(
              String(p.id),
              site,
              handle,
              `ac:${p.problem_id}`,
              p.epoch_second,
              p.result,
              null,
              p.language,
              "contest"
            );
          }
        })();

        const maxEpoch = Math.max(...page.map((p: any) => p.epoch_second));
        acCursor = maxEpoch + 1;
        if (page.length < 500) break;
      }
    }

    if (!hitTimeLimit) {
        // Update watermark only if we finished seamlessly!
        const currentEpoch = Math.floor(Date.now() / 1000);
        db.prepare(`
          INSERT INTO user_sync (site, handle, last_synced_epoch, last_run_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(site, handle) DO UPDATE SET
            last_synced_epoch = excluded.last_synced_epoch,
            last_run_at = excluded.last_run_at
        `).run(site, handle, currentEpoch - 60, currentEpoch);
    }
    
    // Always update user_solved for the submissions we DID get
    db.prepare(`
      INSERT OR REPLACE INTO user_solved (site, handle, problem_id, first_ac_at, attempts)
      SELECT
          site,
          handle,
          problem_id,
          MIN(CASE WHEN verdict = 'AC' OR (verdict = 'OK' AND testset = 'TESTS') THEN at ELSE NULL END),
          COUNT(*)
      FROM submissions
      WHERE site = ? AND handle = ?
      GROUP BY site, handle, problem_id
    `).run(site, handle);

    return { hitTimeLimit, calls };
  };

  if (wm === 0) {
    // Cold handle: do a partial sync and background the rest
    currentlySyncing.add(syncKey);
    
    // Block for up to 20s on the first sync of a handle. Codeforces is throttled
    // to one request per 2100ms, so 4s bought only 2 pages (400 submissions) and
    // left most of the history missing — which surfaced as "unknown" rows on the
    // very first question anyone asks. 20s buys ~9 pages (~1800 submissions),
    // enough to finish a normal account outright. It is paid once per handle,
    // ever: afterwards the watermark makes a refresh a single call. The ceiling
    // is MCP client tool timeouts, which sit comfortably above this. Huge
    // histories still fall through to the background continuation below.
    const syncRes = await performSync(20000);
    upstreamCalls += syncRes.calls;

    if (syncRes.hitTimeLimit) {
      // Background the rest
      (async () => {
         try {
           let remainingCalls = 0;
           let hit = true;
           while (hit && remainingCalls < 50) { 
             const res = await performSync(10000); // 10s chunks
             remainingCalls += res.calls;
             hit = res.hitTimeLimit;
             if (!hit) break;
           }
         } catch(e) {
           console.error("Background sync failed for", site, handle, e);
         } finally {
           currentlySyncing.delete(syncKey);
         }
      })();

      return {
        partial: true,
        partialNote: "Full submission history is downloading in the background. First few pages fetched.",
        upstreamCalls,
        complete: false,
      };
    } else {
      currentlySyncing.delete(syncKey);
      return { partial: false, upstreamCalls, complete: true };
    }
  } else {
    // Warm handle: full sync shouldn't take long (1-2 pages at most)
    currentlySyncing.add(syncKey);
    try {
      const syncRes = await performSync(15000);
      upstreamCalls += syncRes.calls;

      return {
        partial: syncRes.hitTimeLimit,
        partialNote: syncRes.hitTimeLimit ? "Sync interrupted by timeout" : undefined,
        upstreamCalls,
        complete: !syncRes.hitTimeLimit,
      };
    } finally {
      currentlySyncing.delete(syncKey);
    }
  }
}
