import { z } from "zod";
import { politeFetch } from "../upstream/http.js";
import { getCachedOrFetch } from "../cache/kv.js";
import { formatMarkdownTable } from "../format/table.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { resolveHandle } from "../domain/config.js";

export const ratingHistoryAtcoderSchema = z.object({
  handle: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid AtCoder handle format")
    .optional(),
  limit: z.number().int().min(1).max(50).default(15),
  summary_only: z.boolean().default(false),
});

type RatingHistoryAtcoderArgs = z.infer<typeof ratingHistoryAtcoderSchema>;

interface AcHistoryEntry {
  IsRated: boolean;
  Place: number;
  OldRating: number;
  NewRating: number;
  Performance: number;
  InnerPerformance: number;
  ContestScreenName: string;
  ContestName: string;
  ContestNameEn: string;
  EndTime: string;
}

export async function handleRatingHistoryAtcoder(args: RatingHistoryAtcoderArgs) {
  const { limit, summary_only } = args;
  const handle = resolveHandle("atcoder", args.handle);

  try {
    const cacheKey = `ac:rating-history:${handle.toLowerCase()}`;
    const { data: history, source } = await getCachedOrFetch<AcHistoryEntry[]>(
      cacheKey,
      6 * 3600,
      async () => {
        const url = `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`;
        const resp = await politeFetch(url);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} fetching AtCoder history`);
        }
        const data = await resp.json() as AcHistoryEntry[];
        return { data };
      }
    );

    const upstreamCalls = source === "live" ? 1 : 0;

    if (!history || history.length === 0) {
      const footer = buildFreshnessFooter({ source, upstreamCalls, partial: false });
      return {
        content: [{ type: "text" as const, text: `${handle} has no rated AtCoder contest history.\n\n${footer}` }],
        structuredContent: { handle, history: [], source, upstreamCalls, partial: false },
      };
    }

    const ratedOnly = history.filter(e => e.IsRated);
    const recent = ratedOnly.slice(-limit);
    const peakEntry = ratedOnly.reduce((a, b) => b.NewRating > a.NewRating ? b : a, ratedOnly[0]);
    const currentRating = ratedOnly[ratedOnly.length - 1]?.NewRating;

    let textOutput = "";
    if (summary_only) {
      textOutput = [
        `AtCoder Rating Summary for ${handle}:`,
        `- Current Rating: ${currentRating ?? "Unrated"}`,
        `- Peak Rating: ${peakEntry.NewRating} (${peakEntry.ContestNameEn || peakEntry.ContestName})`,
        `- Rated Contests: ${ratedOnly.length}`,
      ].join("\n");
    } else {
      const headers = ["Date", "Contest", "Place", "Old → New", "Delta"];
      const tableRows = [...recent].reverse().map(e => {
        const date = e.EndTime.substring(0, 10);
        const delta = e.NewRating - e.OldRating;
        return [
          date,
          (e.ContestNameEn || e.ContestName).slice(0, 40),
          String(e.Place),
          `${e.OldRating} → ${e.NewRating}`,
          delta >= 0 ? `+${delta}` : String(delta),
        ];
      });
      textOutput = [
        `AtCoder Rating History for ${handle} (last ${recent.length} rated contests):`,
        "",
        formatMarkdownTable(headers, tableRows),
        "",
        `Summary:`,
        `- Current Rating: ${currentRating ?? "Unrated"}`,
        `- Peak Rating: ${peakEntry.NewRating} (${peakEntry.ContestNameEn || peakEntry.ContestName})`,
      ].join("\n");
    }

    const footer = buildFreshnessFooter({ source, upstreamCalls, partial: false });
    textOutput += "\n\n" + footer;

    return {
      content: [{ type: "text" as const, text: textOutput }],
      structuredContent: {
        handle,
        history: recent,
        currentRating,
        peakRating: peakEntry.NewRating,
        source,
        upstreamCalls,
        partial: false,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Failed to fetch AtCoder rating history for ${handle}: ${errMsg}` }],
      isError: true,
    };
  }
}
