export interface FreshnessFooterOptions {
  source: "cache" | "live" | "local" | string;
  cacheAgeDescription?: string; // e.g. "CF snapshot 3h old"
  upstreamCalls: number;
  partial: boolean;
}

/**
 * Builds the standardized freshness footer suffix for MCP tool responses.
 */
export function buildFreshnessFooter(opts: FreshnessFooterOptions): string {
  const sourceStr = opts.cacheAgeDescription
    ? `${opts.source} (${opts.cacheAgeDescription})`
    : opts.source;
  const callsStr = `${opts.upstreamCalls} upstream call${opts.upstreamCalls === 1 ? "" : "s"}`;
  const partialStr = `partial: ${opts.partial ? "yes" : "no"}`;

  return `source: ${sourceStr} | ${callsStr} | ${partialStr}`;
}
