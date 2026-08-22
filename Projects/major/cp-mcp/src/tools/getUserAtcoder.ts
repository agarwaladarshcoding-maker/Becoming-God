import { z } from "zod";
import { acCall } from "../upstream/atcoder.js";
import { getCachedOrFetch } from "../cache/kv.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { resolveHandle } from "../domain/config.js";

export const getUserAtcoderSchema = z.object({
  handle: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,32}$/, "Invalid AtCoder handle format")
    .optional(),
});

type GetUserAtcoderArgs = z.infer<typeof getUserAtcoderSchema>;

interface AcRankEntry {
  user_id: string;
  count: number;
  rank: number;
}

export async function handleGetUserAtcoder(args: GetUserAtcoderArgs) {
  const handle = resolveHandle("atcoder", args.handle);

  try {
    const cacheKey = `ac:user-rank:${handle.toLowerCase()}`;
    const { data: rankData, source } = await getCachedOrFetch<AcRankEntry>(
      cacheKey,
      3600,
      async () => {
        const result = await acCall<AcRankEntry>("user/ac_rank", { user: handle });
        return { data: result };
      }
    );

    const upstreamCalls = source === "live" ? 1 : 0;
    const footer = buildFreshnessFooter({ source, upstreamCalls, partial: false });

    const profileUrl = `https://atcoder.jp/users/${handle}`;
    const text = [
      `AtCoder Profile: ${handle}`,
      `* AC Problems: ${rankData?.count ?? "Unknown"}`,
      `* AC Rank: ${rankData?.rank != null ? `#${rankData.rank}` : "Unknown"}`,
      `* Profile URL: ${profileUrl}`,
      "",
      footer,
    ].join("\n");

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: {
        site: "atcoder",
        handle,
        acCount: rankData?.count,
        acRank: rankData?.rank,
        profileUrl,
        source,
        upstreamCalls,
        partial: false,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Failed to fetch AtCoder profile for ${handle}: ${errMsg}` }],
      isError: true,
    };
  }
}
