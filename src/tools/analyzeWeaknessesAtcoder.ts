import { z } from "zod";
import { getDb } from "../cache/db.js";
import { syncUserSubmissions } from "../cache/sync.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";

export const analyzeWeaknessesAtcoderSchema = z.object({
  handle: z.string().regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid AtCoder handle"),
});

type AnalyzeWeaknessesAtcoderArgs = z.infer<typeof analyzeWeaknessesAtcoderSchema>;

export async function handleAnalyzeWeaknessesAtcoder(args: AnalyzeWeaknessesAtcoderArgs) {
  const { handle } = args;

  const syncStatus = await syncUserSubmissions("atcoder", handle);
  const db = getDb();

  const userSolvedRows = db.prepare(`
    SELECT problem_id, first_ac_at, attempts
    FROM user_solved
    WHERE site = 'atcoder' AND handle = ?
  `).all(handle) as Array<{ problem_id: string; first_ac_at: number | null; attempts: number }>;

  const problemRows = db.prepare(`
    SELECT id, difficulty
    FROM problems
    WHERE site = 'atcoder'
  `).all() as Array<{ id: string; difficulty: number | null }>;

  const problemsMap = new Map(problemRows.map(p => [p.id, p]));

  const bandStats = new Map<string, {
    attemptedCount: number;
    solvedCount: number;
    totalAcAttempts: number;
  }>();

  for (const s of userSolvedRows) {
    const p = problemsMap.get(s.problem_id);
    if (!p || p.difficulty === null) continue;
    
    // Group by bands of 400
    const bandLower = Math.floor(p.difficulty / 400) * 400;
    const bandUpper = bandLower + 399;
    const band = `${bandLower}-${bandUpper}`;

    const isSolved = s.first_ac_at !== null;
    
    if (!bandStats.has(band)) {
      bandStats.set(band, { attemptedCount: 0, solvedCount: 0, totalAcAttempts: 0 });
    }
    const st = bandStats.get(band)!;
    st.attemptedCount++;
    if (isSolved) {
      st.solvedCount++;
      st.totalAcAttempts += s.attempts;
    }
  }

  const results = Array.from(bandStats.entries()).map(([band, st]) => {
    return {
      band,
      attemptedCount: st.attemptedCount,
      solvedCount: st.solvedCount,
      solveRate: st.attemptedCount > 0 ? (st.solvedCount / st.attemptedCount) : 0,
      avgAcAttempts: st.solvedCount > 0 ? (st.totalAcAttempts / st.solvedCount) : 0,
      sortKey: parseInt(band.split("-")[0], 10),
    };
  });

  results.sort((a, b) => a.sortKey - b.sortKey);

  const tableRows = results.map(r => [
    r.band,
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
    `Weakness Analysis for **${handle}** (AtCoder)`,
    "*(Grouped by difficulty band since AtCoder lacks official problem tags)*",
    "",
    formatMarkdownTable(["Difficulty Band", "Attempted", "Solved", "Solve Rate", "Avg AC Attempts"], tableRows),
    syncStatus.partialNote ? `\nNote: ${syncStatus.partialNote}` : "",
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      handle,
      results: results.map(r => ({
        band: r.band,
        attemptedCount: r.attemptedCount,
        solvedCount: r.solvedCount,
        solveRate: r.solveRate,
        avgAcAttempts: r.avgAcAttempts
      })),
      source: syncStatus.upstreamCalls > 0 ? "live" : "cache",
      upstreamCalls: syncStatus.upstreamCalls,
      partial: syncStatus.partial,
    },
  };
}
