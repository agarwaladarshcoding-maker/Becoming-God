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

interface AcUpcomingContest {
  id: string;
  title: string;
  startEpochSecond: number;
  durationSecond: number;
  ratedRange: string;
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

function isRated(ratedRange: string): boolean {
  return ratedRange !== "-" && ratedRange !== "";
}

/**
 * Scrapes the "Upcoming Contests" table from atcoder.jp/contests/. There is no
 * official JSON feed for this (kenkoooo's contests.json is a historical archive
 * with no future contests) so we parse the HTML directly. Returns [] if the
 * page layout no longer matches what we expect — callers must treat that as a
 * parse failure, not "no contests".
 */
function parseUpcomingContests(html: string): AcUpcomingContest[] {
  const markerIdx = html.indexOf("contest-table-upcoming");
  if (markerIdx === -1) return [];
  const tableEndIdx = html.indexOf("</table>", markerIdx);
  const section = tableEndIdx === -1 ? html.slice(markerIdx) : html.slice(markerIdx, tableEndIdx);

  const rows: AcUpcomingContest[] = [];
  const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(section)) !== null) {
    const rowHtml = rowMatch[1];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const tds: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
      tds.push(tdMatch[1]);
    }
    if (tds.length < 4) continue; // header row or malformed row, skip

    const timeMatch = tds[0].match(/<time[^>]*>([^<]+)<\/time>/);
    const linkMatch = tds[1].match(/href="\/contests\/([a-zA-Z0-9_-]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!timeMatch || !linkMatch) continue;

    const startDate = new Date(timeMatch[1].trim());
    if (isNaN(startDate.getTime())) continue;

    const durMatch = tds[2].trim().match(/(\d+):(\d+)/);
    const durationSecond = durMatch
      ? parseInt(durMatch[1], 10) * 3600 + parseInt(durMatch[2], 10) * 60
      : 0;

    rows.push({
      id: linkMatch[1],
      title: linkMatch[2].replace(/<[^>]+>/g, "").trim(),
      startEpochSecond: Math.floor(startDate.getTime() / 1000),
      durationSecond,
      ratedRange: tds[3].replace(/<[^>]+>/g, "").trim(),
    });
  }
  return rows;
}

export async function handleUpcomingContestsAtcoder(args: UpcomingContestsAtcoderArgs) {
  const { within_days, timezone, rated_only, limit } = args;

  const nowSec = Math.floor(Date.now() / 1000);
  const windowEnd = nowSec + within_days * 86400;

  let source: "cache" | "live" = "cache";
  let upstreamCalls = 0;

  let contests: AcUpcomingContest[];
  try {
    const result = await getCachedOrFetch<string>(
      "ac:contests:upcoming",
      15 * 60,
      async () => {
        const resp = await politeFetch("https://atcoder.jp/contests/");
        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching atcoder.jp/contests/`);
        const html = await resp.text();
        return { data: html };
      }
    );
    if (result.source === "live") { source = "live"; upstreamCalls++; }
    contests = parseUpcomingContests(result.data ?? "");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Failed to fetch AtCoder contest list: ${msg}` }],
      isError: true,
      structuredContent: { contests: [], source: "live", upstreamCalls: 1, partial: false },
    };
  }

  if (contests.length === 0) {
    return {
      content: [{
        type: "text" as const,
        text: "Failed to parse AtCoder contests: the atcoder.jp/contests/ page layout appears to have changed.",
      }],
      isError: true,
      structuredContent: { contests: [], source, upstreamCalls, partial: false },
    };
  }

  const upcoming = contests
    .filter(c => c.startEpochSecond >= nowSec && c.startEpochSecond <= windowEnd)
    .filter(c => !rated_only || isRated(c.ratedRange))
    .sort((a, b) => a.startEpochSecond - b.startEpochSecond)
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
    c.ratedRange === "-" ? "unrated" : c.ratedRange,
    formatInTimezone(c.startEpochSecond, timezone),
    formatDuration(c.durationSecond),
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
        ratedRange: c.ratedRange,
        startEpochSecond: c.startEpochSecond,
        durationSecond: c.durationSecond,
      })),
      source,
      upstreamCalls,
      partial: false,
    },
  };
}
