import PQueue from "p-queue";

const ALLOWED_HOSTS = new Set([
  "codeforces.com",
  "mirror.codeforces.com",
  "kenkoooo.com",
  "atcoder.jp",
]);

const queues = new Map<string, PQueue>();

function getQueue(hostname: string): PQueue {
  let queue = queues.get(hostname);
  if (!queue) {
    if (hostname === "codeforces.com" || hostname === "mirror.codeforces.com") {
      queue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 2100 });
    } else if (hostname === "kenkoooo.com" || hostname === "atcoder.jp") {
      queue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 1200 });
    } else {
      queue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 1000 });
    }
    queues.set(hostname, queue);
  }
  return queue;
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "UpstreamError";
    Object.setPrototypeOf(this, UpstreamError.prototype);
  }
}

export interface PoliteFetchOptions extends Omit<RequestInit, "signal"> {
  timeoutMs?: number;
  signal?: AbortSignal;
}

const BACKOFFS = [2000, 6000, 15000];

function getDelay(retryIndex: number): number {
  const base = BACKOFFS[retryIndex] ?? 15000;
  const jitter = Math.random() * 1000;
  return base + jitter;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Perform a throttled, retried HTTP fetch.
 * SSRF protected, concurrency capped, and polite to upstreams.
 */
export async function politeFetch(url: string, opts?: PoliteFetchOptions): Promise<Response> {
  let hostname: string;
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      throw new UpstreamError(`SSRF Guard: Host not allowlisted: ${parsed.hostname}`, undefined, false);
    }
    hostname = parsed.hostname;
  } catch (err) {
    if (err instanceof UpstreamError) {
      throw err;
    }
    throw new UpstreamError(`Invalid URL: ${url}`, undefined, false);
  }

  const queue = getQueue(hostname);

  const defaultTimeout = hostname.includes("codeforces.com") ? 10000 : 20000;
  const timeoutMs = opts?.timeoutMs ?? defaultTimeout;

  const runWithRetry = async (): Promise<Response> => {
    let attempt = 0;
    while (true) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(new Error("Timeout"));
      }, timeoutMs);

      const abortHandler = () => {
        controller.abort(opts?.signal?.reason);
      };

      if (opts?.signal) {
        opts.signal.addEventListener("abort", abortHandler);
      }

      const startTime = Date.now();
      try {
        const headers = {
          "User-Agent": "cp-mcp/0.1 (+https://github.com/agarwaladarshcoding-maker/cp-mcp)",
          ...opts?.headers,
        };

        const response = await fetch(url, {
          ...opts,
          headers,
          signal: controller.signal,
        });

        // Check if Codeforces returned Call limit exceeded
        if (hostname.includes("codeforces.com")) {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const clone = response.clone();
            let bodyText = "";
            try {
              bodyText = await clone.text();
              const json = JSON.parse(bodyText);
              if (json && json.status === "FAILED" && json.comment && json.comment.includes("Call limit exceeded")) {
                throw new UpstreamError("Codeforces call limit exceeded", response.status, true);
              }
            } catch (jsonErr) {
              if (jsonErr instanceof UpstreamError) {
                throw jsonErr;
              }
              // Not valid json/other format, let downstream check it
            }
          }
        }

        if (response.status >= 500) {
          throw new UpstreamError(`HTTP error status ${response.status}`, response.status, true);
        }

        const duration = Date.now() - startTime;
        console.error(
          JSON.stringify({
            ts: new Date().toISOString(),
            type: "upstream_success",
            url,
            status: response.status,
            attempt,
            durationMs: duration,
          })
        );

        return response;
      } catch (err: unknown) {
        const duration = Date.now() - startTime;
        let isRetryable = true;
        const errMsg = err instanceof Error ? err.message : String(err);

        if (err instanceof UpstreamError) {
          isRetryable = err.retryable;
        } else if (err instanceof Error && err.name === "AbortError" && opts?.signal?.aborted) {
          // If the caller aborted, do not retry
          isRetryable = false;
        }

        console.error(
          JSON.stringify({
            ts: new Date().toISOString(),
            type: "upstream_failure",
            url,
            attempt,
            durationMs: duration,
            retryable: isRetryable,
            error: errMsg,
          })
        );

        if (isRetryable && attempt <= 3) {
          const delay = getDelay(attempt - 1);
          await sleep(delay);
          continue;
        }

        if (err instanceof UpstreamError) {
          throw err;
        }
        throw new UpstreamError(errMsg, undefined, isRetryable);
      } finally {
        clearTimeout(timeoutId);
        if (opts?.signal) {
          opts.signal.removeEventListener("abort", abortHandler);
        }
      }
    }
  };

  return queue.add(runWithRetry) as Promise<Response>;
}

/**
 * Exposed for testing to allow resetting queues and stats.
 */
export function resetQueues() {
  for (const queue of queues.values()) {
    queue.clear();
  }
  queues.clear();
}
