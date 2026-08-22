import { z } from "zod";
import { getDb } from "../cache/db.js";
import { syncUserSubmissions } from "../cache/sync.js";
import { parseAtcoderProblem } from "../domain/normalize.js";
import { verifySubmissionChain } from "../domain/verify.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { resolveHandle } from "../domain/config.js";

export const verifySolvedAtcoderSchema = z.object({
  handle: z.string().regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid AtCoder handle").optional(),
  problems: z
    .array(z.string().min(1))
    .min(1)
    .max(25, "Max 25 problems per call"),
  since: z
    .string()
    .optional()
    .describe("ISO date or relative like '30d'. Only flags withinWindow if AC is after this time."),
});

type VerifySolvedAtcoderArgs = z.infer<typeof verifySolvedAtcoderSchema>;

export async function handleVerifySolvedAtcoder(args: VerifySolvedAtcoderArgs) {
  const { problems, since } = args;
  const handle = resolveHandle("atcoder", args.handle);

  let sinceEpoch = 0;
  if (since) {
    if (since.endsWith("d")) {
      const days = parseInt(since, 10);
      sinceEpoch = Math.floor(Date.now() / 1000) - days * 86400;
    } else {
      sinceEpoch = Math.floor(new Date(since).getTime() / 1000);
    }
  }

  const syncStatus = await syncUserSubmissions("atcoder", handle);
  const db = getDb();

  const allSubs = db
    .prepare("SELECT * FROM submissions WHERE site = 'atcoder' AND handle = ?")
    .all(handle) as Array<{
      id: string;
      problem_id: string;
      at: number;
      verdict: string;
      testset: string | null;
      language: string;
    }>;

  const parsedProblems: Array<{ input: string; id: string; name: string; url: string } | { input: string; error: string }> = [];

  for (const p of problems) {
    try {
      const parsed = parseAtcoderProblem(p);
      // parsed.problemId is already the full "abc300_c" form
      parsedProblems.push({
        input: p,
        id: `ac:${parsed.problemId}`,
        name: parsed.problemId,
        url: `https://atcoder.jp/contests/${parsed.contestId}/tasks/${parsed.problemId}`,
      });
    } catch {
      parsedProblems.push({ input: p, error: `Cannot parse "${p}" as an AtCoder problem ID` });
    }
  }

  const results = parsedProblems.map(entry => {
    if ("error" in entry) return { input: entry.input, error: entry.error };

    const subs = allSubs
      .filter(s => s.problem_id === entry.id)
      .map(s => ({
        site: "atcoder" as const,
        problemId: s.problem_id,
        submissionId: s.id,
        at: new Date(s.at * 1000).toISOString(),
        verdict: s.verdict as "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "OTHER",
        rawVerdict: s.verdict,
        language: s.language,
      }));

    return {
      input: entry.input,
      result: verifySubmissionChain(entry.id, entry.name, entry.url, subs, sinceEpoch),
    };
  });

  const statusEmoji = (s: string) => s === "solved" ? "✓" : s === "attempted" ? "~" : "✗";

  const tableRows = results.map(r => {
    if ("error" in r) return [r.input, "ERROR", r.error ?? "Parse error", "—", "—"];
    const res = r.result;
    return [
      `[${res.problemId.replace("ac:", "")}](${res.url})`,
      `${statusEmoji(res.status)} ${res.status}`,
      res.firstAcAt ? res.firstAcAt.substring(0, 16).replace("T", " ") + " UTC" : "—",
      String(res.attempts),
      res.distinctVerdicts.join(", ") || "—",
    ];
  });

  const solvedCount = results.filter(r => !("error" in r) && r.result.status === "solved").length;
  const total = problems.length;
  const sinceLabel = since ? ` | window: ${since}` : "";

  const footer = buildFreshnessFooter({
    source: syncStatus.upstreamCalls > 0 ? "live" : "cache",
    upstreamCalls: syncStatus.upstreamCalls,
    partial: syncStatus.partial,
  });

  const text = [
    `AtCoder Verification for **${handle}**: ${solvedCount}/${total} solved${sinceLabel}`,
    "",
    formatMarkdownTable(["Problem", "Status", "First AC (UTC)", "Attempts", "Verdicts"], tableRows),
    syncStatus.partialNote ? `\nNote: ${syncStatus.partialNote}` : "",
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      handle,
      results,
      solvedCount,
      total,
      source: syncStatus.upstreamCalls > 0 ? "live" : "cache",
      upstreamCalls: syncStatus.upstreamCalls,
      partial: syncStatus.partial,
    },
  };
}
