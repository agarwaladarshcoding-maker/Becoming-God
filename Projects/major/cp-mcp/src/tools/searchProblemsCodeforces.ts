import { z } from "zod";
import { getDb } from "../cache/db.js";
import { syncCfProblemCatalogue } from "../cache/sync.js";
import {
  filterProblems,
  rankProblems,
  seededShuffle,
} from "../domain/search.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { Problem, DbProblemRow } from "../domain/types.js";

export const searchProblemsCodeforcesSchema = z.object({
  min_difficulty: z.number().int().min(0).max(4000),
  max_difficulty: z.number().int().min(0).max(4000),
  tags: z.array(z.string()).optional(),
  tag_mode: z.enum(["any", "all"]).default("any"),
  exclude_solved_by: z
    .string()
    .optional()
    .describe(
      "Codeforces handle to exclude already-solved problems for. Pass the configured user's handle explicitly if you want that behavior; omitted, no exclusion is applied."
    ),
  min_solved_count: z.number().int().default(200),
  limit: z.number().int().min(1).max(25).default(10),
  seed: z.number().int().optional(),
});

type SearchProblemsCodeforcesArgs = z.infer<
  typeof searchProblemsCodeforcesSchema
>;

export async function handleSearchProblemsCodeforces(
  args: SearchProblemsCodeforcesArgs
) {
  const {
    min_difficulty,
    max_difficulty,
    tags,
    tag_mode,
    exclude_solved_by,
    min_solved_count,
    limit,
    seed,
  } = args;

  if (min_difficulty > max_difficulty) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Invalid difficulty range: min_difficulty (${min_difficulty}) cannot be greater than max_difficulty (${max_difficulty}).`,
        },
      ],
      isError: true,
    };
  }

  const db = getDb();
  let upstreamCalls = 0;
  let source: "cache" | "live" = "cache";

  // Ensure problem catalogue is synchronized
  try {
    const syncRes = await syncCfProblemCatalogue();
    source = syncRes.source;
    if (syncRes.source === "live") {
      upstreamCalls += 1;
    }
  } catch (err: unknown) {
    // Failing to sync catalog from live shouldn't fail search if we have data in cache
    const checkCount = db
      .prepare(
        "SELECT count(*) as count FROM problems WHERE site = 'codeforces'"
      )
      .get() as { count: number };
    if (checkCount.count === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Problem catalogue is empty and synchronization failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  // Load solved problems if handle is provided
  const excludeSolvedIds = new Set<string>();
  if (exclude_solved_by) {
    const normalizedHandle = exclude_solved_by.toLowerCase().trim();
    const rows = db
      .prepare(
        "SELECT problem_id FROM user_solved WHERE site = 'codeforces' AND LOWER(handle) = ?"
      )
      .all(normalizedHandle) as Array<{ problem_id: string }>;
    for (const row of rows) {
      excludeSolvedIds.add(row.problem_id);
    }
  }

  // Retrieve problems within difficulty band
  const dbRows = db
    .prepare(
      "SELECT * FROM problems WHERE site = 'codeforces' AND difficulty >= ? AND difficulty <= ?"
    )
    .all(min_difficulty, max_difficulty) as DbProblemRow[];

  const problems: Problem[] = dbRows.map((row) => ({
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
  }));

  // Apply filters: tags, solved exclusions, and minimum solved count
  const filtered = filterProblems(problems, {
    tags,
    tagMode: tag_mode,
    excludeSolvedIds: excludeSolvedIds.size > 0 ? excludeSolvedIds : undefined,
    minSolvedCount: min_solved_count,
  });

  // Rank problems
  const ranked = rankProblems(filtered, min_difficulty, max_difficulty);

  // Implement seeded shuffle if requested (takes top limit * 3 candidates)
  let finalProblems: Problem[];
  if (seed !== undefined) {
    const sliceLimit = limit * 3;
    const slice = ranked.slice(0, sliceLimit);
    const shuffled = seededShuffle(slice, seed);
    finalProblems = shuffled.slice(0, limit);
  } else {
    finalProblems = ranked.slice(0, limit);
  }

  if (finalProblems.length === 0) {
    const filterDesc = [
      `difficulty band ${min_difficulty}-${max_difficulty}`,
      tags && tags.length > 0 ? `tags: [${tags.join(", ")}] (${tag_mode})` : "",
      exclude_solved_by ? `excluding solved by ${exclude_solved_by}` : "",
      min_solved_count > 0 ? `min solvers: ${min_solved_count}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    return {
      content: [
        {
          type: "text" as const,
          text: `No problems found matching the criteria: ${filterDesc}.`,
        },
      ],
      structuredContent: {
        problems: [],
        source,
        upstreamCalls,
        partial: false,
      },
    };
  }

  // Format output as Markdown Table
  const headers = ["#", "ID", "Name", "Difficulty", "Tags", "URL"];
  const tableRows = finalProblems.map((p, idx) => [
    String(idx + 1),
    p.id,
    p.name,
    p.difficulty !== undefined ? String(p.difficulty) : "Unknown",
    p.tags.join(", "),
    p.url,
  ]);

  const mdTable = formatMarkdownTable(headers, tableRows);

  const footer = buildFreshnessFooter({
    source,
    upstreamCalls,
    partial: false,
  });

  const textOutput = [
    `Found ${finalProblems.length} Codeforces problem${finalProblems.length === 1 ? "" : "s"} (${min_difficulty}-${max_difficulty}):`,
    "",
    mdTable,
    "",
    footer,
  ].join("\n");

  return {
    content: [
      {
        type: "text" as const,
        text: textOutput,
      },
    ],
    structuredContent: {
      problems: finalProblems,
      source,
      upstreamCalls,
      partial: false,
    },
  };
}
