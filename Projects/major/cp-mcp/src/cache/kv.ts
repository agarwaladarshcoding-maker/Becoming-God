import { getDb } from "./db.js";

export interface CachedEntry<T> {
  data: T;
  etag?: string;
  fetchedAt: number;
  ttlSeconds: number;
  status: "hit" | "stale";
}

// In-memory registry to deduplicate concurrent requests for the same key
const pendingFetches = new Map<
  string,
  Promise<{ data: unknown; etag?: string }>
>();

export function getDbKv<T>(
  key: string,
  swrSeconds: number = 86400
): CachedEntry<T> | null {
  const db = getDb();
  try {
    const row = db
      .prepare("SELECT body, etag, fetched_at, ttl_s FROM kv WHERE key = ?")
      .get(key) as
      | {
          body: string;
          etag?: string | null;
          fetched_at: number;
          ttl_s: number;
        }
      | undefined;

    if (!row) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const fetchedAt = row.fetched_at;
    const ttl = row.ttl_s;

    const data = JSON.parse(row.body) as T;
    const etag = row.etag || undefined;

    if (now < fetchedAt + ttl) {
      return { data, etag, fetchedAt, ttlSeconds: ttl, status: "hit" };
    } else if (now < fetchedAt + ttl + swrSeconds) {
      return { data, etag, fetchedAt, ttlSeconds: ttl, status: "stale" };
    }

    return null; // miss/expired beyond SWR
  } catch (err) {
    console.error(`Error reading from KV store for key ${key}:`, err);
    return null;
  }
}

export function setDbKv<T>(
  key: string,
  data: T,
  ttlSeconds: number,
  etag?: string
): void {
  const db = getDb();
  try {
    const body = JSON.stringify(data);
    const now = Math.floor(Date.now() / 1000);

    db.prepare(
      `
      INSERT INTO kv (key, body, etag, fetched_at, ttl_s)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        body = excluded.body,
        etag = excluded.etag,
        fetched_at = excluded.fetched_at,
        ttl_s = excluded.ttl_s
    `
    ).run(key, body, etag || null, now, ttlSeconds);
  } catch (err) {
    console.error(`Error writing to KV store for key ${key}:`, err);
  }
}

/**
 * High-level helper for stale-while-revalidate and synchronous fetch options.
 * Deduplicates in-flight requests to protect rate limits.
 */
export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: (etag?: string) => Promise<{ data: T; etag?: string }>,
  swrSeconds: number = 86400
): Promise<{
  data: T;
  source: "cache" | "stale" | "live" | "local";
  fetchedAt?: number;
}> {
  const cached = getDbKv<T>(key, swrSeconds);

  if (cached) {
    if (cached.status === "hit") {
      return {
        data: cached.data,
        source: "cache",
        fetchedAt: cached.fetchedAt,
      };
    }

    // Status is "stale": trigger background refresh if not already pending
    if (!pendingFetches.has(key)) {
      const promise = fetchFn(cached.etag)
        .then(({ data, etag }) => {
          setDbKv(key, data, ttlSeconds, etag);
          return { data, etag };
        })
        .catch((err) => {
          console.error(`Background SWR refresh failed for key ${key}:`, err);
          throw err;
        })
        .finally(() => {
          pendingFetches.delete(key);
        });
      pendingFetches.set(key, promise);
    }

    return { data: cached.data, source: "stale", fetchedAt: cached.fetchedAt };
  }

  // Miss: fetch synchronously (deduplicated)
  let promise = pendingFetches.get(key) as
    Promise<{ data: T; etag?: string }> | undefined;
  if (!promise) {
    promise = fetchFn()
      .then(({ data, etag }) => {
        setDbKv(key, data, ttlSeconds, etag);
        return { data, etag };
      })
      .catch((err) => {
        // Clear pending list on error so next request can retry
        pendingFetches.delete(key);
        throw err;
      })
      .finally(() => {
        pendingFetches.delete(key);
      });
    pendingFetches.set(key, promise);
  }

  try {
    const res = await promise;
    return { data: res.data, source: "live" };
  } catch (err) {
    // If the live fetch fails, fallback to stale cache if we have one on disk,
    // rather than raising an unhandled exception.
    const staleFallback = getDbKv<T>(key, 100 * 365 * 86400); // effectively infinite SWR window
    if (staleFallback) {
      console.warn(
        `Fallback to stale cached data for key ${key} due to upstream fetch failure`
      );
      return {
        data: staleFallback.data,
        source: "stale",
        fetchedAt: staleFallback.fetchedAt,
      };
    }
    throw err;
  }
}
