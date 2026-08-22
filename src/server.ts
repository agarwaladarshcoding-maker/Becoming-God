import {
  McpServer,
  ToolCallback,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import crypto from "crypto";
import {
  getUserCodeforcesSchema,
  handleGetUserCodeforces,
} from "./tools/getUserCodeforces.js";
import {
  searchProblemsCodeforcesSchema,
  handleSearchProblemsCodeforces,
} from "./tools/searchProblemsCodeforces.js";
import {
  ratingHistoryCodeforcesSchema,
  handleRatingHistoryCodeforces,
} from "./tools/ratingHistoryCodeforces.js";
import {
  getProblemCodeforcesSchema,
  handleGetProblemCodeforces,
} from "./tools/getProblemCodeforces.js";
import {
  verifySolvedCodeforcesSchema,
  handleVerifySolvedCodeforces,
} from "./tools/verifySolvedCodeforces.js";
import {
  getUserAtcoderSchema,
  handleGetUserAtcoder,
} from "./tools/getUserAtcoder.js";
import {
  ratingHistoryAtcoderSchema,
  handleRatingHistoryAtcoder,
} from "./tools/ratingHistoryAtcoder.js";
import {
  searchProblemsAtcoderSchema,
  handleSearchProblemsAtcoder,
} from "./tools/searchProblemsAtcoder.js";
import {
  getProblemAtcoderSchema,
  handleGetProblemAtcoder,
} from "./tools/getProblemAtcoder.js";
import {
  verifySolvedAtcoderSchema,
  handleVerifySolvedAtcoder,
} from "./tools/verifySolvedAtcoder.js";
import { registerGetSubmissionsCodeforces } from "./tools/getSubmissionsCodeforces.js";
import { registerGetSubmissionsAtcoder } from "./tools/getSubmissionsAtcoder.js";
import { analyzeWeaknessesCodeforcesSchema, handleAnalyzeWeaknessesCodeforces } from "./tools/analyzeWeaknessesCodeforces.js";
import { analyzeWeaknessesAtcoderSchema, handleAnalyzeWeaknessesAtcoder } from "./tools/analyzeWeaknessesAtcoder.js";
import { getDb } from "./cache/db.js";
import { resolveHandle } from "./domain/config.js";
import { formatMarkdownTable } from "./format/table.js";
import { buildFreshnessFooter } from "./format/freshness.js";

/**
 * Helper to register CP tools with standardization and logging.
 */
function registerCpTool<T extends z.ZodTypeAny>(
  server: McpServer,
  name: string,
  config: {
    description: string;
    inputSchema: T;
    annotations?: {
      title?: string;
      readOnlyHint?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
      openWorldHint?: boolean;
    };
  },
  handler: (args: z.infer<T>) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  }>
) {
  server.registerTool<z.ZodTypeAny, T>(name, config, (async (args: unknown) => {
    const startTime = Date.now();
    let ok = false;
    let cache: "hit" | "miss" | "stale" = "miss";
    let upstreamCalls = 0;

    try {
      const result = await handler(args as z.infer<T>);
      ok = !result.isError;
      if (result && result.structuredContent) {
        const sc = result.structuredContent as Record<string, unknown>;
        if (sc.source === "cache") {
          cache = "hit";
        } else if (sc.source === "stale") {
          cache = "stale";
        } else if (sc.source === "live" || sc.source === "local") {
          cache = "miss";
        }
        if (typeof sc.upstreamCalls === "number") {
          upstreamCalls = sc.upstreamCalls;
        }
      }
      return result as CallToolResult;
    } catch (err) {
      ok = false;
      throw err;
    } finally {
      const ms = Date.now() - startTime;
      const argsHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(args))
        .digest("hex")
        .slice(0, 8);
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          tool: name,
          args_hash: argsHash,
          cache,
          upstream_calls: upstreamCalls,
          ms,
          ok,
        })
      );
    }
  }) as ToolCallback<T>);
}

/**
 * Builds and configures the CP-MCP server instance.
 */
export function buildServer(): McpServer {
  const server = new McpServer({
    name: "cp-mcp",
    version: "0.1.0",
  });

  // Register the ping tool
  server.registerTool(
    "ping",
    {
      description: "Ping the server to check health and connectivity.",
      inputSchema: z.object({}),
    },
    async () => {
      const text = "pong\n\nsource: local | 0 upstream calls | partial: no";
      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
        structuredContent: {
          status: "pong",
          source: "local",
          upstreamCalls: 0,
          partial: false,
        },
      };
    }
  );

  // Register cp_get_user_codeforces tool
  registerCpTool(
    server,
    "cp_get_user_codeforces",
    {
      description:
        "Get a Codeforces user profile: current rating, max rating, rank title, solved count and last activity. Use for 'what is my rating on Codeforces' questions. For solved/unsolved questions about specific Codeforces problems, use cp_verify_solved_codeforces instead. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_CF_HANDLE).",
      inputSchema: getUserCodeforcesSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleGetUserCodeforces
  );

  // Register cp_search_problems_codeforces tool
  registerCpTool(
    server,
    "cp_search_problems_codeforces",
    {
      description:
        "Find practice problems on Codeforces within a difficulty band, optionally filtered by topic tags and optionally excluding problems a given handle already solved. This is the tool for building Codeforces practice ladders. Difficulty uses the official Codeforces rating scale (800-3500). Returns at most `limit` problems, ranked by proximity to the band centre and by solver count.",
      inputSchema: searchProblemsCodeforcesSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleSearchProblemsCodeforces
  );

  // Register cp_rating_history_codeforces tool
  registerCpTool(
    server,
    "cp_rating_history_codeforces",
    {
      description:
        "Get Codeforces rating history for a user, containing date, contest name, rank, old/new rating, delta and a trend summary. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_CF_HANDLE).",
      inputSchema: ratingHistoryCodeforcesSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleRatingHistoryCodeforces
  );

  // Register cp_get_problem_codeforces tool
  registerCpTool(
    server,
    "cp_get_problem_codeforces",
    {
      description:
        "Get metadata for one Codeforces problem by id or URL: name, difficulty, tags, solver count and canonical link. Set include_statement true only when the user explicitly needs the problem text.",
      inputSchema: getProblemCodeforcesSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleGetProblemCodeforces
  );

  // Register cp_verify_solved_codeforces tool
  registerCpTool(
    server,
    "cp_verify_solved_codeforces",
    {
      description:
        "Machine-verify whether a Codeforces handle has solved specific problems, using submission history (verdict=OK, testset=TESTS). Returns solved/attempted/unseen per problem with first-AC timestamp and attempt count. Use this instead of cp_get_user_codeforces for solved/unsolved questions about specific problems. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_CF_HANDLE).",
      inputSchema: verifySolvedCodeforcesSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleVerifySolvedCodeforces
  );

  
  // Register cp_analyze_weaknesses_codeforces tool
  registerCpTool(
    server,
    "cp_analyze_weaknesses_codeforces",
    {
      description:
        "Analyze a Codeforces user's weaknesses by grouping their attempted and solved problems by tags. Calculates solve rate and average attempts per tag. Useful for identifying topics to practice. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_CF_HANDLE).",
      inputSchema: analyzeWeaknessesCodeforcesSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleAnalyzeWeaknessesCodeforces
  );

  // Register getSubmissions tools (use server.tool() internally)
  registerGetSubmissionsCodeforces(server);

  // Register AtCoder tools
  registerCpTool(
    server,
    "cp_get_user_atcoder",
    {
      description:
        "Get an AtCoder user profile: AC problem count and AC rank. Use for 'what is my AtCoder rank' questions. For solved/unsolved questions about specific AtCoder problems, use cp_verify_solved_atcoder instead. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_AC_HANDLE).",
      inputSchema: getUserAtcoderSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleGetUserAtcoder
  );

  registerCpTool(
    server,
    "cp_rating_history_atcoder",
    {
      description:
        "Get AtCoder rated contest history for a user: date, contest, placement, old/new rating, delta. Use for tracking rating progress or peak rating on AtCoder. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_AC_HANDLE).",
      inputSchema: ratingHistoryAtcoderSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleRatingHistoryAtcoder
  );

  registerCpTool(
    server,
    "cp_search_problems_atcoder",
    {
      description:
        "Find practice problems on AtCoder within a CF-equivalent difficulty band, optionally excluding problems a handle already solved. Difficulty uses a normalized Codeforces-equivalent scale (800-3500). For raw AtCoder difficulty scores, note these are IRT estimates normalized to CF scale.",
      inputSchema: searchProblemsAtcoderSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleSearchProblemsAtcoder
  );

  registerCpTool(
    server,
    "cp_get_problem_atcoder",
    {
      description:
        "Get metadata for one AtCoder problem by id or URL: name, difficulty (CF-equivalent), solver count, and canonical link. Requires the problem catalogue to be warmed — run cp_search_problems_atcoder first if not found.",
      inputSchema: getProblemAtcoderSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleGetProblemAtcoder
  );

  registerCpTool(
    server,
    "cp_verify_solved_atcoder",
    {
      description:
        "Machine-verify whether an AtCoder handle has solved specific problems, using submission history (result=AC). Returns solved/attempted/unseen per problem with first-AC timestamp and attempt count. Use this instead of cp_get_user_atcoder for solved/unsolved questions about specific problems. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_AC_HANDLE).",
      inputSchema: verifySolvedAtcoderSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleVerifySolvedAtcoder
  );

  registerGetSubmissionsAtcoder(server);

  // Register cp_analyze_weaknesses_atcoder tool
  registerCpTool(
    server,
    "cp_analyze_weaknesses_atcoder",
    {
      description:
        "Analyze an AtCoder user's weaknesses by grouping their attempted and solved problems by difficulty band. Calculates solve rate and average attempts per band. The handle argument is optional; when omitted it defaults to the user's configured handle (CP_MCP_AC_HANDLE).",
      inputSchema: analyzeWeaknessesAtcoderSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleAnalyzeWeaknessesAtcoder
  );


  
  
  // Register MCP Prompts

  server.prompt(
    "daily_ladder_codeforces",
    "Generates instructions to create a daily Codeforces practice ladder based on the user's weaknesses.",
    { handle: z.string().describe("Codeforces handle") as any },
    ({ handle }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a daily Codeforces practice ladder for the user '${handle}'. 
Please do the following:
1. Run cp_analyze_weaknesses_codeforces for '${handle}' to identify their weakest tags.
2. Run cp_search_problems_codeforces using the weakest tags, targeting a difficulty slightly above their current rating (or 1300-1500 if unknown). Exclude problems they have already solved.
3. Present the 3-5 selected problems as today's ladder.`
          }
        }
      ]
    })
  );

  server.prompt(
    "daily_ladder_atcoder",
    "Generates instructions to create a daily AtCoder practice ladder based on the user's weaknesses.",
    { handle: z.string().describe("AtCoder handle") as any },
    ({ handle }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a daily AtCoder practice ladder for the user '${handle}'. 
Please do the following:
1. Run cp_analyze_weaknesses_atcoder for '${handle}' to identify their weakest difficulty bands.
2. Run cp_search_problems_atcoder targeting a difficulty slightly above their current level (or 800-1200 if unknown). Exclude problems they have already solved.
3. Present the 3-5 selected problems as today's ladder.`
          }
        }
      ]
    })
  );

  server.prompt(
    "audit_yesterday_codeforces",
    "Generates instructions to verify if the user solved yesterday's assigned Codeforces problems.",
    { 
      handle: z.string().describe("Codeforces handle") as any, 
      problems: z.string().describe("Comma-separated list of problem IDs") as any 
    },
    ({ handle, problems }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Audit yesterday's Codeforces ladder for '${handle}'. 
The assigned problems were: ${problems}.
Please run cp_verify_solved_codeforces on these problems.
Report which ones were successfully solved, which were attempted but not solved, and which were untouched.`
          }
        }
      ]
    })
  );

  server.prompt(
    "audit_yesterday_atcoder",
    "Generates instructions to verify if the user solved yesterday's assigned AtCoder problems.",
    { 
      handle: z.string().describe("AtCoder handle") as any, 
      problems: z.string().describe("Comma-separated list of problem IDs") as any 
    },
    ({ handle, problems }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Audit yesterday's AtCoder ladder for '${handle}'. 
The assigned problems were: ${problems}.
Please run cp_verify_solved_atcoder on these problems.
Report which ones were successfully solved, which were attempted but not solved, and which were untouched.`
          }
        }
      ]
    })
  );

  // Register MCP Resources

  /**
   * Median of a sorted numeric array (average of the two middle values on
   * an even-length array). Computed in JS rather than SQL because the
   * standard SQLite build here has no PERCENTILE_CONT / window-function
   * median trick worth the complexity for a one-off summary stat.
   */
  function median(sorted: number[]): number | undefined {
    if (sorted.length === 0) return undefined;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  function buildProblemsSnapshot(site: "codeforces" | "atcoder") {
    const db = getDb();

    const summary = db
      .prepare(
        "SELECT COUNT(*) as total, COUNT(difficulty) as withDifficulty, MIN(difficulty) as minDifficulty, MAX(difficulty) as maxDifficulty, MAX(updated_at) as maxUpdatedAt FROM problems WHERE site = ?"
      )
      .get(site) as {
        total: number;
        withDifficulty: number;
        minDifficulty: number | null;
        maxDifficulty: number | null;
        maxUpdatedAt: number | null;
      };

    const difficulties = (
      db
        .prepare("SELECT difficulty FROM problems WHERE site = ? AND difficulty IS NOT NULL ORDER BY difficulty")
        .all(site) as Array<{ difficulty: number }>
    ).map((r) => r.difficulty);

    const medianDifficulty = median(difficulties);
    const snapshotAt = summary.maxUpdatedAt
      ? new Date(summary.maxUpdatedAt * 1000).toISOString()
      : "unknown";

    const rows = [
      ["Total problems", String(summary.total)],
      ["With a known difficulty", String(summary.withDifficulty)],
      ["Min difficulty", summary.minDifficulty !== null ? String(summary.minDifficulty) : "—"],
      ["Max difficulty", summary.maxDifficulty !== null ? String(summary.maxDifficulty) : "—"],
      ["Median difficulty", medianDifficulty !== undefined ? String(medianDifficulty) : "—"],
    ];

    const footer = buildFreshnessFooter({
      source: "local",
      upstreamCalls: 0,
      partial: false,
    });

    const siteLabel = site === "codeforces" ? "Codeforces" : "AtCoder";
    const text = [
      `${siteLabel} problem catalogue snapshot (as of ${snapshotAt})`,
      "",
      formatMarkdownTable(["Metric", "Value"], rows),
      "",
      footer,
    ].join("\n");

    return text;
  }

  function buildUserSolvedSnapshot(site: "codeforces" | "atcoder", handle: string) {
    const db = getDb();

    const { total } = db
      .prepare("SELECT COUNT(*) as total FROM user_solved WHERE site = ? AND handle = ?")
      .get(site, handle) as { total: number };

    const footer = buildFreshnessFooter({
      source: "local",
      upstreamCalls: 0,
      partial: false,
    });

    const siteLabel = site === "codeforces" ? "Codeforces" : "AtCoder";

    if (total === 0) {
      return [
        `No solved problems recorded for ${siteLabel} handle **${handle}** in the local cache. Run cp_verify_solved_${site} to sync submissions.`,
        "",
        footer,
      ].join("\n");
    }

    const recent = db
      .prepare(
        "SELECT problem_id, first_ac_at, attempts FROM user_solved WHERE site = ? AND handle = ? ORDER BY first_ac_at DESC LIMIT 50"
      )
      .all(site, handle) as Array<{ problem_id: string; first_ac_at: number | null; attempts: number | null }>;

    const rows = recent.map((r) => [
      r.problem_id,
      r.first_ac_at ? new Date(r.first_ac_at * 1000).toISOString().substring(0, 16).replace("T", " ") + " UTC" : "—",
      r.attempts !== null ? String(r.attempts) : "—",
    ]);

    const shownNote = total > recent.length ? ` (showing ${recent.length} most recent of ${total})` : "";
    const text = [
      `${siteLabel} solved problems for **${handle}**: ${total} total${shownNote}`,
      "",
      formatMarkdownTable(["Problem", "First AC (UTC)", "Attempts"], rows),
      "",
      footer,
    ].join("\n");

    return text;
  }

  server.registerResource(
    "cp_problems_snapshot_codeforces",
    "cp://problems/snapshot_codeforces",
    {
      title: "Codeforces problem catalogue snapshot",
      description: "Summary stats (counts, difficulty range/median, freshness) for the cached Codeforces problem catalogue.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: buildProblemsSnapshot("codeforces"),
        },
      ],
    })
  );

  server.registerResource(
    "cp_problems_snapshot_atcoder",
    "cp://problems/snapshot_atcoder",
    {
      title: "AtCoder problem catalogue snapshot",
      description: "Summary stats (counts, difficulty range/median, freshness) for the cached AtCoder problem catalogue.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: buildProblemsSnapshot("atcoder"),
        },
      ],
    })
  );

  server.registerResource(
    "cp_user_codeforces_solved",
    new ResourceTemplate("cp://user/codeforces/{handle}/solved", { list: undefined }),
    {
      title: "Codeforces user solved problems",
      description: "Solved-problem summary from the local cache for a Codeforces handle, most recent first (up to 50 shown).",
      mimeType: "text/markdown",
    },
    async (uri, variables) => {
      const rawHandle = variables.handle;
      const handleFromUri = Array.isArray(rawHandle) ? rawHandle[0] : rawHandle;
      const handle = resolveHandle("codeforces", handleFromUri);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: buildUserSolvedSnapshot("codeforces", handle),
          },
        ],
      };
    }
  );

  server.registerResource(
    "cp_user_atcoder_solved",
    new ResourceTemplate("cp://user/atcoder/{handle}/solved", { list: undefined }),
    {
      title: "AtCoder user solved problems",
      description: "Solved-problem summary from the local cache for an AtCoder handle, most recent first (up to 50 shown).",
      mimeType: "text/markdown",
    },
    async (uri, variables) => {
      const rawHandle = variables.handle;
      const handleFromUri = Array.isArray(rawHandle) ? rawHandle[0] : rawHandle;
      const handle = resolveHandle("atcoder", handleFromUri);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: buildUserSolvedSnapshot("atcoder", handle),
          },
        ],
      };
    }
  );

  return server;
}
