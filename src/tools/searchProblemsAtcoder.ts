import { z } from "zod";
import { getDb } from "../cache/db.js";
import { getCachedOrFetch } from "../cache/kv.js";
import { filterProblems, rankProblems, seededShuffle } from "../domain/search.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { Problem, DbProblemRow } from "../domain/types.js";
import { politeFetch } from "../upstream/http.js";

export const searchProblemsAtcoderSchema = z.object({
  min_difficulty: z.number().int().min(0).max(4000),
  max_difficulty: z.number().int().min(0).max(4000),
  exclude_solved_by: z.string().optional(),
  min_solver_count: z.number().int().default(0),
  limit: z.number().int().min(1).max(25).default(10),
  seed: z.number().int().optional(),
});

type SearchProblemsAtcoderArgs = z.infer<typeof searchProblemsAtcoderSchema>;

interface MergedProblem {
  id: string;
  contest_id: string;
  problem_index: string;
  name: string;
  solver_count: number | null;
}

type ProblemModels = Record<string, { difficulty?: number | null; is_experimental?: boolean }>;

interface ContestListEntry {
  id: string;
}

function normalizeAcDifficulty(d: number): number {
  const raw = d < 400 ? 800 + d * 0.5 : d + 400;
  return Math.min(3500, Math.max(800, Math.round(raw / 100) * 100));
}

async function syncAcProblemCatalogue(): Promise<{ source: "cache" | "live"; upstreamCalls: number }> {
  let upstreamCalls = 0;
  let source: "cache" | "live" = "cache";

  const { data: merged, source: mergedSource } = await getCachedOrFetch<MergedProblem[]>(
    "ac:catalogue:merged-problems",
    24 * 3600,
    async () => {
      const resp = await politeFetch("https://kenkoooo.com/atcoder/resources/merged-problems.json");
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching merged-problems.json`);
      const data = await resp.json() as MergedProblem[];
      return { data };
    }
  );
  if (mergedSource === "live") { upstreamCalls++; source = "live"; }

  const { data: models, source: modelsSource } = await getCachedOrFetch<ProblemModels>(
    "ac:catalogue:problem-models",
    24 * 3600,
    async () => {
      const resp = await politeFetch("https://kenkoooo.com/atcoder/resources/problem-models.json");
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching problem-models.json`);
      const data = await resp.json() as ProblemModels;
      return { data };
    }
  );
  if (modelsSource === "live") { upstreamCalls++; source = "live"; }

  const { data: contests, source: contestsSource } = await getCachedOrFetch<ContestListEntry[]>(
    "ac:catalogue:contests",
    24 * 3600,
    async () => {
      const resp = await politeFetch("https://kenkoooo.com/atcoder/resources/contests.json");
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching contests.json`);
      const data = await resp.json() as ContestListEntry[];
      return { data };
    }
  );
  if (contestsSource === "live") { upstreamCalls++; source = "live"; }

  const contestIds = new Set<string>((contests ?? []).map(c => c.id));

  if (!merged || merged.length === 0) return { source, upstreamCalls };

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const insertStmt = db.prepare(`
    INSERT INTO problems (
      id, site, site_id, name, url, contest_id,
      difficulty, difficulty_source, difficulty_confidence,
      tags, solved_count, points, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      difficulty = excluded.difficulty,
      difficulty_source = excluded.difficulty_source,
      difficulty_confidence = excluded.difficulty_confidence,
      solved_count = excluded.solved_count,
      updated_at = excluded.updated_at
  `);

  db.transaction(() => {
    for (const p of merged) {
      const siteId = p.id; // p.id is already "abc300_c" — the full problem id
      const id = `ac:${siteId}`;

      // p.contest_id from merged-problems.json is often a re-run ("adt_*"), not the real
      // contest — derive it from the problem id instead, split at the LAST underscore so
      // multi-underscore contests like "tenka1_2017_a" still resolve to "tenka1_2017".
      const lastUnderscore = siteId.lastIndexOf("_");
      const derivedContestId = lastUnderscore > 0 ? siteId.slice(0, lastUnderscore) : null;
      const contestId = derivedContestId && contestIds.has(derivedContestId) ? derivedContestId : p.contest_id;
      const url = `https://atcoder.jp/contests/${contestId}/tasks/${p.id}`;
      const rawDifficulty = models?.[p.id]?.difficulty;
      const cfDiff = rawDifficulty != null ? normalizeAcDifficulty(rawDifficulty) : null;

      insertStmt.run(
        id,
        "atcoder",
        siteId,
        p.name,
        url,
        contestId,
        cfDiff,
        rawDifficulty != null ? "estimated" : "unknown",
        models?.[p.id]?.is_experimental === true ? "low" : "high",
        "[]",
        p.solver_count ?? null,
        null,
        now
      );
    }
  })();

  return { source, upstreamCalls };
}

export async function handleSearchProblemsAtcoder(args: SearchProblemsAtcoderArgs) {
  const { min_difficulty, max_difficulty, exclude_solved_by, min_solver_count, limit, seed } = args;

  if (min_difficulty > max_difficulty) {
    return {
      content: [{ type: "text" as const, text: `Invalid difficulty range: min (${min_difficulty}) > max (${max_difficulty}).` }],
      isError: true,
    };
  }

  let upstreamCalls = 0;
  let source: "cache" | "live" = "cache";

  try {
    const syncRes = await syncAcProblemCatalogue();
    upstreamCalls += syncRes.upstreamCalls;
    if (syncRes.source === "live") source = "live";
  } catch (err: unknown) {
    const db = getDb();
    const check = db.prepare("SELECT count(*) as count FROM problems WHERE site = 'atcoder'").get() as { count: number };
    if (check.count === 0) {
      return {
        content: [{ type: "text" as const, text: `AtCoder problem catalogue empty and sync failed: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }

  const db = getDb();

  const excludeSolvedIds = new Set<string>();
  if (exclude_solved_by) {
    const handle = exclude_solved_by.toLowerCase().trim();
    const rows = db.prepare("SELECT problem_id FROM user_solved WHERE site = 'atcoder' AND LOWER(handle) = ?").all(handle) as Array<{ problem_id: string }>;
    for (const r of rows) excludeSolvedIds.add(r.problem_id);
  }

  const dbRows = db.prepare(
    "SELECT * FROM problems WHERE site = 'atcoder' AND difficulty >= ? AND difficulty <= ?"
  ).all(min_difficulty, max_difficulty) as DbProblemRow[];

  const problems: Problem[] = dbRows
    .filter(r => !excludeSolvedIds.has(r.id))
    .filter(r => (r.solved_count ?? 0) >= min_solver_count)
    .map(r => ({
      site: "atcoder",
      id: r.id,
      siteId: r.site_id,
      name: r.name,
      url: r.url,
      contestId: r.contest_id ?? "",
      difficulty: r.difficulty ?? undefined,
      difficultySource: r.difficulty_source,
      difficultyConfidence: r.difficulty_confidence ?? undefined,
      tags: [],
      solvedCount: r.solved_count ?? undefined,
    }));

  const filtered = filterProblems(problems, { tags: [], tagMode: "any" });
  const ranked = rankProblems(filtered, min_difficulty, max_difficulty);
  const shuffled = seededShuffle(ranked, seed ?? Math.floor(Date.now() / 86400000));
  const page = shuffled.slice(0, limit);

  if (page.length === 0) {
    const footer = buildFreshnessFooter({ source, upstreamCalls, partial: false });
    return {
      content: [{ type: "text" as const, text: `No AtCoder problems found in difficulty range ${min_difficulty}–${max_difficulty}.\n\n${footer}` }],
      structuredContent: { problems: [], source, upstreamCalls, partial: false },
    };
  }

  const headers = ["Problem", "Name", "Difficulty", "Solvers"];
  const rows = page.map(p => [
    `[${p.siteId}](${p.url})`,
    p.name,
    p.difficulty != null ? String(p.difficulty) : "?",
    p.solvedCount != null ? String(p.solvedCount) : "?",
  ]);

  const footer = buildFreshnessFooter({ source, upstreamCalls, partial: false });
  const text = [
    `AtCoder Problems (difficulty ${min_difficulty}–${max_difficulty}, ${page.length} results):`,
    "",
    formatMarkdownTable(headers, rows),
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: { problems: page, source, upstreamCalls, partial: false },
  };
}
