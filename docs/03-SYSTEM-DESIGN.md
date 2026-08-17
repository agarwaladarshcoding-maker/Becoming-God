# 03 — System Design

## 1. Context diagram

```
┌─ Clients (MCP hosts) ─────────┐
│ Claude Desktop      (stdio)   │
│ Claude web / Notion (HTTPS)   │
│ Cursor / Gemini CLI (stdio)   │
└─────────────┬───────────────┘
               │ JSON-RPC 2.0 (stdio | Streamable HTTP)
┌────────────▼─────────────────────────────────────────────┐
│                      cp-mcp                                   │
│  L4  MCP layer      registry, schemas, result formatting      │
│  L3  Tool layer     one file per tool, arg validation         │
│  L2  Domain layer   normalize, dedupe, verify, rank, analyze   │
│  L1  Cache layer    SQLite + memory LRU + ETag + TTL/SWR      │
│  L0  Upstream layer throttled HTTP clients, retries, breaker   │
└────────────┬───────────────────────────────────────────┘
             │                        │
     Codeforces API           AtCoder Problems API
     (1 req / 2 s)            (1 req / 1 s, ETag)
```

**Golden rule:** L4 knows nothing about HTTP. L0 knows nothing about MCP. L2 is pure
functions over cached data and is where all the interesting logic lives.

## 2. Layer responsibilities

| Layer | Owns | Must NOT |
|---|---|---|
| L0 `upstream/` | URL building, throttle, retry, timeout, ETag, body-level error detection | Know about tools, shape output for models |
| L1 `cache/` | SQLite tables, TTL, stale-while-revalidate, ETag store, snapshot versioning | Fetch (it asks L0 via a loader callback) |
| L2 `domain/` | Normalization to `Problem`/`Submission`/`User`, dedupe, difficulty mapping, verification, ranking, analytics | Do I/O directly |
| L3 `tools/` | Zod schema, clamping, calling domain, formatting text + `structuredContent`, tool errors | Contain business logic |
| L4 `server.ts` | Registry, `initialize` instructions, capability declaration, transport wiring | Contain domain logic |

## 3. Unified domain model

```ts
export type Site = "codeforces" | "atcoder";

export interface Problem {
  site: Site;
  id: string;                 // "cf:1900C" | "ac:abc300_c"  (globally unique)
  siteId: string;             // "1900C" | "abc300_c"
  name: string;
  url: string;
  contestId: string;          // "1900" | "abc300"
  contestName?: string;
  index?: string;             // "C"
  difficulty?: number;        // normalized to the CF rating scale
  difficultySource: "official" | "estimated" | "unknown";
  difficultyConfidence?: "high" | "low";   // low if is_experimental
  tags: string[];             // CF tags; [] for AtCoder in v1
  solvedCount?: number;
  points?: number;
}

export interface Submission {
  site: Site;
  problemId: string;          // matches Problem.id
  submissionId: string;
  at: string;                 // ISO-8601 UTC
  verdict: "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "OTHER";
  rawVerdict: string;
  language: string;
  participation?: "contest" | "practice" | "virtual" | "other";
  timeMs?: number;
}

export interface UserProfile {
  site: Site;
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  solvedCount?: number;
  lastActiveAt?: string;
  profileUrl: string;
}

export interface VerificationResult {
  problemId: string;
  problemName: string;
  url: string;
  status: "solved" | "attempted" | "untouched";
  firstAcAt?: string;
  attempts: number;
  distinctVerdicts: string[];
  language?: string;
  withinWindow: boolean;      // AC happened inside the requested `since` window
}
```

**Why a unified model is the whole product:** two thin wrappers would leave the model to
reconcile `verdict:"OK"` vs `result:"AC"`, `1900C` vs `abc300_c`, ratings vs IRT estimates.
Doing it server-side is the value add.

## 4. Cache design

### Tables (SQLite; `better-sqlite3`)

```sql
CREATE TABLE kv (                 -- generic TTL cache for small responses
  key         TEXT PRIMARY KEY,   -- "cf:user.info:adarsh"
  body        TEXT NOT NULL,      -- JSON
  etag        TEXT,
  fetched_at  INTEGER NOT NULL,   -- epoch seconds
  ttl_s       INTEGER NOT NULL
);

CREATE TABLE problems (           -- normalized problem catalogue (both sites)
  id TEXT PRIMARY KEY, site TEXT NOT NULL, site_id TEXT NOT NULL,
  name TEXT NOT NULL, url TEXT NOT NULL, contest_id TEXT,
  difficulty INTEGER, difficulty_source TEXT, difficulty_confidence TEXT,
  tags TEXT,                      -- JSON array
  solved_count INTEGER, points REAL, updated_at INTEGER NOT NULL
);
CREATE INDEX idx_problems_diff ON problems(difficulty);
CREATE INDEX idx_problems_site ON problems(site);

CREATE TABLE user_solved (        -- per-user solved set, incrementally extended
  site TEXT, handle TEXT, problem_id TEXT,
  first_ac_at INTEGER, attempts INTEGER,
  PRIMARY KEY (site, handle, problem_id)
);

CREATE TABLE user_sync (          -- watermark for incremental submission sync
  site TEXT, handle TEXT, last_synced_epoch INTEGER, last_run_at INTEGER,
  PRIMARY KEY (site, handle)
);
```

### TTL policy

| Data | TTL | Strategy |
|---|---|---|
| CF `problemset.problems` | 12h | full snapshot, background refresh |
| AtCoder static datasets | 12–24h | ETag + `If-None-Match` |
| `problem-models.json` | 24h | ETag |
| `user.info` | 10 min | SWR |
| `user.rating` | 1h | SWR |
| Submissions | incremental | never re-fetch old pages; advance watermark |
| `contest.list` | 10 min | SWR |
| `contest.standings` | 5 min | on-demand only, always with `handles` filter |
| Statement text (optional) | 30 days | immutable-ish |

### Incremental submission sync (the important algorithm)

```
syncSubmissions(site, handle):
  wm = user_sync.last_synced_epoch (default 0)
  if site == codeforces:
     # CF has no "since"; it pages newest-first
     from = 1; count = 200
     loop:
        page = cf.user.status(handle, from, count)
        stop when page empty OR oldest(page).creationTimeSeconds <= wm
        upsert page
        from += count
        break if from > 5000        # safety cap on first backfill
  else:
     # AtCoder is "from_second" based, oldest-first
     cursor = wm
     loop:
        page = ac.user_submissions(handle, from_second=cursor)
        break if page empty
        upsert page
        cursor = max(epoch_second in page) + 1
        break if page.length < 500
  user_sync.last_synced_epoch = now - 60      # 60s safety overlap
```

Rules: idempotent upserts, 60s overlap to avoid boundary loss, safety caps so a first-time
backfill can't run for minutes inside a tool call. **First sync for a new handle is a
background job**; the tool returns "syncing, partial data" if it isn't warm.

## 5. Request flow: `cp_verify_solved_codeforces` (example)

```
1. tools/call cp_verify_solved_codeforces { handle:"adarsh",
                                           problems:["1900C","1899D"], since:"2026-08-16" }
2. L3  validate (≤25 problems, handle regex, ISO date) → clamp
3. L2  resolve each problem id → canonical Problem (from problems table; fetch on miss)
4. L1  is user_solved warm? (last_run_at < 5 min ago) → yes: use it
                                                     → no : L0 incremental sync
5. L2  for each problem: status + firstAcAt + attempts + withinWindow
6. L3  format: compact markdown table + structuredContent + freshness note
7. return content[0].text (≤ ~600 tokens), structuredContent = VerificationResult[]
```

**Latency budget:** warm cache → <300ms. Cold single handle → 2–10s (CF paging). Never
block >20s; return partial with `"partial": true` and a note.

## 6. Request flow: `cp_search_problems_codeforces` (example)

```
1. validate: min/max difficulty, tags[], limit≤25, exclude_solved_by?
2. ensure problem catalogue fresh (snapshot age < TTL, else background refresh)
3. SQL filter: site = 'codeforces' AND difficulty BETWEEN ? AND ? AND tag match
4. if exclude_solved_by: LEFT JOIN user_solved → keep NULLs (unsolved only)
5. rank: prefer (a) closest to band centre, (b) higher solved_count (well-tested),
         (c) deterministic tiebreak by id  — optional seeded shuffle for variety
6. project 6 fields, cap at limit, render as a table
```

Ranking is a design decision, not an accident: **well-solved problems near the band centre**
make better practice than obscure outliers.

## 7. Repo layout

```
cp-mcp/
├─ package.json                 # bin: { "cp-mcp": "dist/bin/stdio.js" }
├─ tsconfig.json
├─ server.json                  # MCP registry manifest (M6)
├─ src/
│  ├─ server.ts                 # buildServer(): registry + instructions, no transport
│  ├─ bin/stdio.ts              # stdio entrypoint
│  ├─ http.ts                   # Streamable HTTP entrypoint (Hono)
│  ├─ config.ts                 # env, TTLs, limits, feature flags
│  ├─ upstream/
│  │  ├─ http.ts                # throttled fetch: queue, retry, ETag, breaker
│  │  ├─ codeforces.ts          # typed CF methods
│  │  └─ atcoder.ts             # typed AtCoder Problems methods
│  ├─ cache/
│  │  ├─ db.ts                  # sqlite open + migrations
│  │  ├─ kv.ts                  # get/set with TTL + SWR
│  │  └─ sync.ts                # problem catalogue + submission sync jobs
│  ├─ domain/
│  │  ├─ types.ts               # Problem, Submission, UserProfile, VerificationResult
│  │  ├─ normalize.ts           # CF/AC raw → domain
│  │  ├─ difficulty.ts          # cross-site mapping + confidence
│  │  ├─ verify.ts              # verification logic
│  │  ├─ search.ts              # filter + rank
│  │  └─ analytics.ts           # tag-level stats (M6)
│  ├─ tools/
│  │  ├─ index.ts               # export const TOOLS = [...]
│  │  ├─ getUserCodeforces.ts       getUserAtCoder.ts
│  │  ├─ ratingHistoryCodeforces.ts  ratingHistoryAtCoder.ts
│  │  ├─ searchProblemsCodeforces.ts searchProblemsAtCoder.ts
│  │  ├─ getProblemCodeforces.ts     getProblemAtCoder.ts
│  │  ├─ getSubmissionsCodeforces.ts getSubmissionsAtCoder.ts
│  │  ├─ verifySolvedCodeforces.ts   verifySolvedAtCoder.ts
│  │  ├─ upcomingContestsCodeforces.ts upcomingContestsAtCoder.ts
│  │  ├─ contestPerformanceCodeforces.ts contestPerformanceAtCoder.ts
│  │  └─ analyzeWeaknessesCodeforces.ts analyzeWeaknessesAtCoder.ts
│  └─ format/
│     ├─ table.ts               # compact markdown tables
│     └─ freshness.ts           # "data as of ..." footers
├─ test/
│  ├─ fixtures/                 # recorded upstream JSON (small, trimmed)
│  ├─ unit/  contract/  eval/
└─ docs/                        # THIS doc set
```

## 8. Skeleton code

### `src/upstream/http.ts` (the throttle that keeps you alive)
```ts
import PQueue from "p-queue";

const queues = {
  "codeforces.com": new PQueue({ intervalCap: 1, interval: 2100, concurrency: 1 }),
  "kenkoooo.com":   new PQueue({ intervalCap: 1, interval: 1200, concurrency: 1 }),
};

const UA = "cp-mcp/0.1 (+https://github.com/you/cp-mcp)";

export async function politeFetch(url: string, opts: { etag?: string; timeoutMs?: number } = {}) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const q = queues[host as keyof typeof queues];
  if (!q) throw new Error(`Refusing to fetch non-allowlisted host: ${host}`); // SSRF guard
  return q.add(async () => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 15000);
    try {
      const res = await fetch(url, {
        signal: ctl.signal,
        headers: { "user-agent": UA, ...(opts.etag ? { "if-none-match": opts.etag } : {}) },
      });
      if (res.status === 304) return { notModified: true as const };
      const text = await res.text();
      return { notModified: false as const, status: res.status, etag: res.headers.get("etag"), text };
    } finally { clearTimeout(t); }
  });
}

export async function cfCall<T>(method: string, params: Record<string, string|number> = {}): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)]));
  const r = await politeFetch(`https://codeforces.com/api/${method}?${qs}`);
  if (r.notModified) throw new Error("unexpected 304");
  const body = JSON.parse(r.text);
  if (body.status !== "OK") {
    const e = new Error(`Codeforces ${method} failed: ${body.comment}`);
    (e as any).retryable = /limit exceeded/i.test(body.comment ?? "");
    throw e;                            // ← HTTP 200 but logically failed
  }
  return body.result as T;
}
```

### `src/server.ts` (transport-agnostic core)
```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOLS } from "./tools/index.js";

export function buildServer() {
  const server = new McpServer(
    { name: "cp-mcp", version: "0.1.0" },
    {
      capabilities: { tools: {}, logging: {} },
      instructions: [
        "Tools for Codeforces and AtCoder practice data.",
        "Upstream APIs are rate-limited; results may be served from cache with a",
        "'data as of' footer. Prefer search tools over many single lookups.",
        "Difficulty is on the Codeforces rating scale; AtCoder values are ESTIMATES",
        "and are labelled as such — never present them as official ratings.",
        "Solved status must come from verified solved tools, never inferred.",
      ].join(" "),
    }
  );
  for (const t of TOOLS) {
    server.registerTool(t.name, { title: t.title, description: t.description,
      inputSchema: t.schema, annotations: t.annotations }, t.handler);
  }
  return server;
}
```

### `src/bin/stdio.ts`
```ts
#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "../server.js";
// NOTE: stdout is the protocol. All logging goes to stderr.
const server = buildServer();
await server.connect(new StdioServerTransport());
```

### `src/http.ts`
```ts
import { Hono } from "hono";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./server.js";

const app = new Hono();
app.get("/health", c => c.json({ ok: true }));
app.all("/mcp", async c => {
  // stateless mode: fresh server+transport per request ⇒ works on Workers/Lambda
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = buildServer();
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});
export default app;
```

## 9. Observability

- Log to **stderr** (stdio) / your platform log (HTTP): `{ts, tool, args_hash, cache:"hit|miss|stale", upstream_calls, ms, ok}`.
- Counters: upstream calls per host per minute, cache hit rate, tool error rate.
- `/health` returns snapshot ages so you can see a stale catalogue at a glance.

## 10. Non-functional requirements

| NFR | Target |
|---|---|
| p95 tool latency (warm) | < 1.5s |
| p95 tool latency (cold sync) | < 8s, with partial results allowed |
| Upstream politeness | ≤ 1 CF req/2s, ≤ 1 AC req/1s, globally |
| Median result size | < 800 tokens; hard cap ~2k |
| Cold start (Workers) | < 300ms |
| Availability | Degrade to cache-only rather than fail |
| Portability | Works with zero config and zero secrets |

## 11. Key design decisions (see 09 for full ADRs)

1. TypeScript + official SDK — best client compatibility and `npx` distribution.
2. SQLite as cache — one file, real indexes, trivially inspectable; swap to D1/KV when remote.
3. Task-shaped tools, ≤10 of them.
4. Difficulty normalized to the CF scale with an explicit confidence label.
5. Stateless Streamable HTTP so a serverless deploy is possible.
6. Read-only, credential-free v1.
