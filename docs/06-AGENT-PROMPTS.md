# 06 - Prompts

Three kinds of prompts live here:

- A. Coding-agent prompts - paste into Claude Code / Cursor / Codex to build each milestone.
- B. In-server prompt strings - the descriptions and instructions your server ships.
- C. MCP prompts primitive - user-invocable workflows exposed by the server (M6).

---

# A. Coding-agent prompts

## A0. Session bootstrap (paste at the start of every coding session)

```
You are helping me build cp-mcp, an open MCP server exposing Codeforces and AtCoder
data as tools to any MCP client.

Read these docs before writing code and follow them exactly:
docs/00-GOALS.md, docs/01-MCP-PRIMER.md, docs/02-UPSTREAM-APIS.md,
docs/03-SYSTEM-DESIGN.md, docs/04-TOOL-CONTRACTS.md, docs/05-BUILD-PLAN.md

Non-negotiable constraints:
1. Codeforces allows max 1 request per 2 seconds. Over-limit responses arrive as HTTP 200
   with a body whose status field is FAILED and comment is 'Call limit exceeded'.
   Detect failures from the BODY, never from the HTTP status alone.
2. AtCoder Problems (kenkoooo) is unofficial: sleep more than 1s between requests, use
   ETag / If-None-Match, expect endpoints to change. Send a descriptive User-Agent.
3. Layering: upstream -> cache -> domain -> tools -> server. The MCP layer must not know
   about HTTP; the upstream layer must not know about MCP. Domain logic is pure functions.
4. Tools are task-shaped, read-only, output-capped, deterministic, with a freshness footer.
5. On stdio, stdout is the protocol. All logs go to stderr.
6. TypeScript strict. Zod schemas are the single source of truth for tool input schemas.
7. Never fetch a URL derived from tool arguments unless the host is on an allowlist.

Work one task at a time from the current milestone in 05-BUILD-PLAN.md. After each task:
run typecheck and tests, then tell me the exact command to verify it manually in the MCP
Inspector. Do not start the next task until I confirm.
```

## A1. M1 - upstream plus first tool

```
Implement M1 from docs/05-BUILD-PLAN.md.

Create:
- src/upstream/http.ts: politeFetch(url, opts) with a per-host p-queue
  (codeforces.com: intervalCap 1, interval 2100ms, concurrency 1; kenkoooo.com:
  1, 1200ms, 1), a hostname allowlist that throws on anything else, AbortController
  timeout, 3 retries with exponential backoff plus jitter for network errors, 5xx and
  Codeforces call-limit failures, and ETag support returning notModified on 304.
- src/upstream/codeforces.ts: cfCall(method, params) that throws a typed UpstreamError
  with a retryable flag whenever the response body status is not OK.
- src/domain/types.ts and src/domain/normalize.ts: UserProfile plus cfUserToProfile().
- src/tools/getUserCodeforces.ts: tool T1-CF exactly as specified in docs/04-TOOL-CONTRACTS.md.
- src/format/freshness.ts: footer builder with source, upstream call count, partial flag.

Tests (vitest) with fixtures in test/fixtures:
- happy path user.info
- call-limit body surfaced as a TOOL error (isError true) with actionable text, not a crash
- unknown handle produces an actionable tool error
- queue spacing: two sequential CF calls are at least 2000ms apart (fake timers)

Do not add other tools yet.
```

## A2. M2 - cache plus search

```
Implement M2 from docs/05-BUILD-PLAN.md.

- src/cache/db.ts: better-sqlite3, WAL mode, migrations for the kv and problems tables
  exactly as in docs/03-SYSTEM-DESIGN.md section 4, including indexes.
- src/cache/kv.ts: getOrLoad(key, ttlS, loader) with stale-while-revalidate: on stale,
  return the cached value immediately and refresh in the background; never throw while a
  stale value exists. Store and send ETags.
- src/cache/sync.ts: syncCfProblemCatalogue() - one problemset.problems call, normalized
  into problems rows in a single transaction, recording the snapshot time. Skip gym and
  ACMSGURU rows.
- src/domain/search.ts: pure searchProblems(rows, filters) implementing the band filter,
  tag any/all modes, min_solved_count, ranking by band-centre proximity then solver count
  then id, with an optional seeded shuffle. No I/O in this file.
- src/tools/searchProblemsCodeforces.ts (T3-CF, Codeforces only for now), ratingHistoryCodeforces.ts (T2-CF), getProblemCodeforces.ts (T4-CF).
- src/format/table.ts: compact markdown tables that truncate long names.

Tests: ranking is deterministic; limit clamping works and is reported in the footer; tag
all-mode is strict; problems with no rating are excluded from banded searches.
```

## A3. M3 - AtCoder plus normalization

```
Implement M3 from docs/05-BUILD-PLAN.md.

- src/upstream/atcoder.ts: typed loaders for the resources JSON datasets (contests,
  problems, merged-problems, contest-problem, problem-models) with If-None-Match, plus the
  v3 user submissions and ac_rank endpoints. Respect the 1.2s spacing queue.
- src/domain/difficulty.ts: toCfScale(estimated) per docs/02-UPSTREAM-APIS.md section 3,
  returning difficulty, source and confidence. Clamp to 800..3500. An experimental model
  means low confidence.
- Extend the problems ingest to AtCoder. Deduplicate by problem id when a problem belongs
  to two contests; keep the primary contest for URL building. Add a regression test using
  the abc058 and arc071 pair.
- Implement site-specific AtCoder tools: cp_search_problems_atcoder and cp_get_problem_atcoder, and label every AtCoder difficulty as estimated.
- Implement cp_get_user_atcoder, cp_get_problem_atcoder, cp_upcoming_contests_codeforces, and cp_upcoming_contests_atcoder with IANA timezone conversion.

Acceptance: a single search returns a mixed list, every AtCoder row labelled estimated,
zero duplicate problem ids.
```

## A4. M4 - verification (be paranoid here)

```
Implement M4 from docs/05-BUILD-PLAN.md. This is the most correctness-sensitive milestone.

- Migrations for user_solved and user_sync.
- src/cache/sync.ts: syncSubmissions(site, handle) implementing the algorithm in
  docs/03-SYSTEM-DESIGN.md section 4. Codeforces pages newest-first via user.status with
  from and count, stopping when a page is older than the watermark, with a first-backfill
  cap of 5000. AtCoder pages oldest-first via from_second, advancing the cursor.
  Idempotent upserts, 60s watermark overlap, never re-fetch already-synced history.
- Background execution so a cold handle does not block a tool call. Tools return a partial
  flag with a clear note while a sync is still warming.
- src/domain/verify.ts: pure verify(problems, submissions, options).
  Codeforces solved means verdict OK and, when requireFullTests is set, testset TESTS.
  AtCoder solved means result AC. attempted means at least one submission with no
  qualifying AC. untouched means zero submissions. Report withinWindow separately and
  never hide an AC that happened outside the window. Ignore TESTING, WJ, Judging and
  SKIPPED in attempt counts but note their presence.
- src/tools/verifySolvedCodeforces.ts (T6-CF) & verifySolvedAtcoder.ts (T6-AC), and getSubmissionsCodeforces.ts (T5-CF) & getSubmissionsAtcoder.ts (T5-AC) per docs/04-TOOL-CONTRACTS.md.

Tests: fixtures covering WA-then-OK, an OK on pretests only with requireFullTests both
true and false, an AC before the since window, virtual participation, contest versus
practice, an unrated new problem, and an AtCoder problem shared by two contests.
```

## A5. M5 - remote transport

```
Implement M5 from docs/05-BUILD-PLAN.md.

- src/http.ts: Hono app. GET /health returns snapshot ages, cache hit rate and version.
  ALL /mcp wires StreamableHTTPServerTransport in stateless mode (a fresh server and
  transport per request) so it also works on serverless platforms.
- Validate the Origin header, reject non-HTTPS in production, keep the image free of secrets.
- Per-IP rate limit of 60 tool calls per 5 minutes, returned as a tool error that explains
  the limit, plus a global upstream budget guard that switches to cache-only when tripped.
- Keep the cache backend behind an interface so SQLite locally and D1/KV on Workers both work.
- Add a Dockerfile and deployment notes for the chosen platform.

Acceptance: the MCP Inspector connects to the deployed HTTPS URL and every tool works.
```

## A6. Review prompt (run before closing any milestone)

```
Review the diff for this milestone against docs/00-GOALS.md and docs/04-TOOL-CONTRACTS.md.
Report, as a checklist with file and line references:
1. Any upstream call that can bypass the throttling queue.
2. Any place where an HTTP 200 with a failed body could be treated as success.
3. Any tool output that is unbounded, non-deterministic, or missing a freshness footer.
4. Any domain logic that performs I/O, or MCP-layer code that knows about HTTP.
5. Any log line written to stdout.
6. Any tool argument that reaches fetch, a SQL string, or the filesystem unvalidated.
7. Any tool description that fails to say when NOT to use the tool.
Then list the smallest set of fixes, ordered by risk.
```
