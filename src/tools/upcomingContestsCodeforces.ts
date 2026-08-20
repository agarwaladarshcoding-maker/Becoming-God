import { z } from "zod";
import { cfCall } from "../upstream/codeforces.js";
import { buildFreshnessFooter } from "../format/freshness.js";
import { formatMarkdownTable } from "../format/table.js";

export const upcomingContestsCodeforcesSchema = z.object({
  within_days: z.number().int().min(1).max(30).default(7),
  timezone: z.string().default("UTC").describe("IANA timezone, e.g. Asia/Kolkata."),
  rated_only: z.boolean().default(false),
  limit: z.number().int().min(1).max(25).default(10),
});

type UpcomingContestsCodeforcesArgs = z.infer<typeof upcomingContestsCodeforcesSchema>;

interface CfContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
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
    // Fall back to UTC if invalid timezone
    return new Date(epochSec * 1000).toISOString().substring(0, 16).replace("T", " ") + " UTC";
  }
}

export async function handleUpcomingContestsCodeforces(args: UpcomingContestsCodeforcesArgs) {
  const { within_days, timezone, rated_only, limit } = args;

  const nowSec = Math.floor(Date.now() / 1000);
  const windowEnd = nowSec + within_days * 86400;

  let contests: CfContest[];
  try {
    contests = await cfCall<CfContest[]>("contest.list");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Failed to fetch Codeforces contest list: ${msg}` }],
      isError: true,
      structuredContent: { contests: [], source: "live", upstreamCalls: 1, partial: false },
    };
  }

  const upcoming = contests
    .filter(c => c.phase === "BEFORE" && c.startTimeSeconds != null)
    .filter(c => c.startTimeSeconds! >= nowSec && c.startTimeSeconds! <= windowEnd)
    .filter(c => !rated_only || c.type !== "IOI")
    .sort((a, b) => (a.startTimeSeconds ?? 0) - (b.startTimeSeconds ?? 0))
    .slice(0, limit);

  const footer = buildFreshnessFooter({ source: "live", upstreamCalls: 1, partial: false });

  if (upcoming.length === 0) {
    return {
      content: [{
        type: "text" as const,
        text: `No upcoming Codeforces contests in the next ${within_days} day(s).\n\n${footer}`,
      }],
      structuredContent: { contests: [], source: "live", upstreamCalls: 1, partial: false },
    };
  }

  const rows = upcoming.map(c => [
    String(c.id),
    c.name,
    c.type,
    formatInTimezone(c.startTimeSeconds!, timezone),
    formatDuration(c.durationSeconds),
  ]);

  const text = [
    `Upcoming Codeforces contests (next ${within_days}d, timezone: ${timezone}):`,
    "",
    formatMarkdownTable(["ID", "Name", "Type", `Start (${timezone})`, "Duration"], rows),
    "",
    footer,
  ].join("\n");

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      contests: upcoming.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        startTimeSeconds: c.startTimeSeconds,
        durationSeconds: c.durationSeconds,
      })),
      source: "live",
      upstreamCalls: 1,
      partial: false,
    },
  };
}
