// Nightly cache warmer, run by the com.adarsh.cp-mcp.refresh launchd agent.
//
// Codeforces is throttled to one request per 2100ms, so a cold submission
// backfill costs real wall-clock time. Paying that at 04:00 instead of at the
// moment someone asks "did I solve this?" is the entire point of this script.
//
// It deliberately goes through the exported tool handlers rather than reaching
// into the cache layer directly: those are the same code paths a client takes,
// so warming through them guarantees the cache ends up in exactly the shape a
// real call will find. The Zod schemas are the single source of truth for
// arguments, so they are `parse`d rather than hand-built.
//
// Everything logs to stderr. Nothing here writes to stdout, because the same
// modules are used under the stdio transport where stdout is the protocol.

import {
  searchProblemsCodeforcesSchema,
  handleSearchProblemsCodeforces,
} from "../src/tools/searchProblemsCodeforces.js";
import {
  searchProblemsAtcoderSchema,
  handleSearchProblemsAtcoder,
} from "../src/tools/searchProblemsAtcoder.js";
import { syncUserSubmissions } from "../src/cache/sync.js";
import { fileURLToPath } from "node:url";

function log(message: string, extra: Record<string, unknown> = {}): void {
  console.error(
    JSON.stringify({ ts: new Date().toISOString(), scope: "refresh", message, ...extra })
  );
}

/**
 * Run one step, logging and swallowing its failure. A refresh is best-effort:
 * Codeforces being down at 04:00 must not stop the AtCoder half from
 * refreshing, and must not leave a non-zero exit that launchd reports as a
 * broken agent.
 */
async function step(name: string, run: () => Promise<void>): Promise<void> {
  const started = Date.now();
  try {
    await run();
    log("step ok", { step: name, ms: Date.now() - started });
  } catch (err) {
    log("step failed", {
      step: name,
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function refresh(): Promise<void> {
  await step("codeforces catalogue", async () => {
    await handleSearchProblemsCodeforces(
      searchProblemsCodeforcesSchema.parse({ min_difficulty: 800, max_difficulty: 3500, limit: 1 })
    );
  });

  await step("atcoder catalogue", async () => {
    await handleSearchProblemsAtcoder(
      searchProblemsAtcoderSchema.parse({ min_difficulty: 800, max_difficulty: 3500, limit: 1 })
    );
  });

  // Submission history is the part that actually costs time on a cold call,
  // and the part the verifier depends on. Skipped rather than failed when no
  // default handle is configured — a refresh has no user to ask.
  const cfHandle = process.env.CP_MCP_CF_HANDLE?.trim();
  if (cfHandle) {
    await step(`codeforces submissions (${cfHandle})`, async () => {
      const res = await syncUserSubmissions("codeforces", cfHandle);
      log("sync result", { site: "codeforces", ...res });
    });
  } else {
    log("skipped: CP_MCP_CF_HANDLE not set");
  }

  const acHandle = process.env.CP_MCP_AC_HANDLE?.trim();
  if (acHandle) {
    await step(`atcoder submissions (${acHandle})`, async () => {
      const res = await syncUserSubmissions("atcoder", acHandle);
      log("sync result", { site: "atcoder", ...res });
    });
  } else {
    log("skipped: CP_MCP_AC_HANDLE not set");
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  refresh()
    .then(() => {
      // Deliberately no closeDb(): a cold handle leaves a background
      // continuation running, and its pending awaits are what keep the event
      // loop alive until the backfill finishes. Closing the database here
      // would make that continuation write into a closed handle; exiting
      // early would abandon the very work this agent exists to do. The
      // process ends on its own once nothing is left in flight.
      log("foreground refresh complete; background backfill (if any) still running");
    })
    .catch((err: unknown) => {
      log("refresh crashed", { error: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    });
}
