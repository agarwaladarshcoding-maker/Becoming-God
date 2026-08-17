import { getDb } from "./db.js";
import { cfCall } from "../upstream/codeforces.js";
import { getDbKv, setDbKv } from "./kv.js";

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
  const runTransaction = db.transaction(() => {
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
  });

  runTransaction();

  // Mark the sync as successful for 12 hours
  setDbKv(syncKey, true, 12 * 60 * 60);

  return { count, source: "live" };
}
