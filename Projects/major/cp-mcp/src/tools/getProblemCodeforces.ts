import { z } from "zod";
import { getDb } from "../cache/db.js";
import { getDbKv, setDbKv } from "../cache/kv.js";
import { syncCfProblemCatalogue } from "../cache/sync.js";
import {
  parseCodeforcesProblem,
  parseCodeforcesStatementHtml,
} from "../domain/normalize.js";
import { politeFetch } from "../upstream/http.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { Problem, DbProblemRow } from "../domain/types.js";

export const getProblemCodeforcesSchema = z.object({
  problem: z.string().trim().min(1, "Problem parameter must not be empty"),
  include_statement: z.boolean().default(false),
});

type GetProblemCodeforcesArgs = z.infer<typeof getProblemCodeforcesSchema>;

export async function handleGetProblemCodeforces(
  args: GetProblemCodeforcesArgs
) {
  const { problem, include_statement } = args;

  let contestId: number;
  let index: string;
  try {
    const parsed = parseCodeforcesProblem(problem);
    contestId = parsed.contestId;
    index = parsed.index;
  } catch (err: unknown) {
    return {
      content: [
        {
          type: "text" as const,
          text: err instanceof Error ? err.message : String(err),
        },
      ],
      isError: true,
    };
  }

  const siteId = `${contestId}${index}`;
  const problemId = `cf:${siteId}`;
  const db = getDb();
  let upstreamCalls = 0;
  let source: "cache" | "live" = "cache";

  let row = db.prepare("SELECT * FROM problems WHERE id = ?").get(problemId) as
    DbProblemRow | undefined;

  if (!row) {
    try {
      // Problem not found in SQLite catalogue yet. Let's sync.
      await syncCfProblemCatalogue(true);
      upstreamCalls += 1;
      row = db.prepare("SELECT * FROM problems WHERE id = ?").get(problemId) as
        DbProblemRow | undefined;
      source = "live";
    } catch (syncErr: unknown) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to find problem ${problemId} in database and live catalogue sync failed: ${
              syncErr instanceof Error ? syncErr.message : String(syncErr)
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  if (!row) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Problem "${problem}" (parsed as ${problemId}) not found in the Codeforces problem catalogue.`,
        },
      ],
      isError: true,
    };
  }

  // Row exists; normalise
  const problemObj: Problem = {
    site: "codeforces",
    id: row.id,
    siteId: row.site_id,
    name: row.name,
    url: row.url,
    contestId: row.contest_id || "",
    difficulty: row.difficulty !== null ? Number(row.difficulty) : undefined,
    difficultySource: row.difficulty_source,
    difficultyConfidence:
      row.difficulty_confidence !== null
        ? row.difficulty_confidence
        : undefined,
    tags: JSON.parse(row.tags || "[]"),
    solvedCount:
      row.solved_count !== null ? Number(row.solved_count) : undefined,
    points: row.points !== null ? Number(row.points) : undefined,
  };

  let statementText = "";
  let statementSource = "none";

  if (include_statement) {
    if (process.env.CP_MCP_ENABLE_STATEMENTS === "false") {
      statementText =
        "\n*Note: Problem statement fetching is disabled by server configuration (CP_MCP_ENABLE_STATEMENTS=false).*";
      statementSource = "disabled";
    } else {
      const statementKey = `cf:statement:${contestId}:${index}`;
      // Statement has 30 days TTL, up to 100 days SWR fallback
      const cached = getDbKv<string>(statementKey, 100 * 24 * 60 * 60);

      if (cached && cached.status === "hit") {
        statementText = cached.data;
        statementSource = "cache";
      } else {
        // Fetch statement page from Codeforces
        const pageUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
        try {
          const response = await politeFetch(pageUrl);
          upstreamCalls += 1;

          if (response.ok) {
            const html = await response.text();
            const statementMarkdown = parseCodeforcesStatementHtml(html);
            if (statementMarkdown) {
              setDbKv(statementKey, statementMarkdown, 30 * 24 * 60 * 60);
              statementText = statementMarkdown;
              statementSource = "live";
            } else {
              throw new Error(
                "Could not parse problem statement from HTML structure"
              );
            }
          } else {
            throw new Error(`HTTP status ${response.status}`);
          }
        } catch (fetchErr: unknown) {
          // If we had a stale cache entry, fallback to it
          if (cached) {
            statementText = cached.data;
            statementSource = "stale_fallback";
          } else {
            statementText = `\n*Warning: Failed to fetch problem statement: ${
              fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
            }*`;
            statementSource = "failed";
          }
        }
      }
    }
  }

  // Format response text
  const tagsStr =
    problemObj.tags.length > 0 ? problemObj.tags.join(", ") : "None";
  const lines = [
    `Problem: ${problemObj.name} (${problemObj.id})`,
    `- URL: ${problemObj.url}`,
    `- Difficulty: ${problemObj.difficulty !== undefined ? problemObj.difficulty : "Unknown"}`,
    `- Tags: ${tagsStr}`,
    `- Solved Count: ${problemObj.solvedCount !== undefined ? problemObj.solvedCount : "Unknown"}`,
  ];

  if (problemObj.points !== undefined) {
    lines.push(`- Points: ${problemObj.points}`);
  }

  if (include_statement && statementText) {
    lines.push("", statementText);
  }

  const footer = buildFreshnessFooter({
    source:
      statementSource !== "none" && statementSource !== "disabled"
        ? `${source} (statement: ${statementSource})`
        : source,
    upstreamCalls,
    partial: false,
  });
  lines.push("", footer);

  const structuredContent = {
    ...problemObj,
    statement:
      include_statement &&
      statementSource !== "disabled" &&
      statementSource !== "failed"
        ? statementText
        : undefined,
    source,
    statementSource,
    upstreamCalls,
    partial: false,
  };

  return {
    content: [
      {
        type: "text" as const,
        text: lines.join("\n"),
      },
    ],
    structuredContent,
  };
}
