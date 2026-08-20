import { z } from "zod";
import { getCachedOrFetch } from "../cache/kv.js";
import { politeFetch } from "../upstream/http.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { formatMarkdownTable } from "../format/table.js";

export const upcomingContestsAtcoderSchema = z.object({
  within_days: z.number().int().min(1).max(30).default(7),
  timezone: z.string().default("UTC").describe("IANA timezone, e.g. Asia/Kolkata."),
  rated_only: z.boolean().default(false),
  limit: z.number().int().min(1).max(25).default(10),
});

type UpcomingContestsAtcoderArgs = z.infer<typeof upcomingContestsAtcoderSchema>;

interface AcContest {
  id: string;
  start_epoch_second: number;
  duration_second: number;
  title: string;
  rate_change: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatInTimezone(epochSec: number, tz: string): string {
  try {
    const dt = new Date(epochSec * 1000);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dt).replace(",", "");
  } catch {
    return new Date(epochSec * 1000).toISOString().substring(0, 16).replace("T", " ") + " UTC";
  }
}

function isRated(rateChange: string): boolean {
  return rateChange !== "-" && rateChange !== "";
}

export async function handleUpcomingContestsAtcoder(args: UpcomingContestsAtcoderArgs) {
  const { within_days, timezone, rated_only, limit } = args;

  const nowSec = Math.floor(Date.now() / 1000);
  const windowEnd = nowSec + within_days * 86400;

  let source: "cache" | "live" = "cache";
  let upstreamCalls = 0;

  let contests: AcContest[];
  try {
    const result = await getCachedOrFetch<AcContest[]>(
      "ac:catalogue:contests",
      12 * 3600,
      async () => {
        const resp = await politeFetch("https://kenkoooo.com/atcoder/resources/contests.json");
        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching contests.json`);
        const data = await resp.json() as AcContest[];
        return { data };
      }
    );
    if (result.source === "live") { source = "live"; upstreamCalls++; }
    contests = result.data ?? [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Failed to fetch AtCoder contest list: ${msg}` }],
      isError: true,
      structuredContent: { contests: [], source: "live", upstreamCalls: 1, partial: false },
    };
  }

  const upcoming = contests
    .filter(c => c.start_epoch_second >= nowSec && c.start_epoch_second <= windowEnd)
    .filter(c => !rated_only || isRated(c.rate_change))
    .sort((a, b) => a.start_epoch_second - b.start_epoch_second)
    .slice(0, limit);

  const footer = buildFreshnessFooter({ source, upstreamCalls, partial: false });

  if (upcoming.length === 0) {
    return {
      content: [{
        type: "text" as const,
        text: `No upcoming AtCoder contests in the next ${within_days} day(s).\n\n${footer}`,
      }],
      structuredContent: { contests: [], source, upstreamCalls, partial: false },
    };
  }

  const rows = upcoming.map(c => [
    `[${c.id}](https://atcoder.jp/contests/${c.id})`,
    c.title,
    c.rate_change === "-" ? "unrated" : c.rate_change,
    formatInTimezone(c.start_epoch_second, timezone),
    formatDuration(c.duration_second),
  ]);

  const text = [
    `Upcoming AtCoder contests (next ${within_days}d, timezone: ${timezone}):`,
    "",
    formatMarkdownTable(["ID", "Title", "Rated", `Start (${timezone})`, "Duration"], rows),
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      contests: upcoming.map(c => ({
        id: c.id,
        title: c.title,
        rateChange: c.rate_change,
        startEpochSecond: c.start_epoch_second,
        durationSecond: c.duration_second,
      })),
      source,
      upstreamCalls,
      partial: false,
    },
  };
}
