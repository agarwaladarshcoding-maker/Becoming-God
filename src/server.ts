import {
  McpServer,
  ToolCallback,
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
        "Get a Codeforces user profile: current rating, max rating, rank title, solved count and last activity. Use for 'what is my rating on Codeforces' questions. For solved/unsolved questions about specific Codeforces problems, use cp_verify_solved_codeforces instead.",
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
        "Get Codeforces rating history for a user, containing date, contest name, rank, old/new rating, delta and a trend summary.",
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

  return server;
}
