import { z } from "zod";
import { getDb } from "../cache/db.js";
import { parseAtcoderProblem } from "../domain/normalize.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { DbProblemRow } from "../domain/types.js";

export const getProblemAtcoderSchema = z.object({
  problem: z.string().trim().min(1, "Problem parameter must not be empty"),
});

type GetProblemAtcoderArgs = z.infer<typeof getProblemAtcoderSchema>;

export async function handleGetProblemAtcoder(args: GetProblemAtcoderArgs) {
  const { problem } = args;

  let contestId: string;
  let problemId: string;
  try {
    const parsed = parseAtcoderProblem(problem);
    contestId = parsed.contestId;
    problemId = parsed.problemId; // full id like "abc300_c"
  } catch (err: unknown) {
    return {
      content: [{ type: "text" as const, text: err instanceof Error ? err.message : String(err) }],
      isError: true,
    };
  }

  // siteId is the full problem id; problemId already has the full "abc300_c" form
  const siteId = problemId;
  const id = `ac:${siteId}`;
  const db = getDb();

  const row = db.prepare("SELECT * FROM problems WHERE id = ?").get(id) as DbProblemRow | undefined;

  if (!row) {
    return {
      content: [{ type: "text" as const, text: `Problem "${problem}" (parsed as ${id}) not found in the AtCoder problem catalogue. Run a search first to warm the catalogue.` }],
      isError: true,
    };
  }

  const footer = buildFreshnessFooter({ source: "cache", upstreamCalls: 0, partial: false });
  const difficultyLabel = row.difficulty != null
    ? `${row.difficulty} (CF-equiv, ${row.difficulty_confidence === "low" ? "low confidence" : "estimated"})`
    : "Unknown";

  const text = [
    `**${row.name}**`,
    `* Problem ID: ${row.id}`,
    `* Contest: ${row.contest_id ?? "?"}`,
    `* URL: ${row.url}`,
    `* Difficulty: ${difficultyLabel}`,
    `* Solvers: ${row.solved_count ?? "?"}`,
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      site: "atcoder",
      id: row.id,
      siteId: row.site_id,
      name: row.name,
      url: row.url,
      contestId: row.contest_id,
      difficulty: row.difficulty,
      difficultySource: row.difficulty_source,
      difficultyConfidence: row.difficulty_confidence,
      solvedCount: row.solved_count,
      source: "cache",
      upstreamCalls: 0,
    },
  };
}
