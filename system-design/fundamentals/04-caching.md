# Caching

## Core Idea

A **cache** stores a copy of frequently used data in a faster layer so the system does not have to recompute it or fetch it from a slower source every time.

The goal is usually one or more of these:

- Reduce latency for users.
- Reduce load on databases or expensive services.
- Absorb traffic spikes.
- Improve availability when a dependency is slow or overloaded.

The trade-off is that cached data can become **stale**, so every cache design is really a balance between speed, freshness, complexity, and correctness.

---

## Where Caches Live

| Cache Type | Location | Example Use |
| --- | --- | --- |
| **Browser Cache** | User's device | Static assets like CSS, JS, images |
| **CDN Cache** | Edge servers near users | Public pages, images, videos, downloads |
| **Load Balancer / Reverse Proxy Cache** | In front of app servers | Repeated API or page responses |
| **Application Cache** | Inside the app process | Local computed values, small lookup tables |
| **Distributed Cache** | Shared network service | Redis / Memcached for sessions, feed data, counters |
| **Database Cache** | Inside the database engine | Query plans, pages, indexes |

Rule of thumb: the closer the cache is to the user, the lower the latency; the closer it is to the source of truth, the easier it is to keep correct.

---

## Cache Hit, Miss, and Hit Rate

- **Cache hit**: Requested data exists in the cache.
- **Cache miss**: Requested data is not in the cache, so the system must fetch it from the source of truth.
- **Hit rate**: Percentage of requests served by the cache.

Example:

If 1,000 requests come in and 850 are served from cache:

```text
hit rate = 850 / 1000 = 85%
```

A high hit rate usually means lower latency and less database load, but it does not automatically mean the cache is correct or cost-effective.

---

## Read Patterns

### 1. Cache-Aside / Lazy Loading

The application checks the cache first. If the item is missing, it reads from the database and writes the result into the cache.

```text
Client -> App -> Cache
               |
               | miss
               v
             Database
```

Flow:

1. App receives request.
2. App checks cache.
3. If cache hit, return cached data.
4. If cache miss, query database.
5. Store database result in cache.
6. Return result to user.

Pros:

- Simple and very common.
- Cache only stores data that is actually requested.
- Works well for read-heavy systems.

Cons:

- First request after expiry is slower.
- Cache misses can stampede the database during traffic spikes.
- App code must handle cache logic.

Best for:

- User profiles.
- Product details.
- Feed pages.
- Expensive computed results.

---

### 2. Read-Through Cache

The application talks to the cache, and the cache itself knows how to fetch missing data from the database.

Pros:

- App code is cleaner.
- Cache loading behavior is centralized.

Cons:

- Cache layer becomes more complex.
- Less common unless using a cache product or framework that supports it.

Best for:

- Systems where the cache provider can safely own fetch behavior.

---

## Write Patterns

### 1. Write-Through

Every write goes to the cache and the database before the request succeeds.

```text
App -> Cache -> Database
```

Pros:

- Cache stays fresh.
- Reads after writes are consistent.

Cons:

- Writes are slower because both layers must be updated.
- Cache outage can affect writes unless there is fallback logic.

Best for:

- Systems that need fresh reads immediately after writes.

---

### 2. Write-Back / Write-Behind

The app writes to the cache first. The cache asynchronously writes to the database later.

Pros:

- Very fast writes.
- Can batch database writes.

Cons:

- Risk of data loss if cache fails before flushing to database.
- Much harder to reason about correctness.

Best for:

- Metrics.
- Logs.
- Non-critical counters.
- High-write workloads where temporary loss is acceptable or replicated.

---

### 3. Write-Around

The app writes directly to the database and does not update the cache immediately. The cache is filled only when future reads miss.

Pros:

- Avoids polluting cache with rarely-read data.
- Simple write path.

Cons:

- Reads immediately after writes may see stale cached values.
- First read after write may be slower.

Best for:

- Write-heavy systems where many written items are rarely read.

---

## Invalidation

Cache invalidation is deciding when cached data should be removed or refreshed.

Common strategies:

| Strategy | How It Works | Trade-off |
| --- | --- | --- |
| **TTL** | Data expires after a fixed time | Simple, but data can be stale until expiry |
| **Manual Invalidation** | App deletes cache entry after a write | Fresher, but more app complexity |
| **Event-Based Invalidation** | Database or service emits change events | Scales better, but requires reliable event delivery |
| **Versioned Keys** | Cache key includes version/timestamp | Avoids stale overwrite bugs, but needs key management |

Example TTL:

```text
cache key: product:123
ttl: 300 seconds
```

This means product `123` can be served from cache for up to 5 minutes before being refreshed.

---

## Eviction

Eviction happens when the cache removes data to make room for new data.

Common policies:

- **LRU (Least Recently Used)**: Remove the item that has not been used for the longest time.
- **LFU (Least Frequently Used)**: Remove the item used the least often.
- **FIFO (First In, First Out)**: Remove the oldest item.
- **TTL-Based**: Remove expired items.

For Redis, memory limits and eviction policies matter because a full cache can cause writes to fail or important keys to disappear.

---

## Common Failure Modes

### 1. Cache Stampede

Many requests miss the cache at the same time and all hit the database.

Example:

```text
Popular key expires -> 10,000 requests miss -> database overload
```

Fixes:

- Add jitter to TTLs so keys do not expire together.
- Use request coalescing so only one request recomputes the value.
- Serve stale data while refreshing in the background.
- Pre-warm important keys before traffic arrives.

---

### 2. Thundering Herd

A large number of clients retry or refresh at once after a dependency recovers or a cached item expires.

Fixes:

- Exponential backoff.
- Rate limiting.
- Queueing.
- Randomized retry delays.

---

### 3. Hot Key

One key receives a huge fraction of traffic, overloading one cache node.

Example:

```text
post:viral_post_id
```

Fixes:

- Replicate hot keys.
- Split the value across multiple keys when possible.
- Add local in-process caching for extremely hot data.
- Use CDN caching for public content.

---

### 4. Stale Data

The cache returns old data after the database has changed.

Fixes:

- Shorter TTLs.
- Delete cache entries on writes.
- Use versioned keys.
- Design the product to tolerate bounded staleness.

---

### 5. Cache Penetration

Requests repeatedly ask for data that does not exist, so every request misses cache and hits the database.

Example:

```text
GET /users/random_fake_id
```

Fixes:

- Cache negative results for a short TTL.
- Validate IDs before querying.
- Use Bloom filters to reject impossible keys.

---

## Consistency Trade-Offs

Caching often means accepting **eventual consistency**.

For many systems, slightly stale data is fine:

- Like counts.
- View counts.
- Product recommendation lists.
- Trending feeds.
- Public profile summaries.

For some systems, stale data is dangerous:

- Bank balances.
- Inventory checkout.
- Permission checks.
- Payment status.
- Security-sensitive account state.

Interview phrasing:

> I would cache read-heavy data where bounded staleness is acceptable, but avoid caching the source of truth for correctness-critical paths unless the invalidation and consistency model are explicit.

---

## Choosing TTL

TTL depends on how fresh the data must be.

| Data | Example TTL |
| --- | --- |
| Static assets | Days to months |
| Product catalog | Minutes to hours |
| User profile summary | Minutes |
| Feed ranking | Seconds to minutes |
| Rate-limit counters | Seconds to minutes |
| Auth/session data | Usually tied to session expiration |

Short TTLs improve freshness but reduce hit rate. Long TTLs improve performance but increase staleness.

---

## Redis vs Memcached

| Feature | Redis | Memcached |
| --- | --- | --- |
| Data structures | Strings, hashes, lists, sets, sorted sets, streams | Simple key-value |
| Persistence | Optional persistence | Usually memory-only |
| Pub/Sub | Yes | No |
| Atomic counters | Yes | Yes |
| Common use | Sessions, queues, counters, leaderboards, cache | Simple high-speed cache |

Use **Memcached** when you only need a simple cache. Use **Redis** when you need richer data structures, atomic operations, pub/sub, locks, or persistence options.

---

## Practical Design Checklist

Before adding a cache, answer:

1. What is the source of truth?
2. What exact data is being cached?
3. What is the cache key?
4. What is the TTL?
5. How does the cache get invalidated?
6. What happens on cache miss?
7. What happens if the cache is down?
8. Is stale data acceptable?
9. How will hot keys and stampedes be handled?
10. What metrics will prove the cache is helping?

Important metrics:

- Hit rate.
- Miss rate.
- Cache latency.
- Database latency.
- Database QPS before and after caching.
- Evictions.
- Memory usage.
- Hot keys.
- Error rate.

---

## System Design Interview Template

When asked where caching fits in a design:

1. Start with the read path.
2. Identify the expensive or repeated data.
3. Choose cache location.
4. Define key and TTL.
5. Explain invalidation.
6. Mention failure modes.

Example answer:

> For product details, I would use cache-aside with Redis. The app first checks `product:{id}`. On a miss, it reads from the database, writes the result to Redis with a 5-minute TTL, and returns it. On product update, I would delete the cache key so the next read refreshes it. Since popular products can create hot keys, I would monitor key distribution and add TTL jitter to avoid stampedes.

---

## Summary

Caching is one of the highest-leverage system design tools because it reduces latency and protects slower systems from repeated work. The hard part is not storing data in Redis or a CDN; the hard part is choosing what can be stale, how long it can be stale, and what the system should do when the cache is empty, overloaded, or wrong.
