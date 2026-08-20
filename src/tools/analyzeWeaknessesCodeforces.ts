import { z } from "zod";
import { getDb } from "../cache/db.js";
import { syncUserSubmissions } from "../cache/sync.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";

export const analyzeWeaknessesCodeforcesSchema = z.object({
  handle: z.string().regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid Codeforces handle"),
});

type AnalyzeWeaknessesCodeforcesArgs = z.infer<typeof analyzeWeaknessesCodeforcesSchema>;

export async function handleAnalyzeWeaknessesCodeforces(args: AnalyzeWeaknessesCodeforcesArgs) {
  const { handle } = args;

  const syncStatus = await syncUserSubmissions("codeforces", handle);
  const db = getDb();

  const userSolvedRows = db.prepare(`
    SELECT problem_id, first_ac_at, attempts
    FROM user_solved
    WHERE site = 'codeforces' AND handle = ?
  `).all(handle) as Array<{ problem_id: string; first_ac_at: number | null; attempts: number }>;

  const problemRows = db.prepare(`
    SELECT id, tags, difficulty
    FROM problems
    WHERE site = 'codeforces'
  `).all() as Array<{ id: string; tags: string; difficulty: number | null }>;

  const problemsMap = new Map(problemRows.map(p => [p.id, p]));

  const tagStats = new Map<string, {
    attemptedCount: number;
    solvedCount: number;
    totalAcAttempts: number;
  }>();

  for (const s of userSolvedRows) {
    const p = problemsMap.get(s.problem_id);
    if (!p || !p.tags) continue;
    
    let tags: string[] = [];
    try {
      tags = JSON.parse(p.tags);
    } catch {
      continue;
    }

    const isSolved = s.first_ac_at !== null;
    
    for (const tag of tags) {
      if (!tagStats.has(tag)) {
        tagStats.set(tag, { attemptedCount: 0, solvedCount: 0, totalAcAttempts: 0 });
      }
      const st = tagStats.get(tag)!;
      st.attemptedCount++;
      if (isSolved) {
        st.solvedCount++;
        st.totalAcAttempts += s.attempts;
      }
    }
  }

  const results = Array.from(tagStats.entries()).map(([tag, st]) => {
    return {
      tag,
      attemptedCount: st.attemptedCount,
      solvedCount: st.solvedCount,
      solveRate: st.attemptedCount > 0 ? (st.solvedCount / st.attemptedCount) : 0,
      avgAcAttempts: st.solvedCount > 0 ? (st.totalAcAttempts / st.solvedCount) : 0,
    };
  });

  results.sort((a, b) => b.attemptedCount - a.attemptedCount);

  const tableRows = results.map(r => [
    r.tag,
    String(r.attemptedCount),
    String(r.solvedCount),
    `${(r.solveRate * 100).toFixed(1)}%`,
    r.avgAcAttempts.toFixed(2),
  ]);

  const footer = buildFreshnessFooter({
    source: syncStatus.upstreamCalls > 0 ? "live" : "cache",
    upstreamCalls: syncStatus.upstreamCalls,
    partial: syncStatus.partial,
  });

  const text = [
    `Weakness Analysis for **${handle}** (Codeforces)`,
    "",
    formatMarkdownTable(["Tag", "Attempted", "Solved", "Solve Rate", "Avg AC Attempts"], tableRows),
    syncStatus.partialNote ? `\nNote: ${syncStatus.partialNote}` : "",
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      handle,
      results,
      source: syncStatus.upstreamCalls > 0 ? "live" : "cache",
      upstreamCalls: syncStatus.upstreamCalls,
      partial: syncStatus.partial,
    },
  };
}
