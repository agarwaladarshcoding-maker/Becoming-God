import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDb } from "../cache/db.js";
import { syncUserSubmissions } from "../cache/sync.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";

export function registerGetSubmissionsAtcoder(server: McpServer) {
  server.tool(
    "cp_get_submissions_atcoder",
    "List a handle's recent AtCoder submissions, newest first, with verdicts. Use for 'what did I attempt on AtCoder', debugging patterns or language stats. For a yes/no answer about specific problems use cp_verify_solved_atcoder, which is cheaper and exact.",
    {
      handle: z.string().regex(/^[A-Za-z0-9_.-]{1,32}$/),
      since: z.string().optional().describe("ISO date or relative like '7d'."),
      verdict: z.enum(["any", "accepted", "failed"]).default("any"),
      problem: z.string().optional().describe("Optional: restrict to one problem id."),
      limit: z.number().int().min(1).max(50).default(20),
    },
    async (args) => {
      const syncStatus = await syncUserSubmissions("atcoder", args.handle);
      const db = getDb();

      let query = "SELECT * FROM submissions WHERE site = 'atcoder' AND handle = ?";
      const params: any[] = [args.handle];

      if (args.problem) {
         let p = args.problem.toLowerCase();
         if (!p.startsWith("ac:")) p = "ac:" + p;
         query += " AND problem_id = ?";
         params.push(p);
      }

      if (args.verdict === "accepted") {
         query += " AND verdict = 'AC'";
      } else if (args.verdict === "failed") {
         query += " AND verdict != 'AC'";
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
          problem: r.problem_id.replace("ac:", ""),
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
              { type: "text" as const, text: mapped.length > 0 ? mdTable + "\n\n" + (syncStatus.partialNote ? `Note: ${syncStatus.partialNote}\n` : "") + freshness : "No submissions found.\n\n" + (syncStatus.partialNote ? `Note: ${syncStatus.partialNote}\n` : "") + freshness }
          ],
      };
    }
  );
}
