import { z } from "zod";
import { getDb } from "../cache/db.js";
import { syncUserSubmissions } from "../cache/sync.js";
import { parseCodeforcesProblem } from "../domain/normalize.js";
import { verifySubmissionChain } from "../domain/verify.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { resolveHandle } from "../domain/config.js";

export const verifySolvedCodeforcesSchema = z.object({
  handle: z.string().regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid Codeforces handle").optional(),
  problems: z
    .array(z.string().min(1))
    .min(1)
    .max(25, "Max 25 problems per call"),
  since: z
    .string()
    .optional()
    .describe("ISO date or relative like '30d'. Only flags withinWindow if AC is after this time."),
});

type VerifySolvedCodeforcesArgs = z.infer<typeof verifySolvedCodeforcesSchema>;

export async function handleVerifySolvedCodeforces(args: VerifySolvedCodeforcesArgs) {
  const { problems, since } = args;
  const handle = resolveHandle("codeforces", args.handle);

  let sinceEpoch = 0;
  if (since) {
    if (since.endsWith("d")) {
      const days = parseInt(since, 10);
      sinceEpoch = Math.floor(Date.now() / 1000) - days * 86400;
    } else {
      sinceEpoch = Math.floor(new Date(since).getTime() / 1000);
    }
  }

  const syncStatus = await syncUserSubmissions("codeforces", handle);
  const db = getDb();

  const allSubs = db
    .prepare("SELECT * FROM submissions WHERE site = 'codeforces' AND handle = ?")
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
      const parsed = parseCodeforcesProblem(p);
      const siteId = `${parsed.contestId}${parsed.index}`;
      parsedProblems.push({
        input: p,
        id: `cf:${siteId}`,
        name: siteId,
        url: `https://codeforces.com/problemset/problem/${parsed.contestId}/${parsed.index}`,
      });
    } catch {
      parsedProblems.push({ input: p, error: `Cannot parse "${p}" as a Codeforces problem ID` });
    }
  }

  const results = parsedProblems.map(entry => {
    if ("error" in entry) return { input: entry.input, error: entry.error };

    const subs = allSubs
      .filter(s => s.problem_id === entry.id)
      .map(s => ({
        site: "codeforces" as const,
        problemId: s.problem_id,
        submissionId: s.id,
        at: new Date(s.at * 1000).toISOString(),
        verdict: s.verdict as "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "OTHER",
        rawVerdict: s.verdict,
        language: s.language,
        testset: s.testset ?? undefined,
      }));

    return {
      input: entry.input,
      result: verifySubmissionChain(entry.id, entry.name, entry.url, subs, sinceEpoch, syncStatus.complete),
    };
  });

  const statusEmoji = (s: string) => s === "solved" ? "✓" : s === "attempted" ? "~" : s === "unknown" ? "?" : "✗";

  const tableRows = results.map(r => {
    if ("error" in r) return [r.input, "ERROR", r.error ?? "Parse error", "—", "—"];
    const res = r.result;
    return [
      `[${res.problemId.replace("cf:", "")}](${res.url})`,
      `${statusEmoji(res.status)} ${res.status}`,
      res.firstAcAt ? res.firstAcAt.substring(0, 16).replace("T", " ") + " UTC" : "—",
      String(res.attempts),
      res.status === "unknown" ? "not in synced history yet" : (res.distinctVerdicts.join(", ") || "—"),
    ];
  });

  const solvedCount = results.filter(r => !("error" in r) && r.result.status === "solved").length;
  const unknownCount = results.filter(r => !("error" in r) && r.result.status === "unknown").length;
  const total = problems.length;
  const sinceLabel = since ? ` | window: ${since}` : "";
  const unknownLabel = unknownCount > 0 ? `, ${unknownCount} unknown` : "";

  const footer = buildFreshnessFooter({
    source: syncStatus.upstreamCalls > 0 ? "live" : "cache",
    upstreamCalls: syncStatus.upstreamCalls,
    partial: syncStatus.partial,
  });

  const unknownNote = "Older submission history is still downloading, so rows marked \"?\" can't be judged yet — ask again shortly.";
  const note = unknownCount > 0 ? unknownNote : syncStatus.partialNote;

  const text = [
    `Codeforces Verification for **${handle}**: ${solvedCount}/${total} solved${unknownLabel}${sinceLabel}`,
    "",
    formatMarkdownTable(["Problem", "Status", "First AC (UTC)", "Attempts", "Verdicts"], tableRows),
    note ? `\nNote: ${note}` : "",
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      handle,
      results,
      solvedCount,
      unknownCount,
      total,
      source: syncStatus.upstreamCalls > 0 ? "live" : "cache",
      upstreamCalls: syncStatus.upstreamCalls,
      partial: syncStatus.partial,
      complete: syncStatus.complete,
    },
  };
}
