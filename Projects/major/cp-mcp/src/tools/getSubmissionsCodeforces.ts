import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDb } from "../cache/db.js";
import { syncUserSubmissions } from "../cache/sync.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { resolveHandle } from "../domain/config.js";

export function registerGetSubmissionsCodeforces(server: McpServer) {
  server.tool(
    "cp_get_submissions_codeforces",
    "List a handle's recent Codeforces submissions, newest first, with verdicts. Use for 'what did I attempt on Codeforces', debugging patterns or language stats. For a yes/no answer about specific problems use cp_verify_solved_codeforces, which is cheaper and exact. handle is optional and defaults to the configured user (CP_MCP_CF_HANDLE) when omitted.",
    {
      handle: z.string().regex(/^[A-Za-z0-9_.-]{1,32}$/).optional(),
      since: z.string().optional().describe("ISO date or relative like '7d'."),
      verdict: z.enum(["any", "accepted", "failed"]).default("any"),
      problem: z.string().optional().describe("Optional: restrict to one problem id."),
      limit: z.number().int().min(1).max(50).default(20),
    },
    async (args) => {
      const handle = resolveHandle("codeforces", args.handle);
      const syncStatus = await syncUserSubmissions("codeforces", handle);
      const db = getDb();

      let query = "SELECT * FROM submissions WHERE site = 'codeforces' AND handle = ?";
      const params: any[] = [handle];

      if (args.problem) {
         let p = args.problem.toLowerCase();
         if (!p.startsWith("cf:")) p = "cf:" + p;
         query += " AND problem_id = ?";
         params.push(p);
      }

      if (args.verdict === "accepted") {
         query += " AND verdict = 'OK' AND testset = 'TESTS'";
      } else if (args.verdict === "failed") {
         query += " AND NOT (verdict = 'OK' AND testset = 'TESTS')";
      }

      if (args.since) {
         // rough parse
         let sinceEpoch = 0;
         if (args.since.endsWith("d")) {
            const days = parseInt(args.since);
            sinceEpoch = Math.floor(Date.now()/1000) - days * 86400;
         } else {
            sinceEpoch = Math.floor(new Date(args.since).getTime() / 1000);
         }
         if (!isNaN(sinceEpoch)) {
            query += " AND at >= ?";
            params.push(sinceEpoch);
         }
      }

      query += " ORDER BY at DESC LIMIT ?";
      params.push(args.limit);

      const rows = db.prepare(query).all(...params) as any[];

      const mapped = rows.map(r => ({
          at: new Date(r.at * 1000).toISOString().replace("T", " ").substring(0, 16),
          problem: r.problem_id.replace("cf:", ""),
          verdict: r.verdict,
          lang: r.language
      }));

      const rowArrays = mapped.map(r => [r.at, r.problem, r.verdict, r.lang]);
const mdTable = formatMarkdownTable(["at", "problem", "verdict", "lang"], rowArrays);
      
      const freshness = buildFreshnessFooter({
          source: "live sync",
          upstreamCalls: syncStatus.upstreamCalls,
          partial: syncStatus.partial
      });

      return {
          content: [
              { type: "text" as const, text: mapped.length > 0 ? mdTable + "\n\n" + freshness : "No submissions found.\n\n" + freshness }
          ],
          // structuredContent goes here if required, though the SDK doesn't strictly have a structuredContent field in the result type, just content.
      };
    }
  );
}
