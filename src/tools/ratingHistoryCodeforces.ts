import { z } from "zod";
import { cfCall } from "../upstream/codeforces.js";
import { getCachedOrFetch } from "../cache/kv.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import {
  RawCfRatingChange,
  computeCfRatingStats,
} from "../domain/analytics.js";
import { resolveHandle } from "../domain/config.js";

export const ratingHistoryCodeforcesSchema = z.object({
  handle: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid Codeforces handle format")
    .optional(),
  limit: z.number().int().min(1).max(50).default(15),
  summary_only: z.boolean().default(false),
});

type RatingHistoryCodeforcesArgs = z.infer<
  typeof ratingHistoryCodeforcesSchema
>;

export async function handleRatingHistoryCodeforces(
  args: RatingHistoryCodeforcesArgs
) {
  const { limit, summary_only } = args;
  const handle = resolveHandle("codeforces", args.handle);
  const normalizedHandle = handle.toLowerCase().trim();

  try {
    const cacheKey = `cf:rating-history:${normalizedHandle}`;
    const { data: history, source } = await getCachedOrFetch<
      RawCfRatingChange[]
    >(
      cacheKey,
      3600, // TTL: 1 hour
      async () => {
        const result = await cfCall<RawCfRatingChange[]>("user.rating", {
          handle: normalizedHandle,
        });
        return { data: result };
      }
    );

    const upstreamCalls = source === "live" ? 1 : 0;

    if (!history || history.length === 0) {
      const footer = buildFreshnessFooter({
        source,
        upstreamCalls,
        partial: false,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `User ${handle} has not participated in any rated Codeforces contests.\n\n${footer}`,
          },
        ],
        structuredContent: {
          handle,
          history: [],
          stats: null,
          source,
          upstreamCalls,
          partial: false,
        },
      };
    }

    const stats = computeCfRatingStats(history);
    const recentHistory = history.slice(-limit);

    let textOutput = "";
    if (summary_only) {
      textOutput = [
        `Codeforces Rating Summary for ${handle}:`,
        `- Peak Rating: ${stats?.peakRating} (at ${stats?.peakContest} on ${stats?.peakDate})`,
        `- Best Delta: +${stats?.bestDelta} (${stats?.bestDeltaContest})`,
        `- Worst Delta: ${stats?.worstDelta} (${stats?.worstDeltaContest})`,
        `- Trend: ${stats?.trendText}`,
      ].join("\n");
    } else {
      const headers = ["Date", "Contest", "Rank", "Old -> New", "Delta"];
      const tableRows = [...recentHistory].reverse().map((change) => {
        const dateStr = new Date(change.ratingUpdateTimeSeconds * 1000)
          .toISOString()
          .split("T")[0];
        const delta = change.newRating - change.oldRating;
        const deltaStr = delta >= 0 ? `+${delta}` : String(delta);
        return [
          dateStr,
          change.contestName,
          String(change.rank),
          `${change.oldRating} -> ${change.newRating}`,
          deltaStr,
        ];
      });

      const mdTable = formatMarkdownTable(headers, tableRows);

      textOutput = [
        `Codeforces Rating History for ${handle} (showing last ${recentHistory.length} contests):`,
        "",
        mdTable,
        "",
        `Summary:`,
        `- Peak Rating: ${stats?.peakRating} (at ${stats?.peakContest} on ${stats?.peakDate})`,
        `- Trend: ${stats?.trendText}`,
      ].join("\n");
    }

    const footer = buildFreshnessFooter({
      source,
      upstreamCalls,
      partial: false,
    });

    textOutput += "\n\n" + footer;

    return {
      content: [
        {
          type: "text" as const,
          text: textOutput,
        },
      ],
      structuredContent: {
        handle,
        history: recentHistory,
        stats,
        source,
        upstreamCalls,
        partial: false,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isNotFound = errMsg.toLowerCase().includes("not found");
    const text = isNotFound
      ? `handle not found on Codeforces - handles are case-insensitive but must match exactly; check spelling.`
      : `Failed to fetch rating history: ${errMsg}`;

    return {
      content: [
        {
          type: "text" as const,
          text,
        },
      ],
      isError: true,
    };
  }
}
