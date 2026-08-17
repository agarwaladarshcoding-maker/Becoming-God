# cp-mcp — Claude Code Rules

## What This Is

An open, read-only MCP server exposing Codeforces and AtCoder competitive programming data as 18 task-shaped tools (9 for Codeforces, 9 for AtCoder) to any MCP-speaking client (Claude Desktop/Web, Notion agents, Cursor, Gemini CLI). The killer feature is machine-verified solve status — no more self-reported training logs.

Stack: TypeScript (strict), `@modelcontextprotocol/sdk`, `better-sqlite3`, `p-queue`, `hono`, `zod`, `vitest`.

## Architecture (5 Layers — Never Violate)

```
L4  MCP server    — registry, schemas, result formatting
L3  Tools         — one file per tool, arg validation, formatting
L2  Domain        — pure functions: normalize, verify, search, rank
L1  Cache         — SQLite + TTL + stale-while-revalidate + ETag
L0  Upstream      — throttled HTTP clients, retries, circuit breaker
```

- L4 must not know about HTTP. L0 must not know about MCP.
- L2 is pure — no I/O. All interesting logic lives here.
- L3 must not contain business logic — it validates, calls L2, formats.

## Coding Rules

### Modularity
- One file per tool in `src/tools/`.
- One file per upstream API in `src/upstream/`.
- Domain logic split by concern: `verify.ts`, `search.ts`, `difficulty.ts`, `normalize.ts`, `analytics.ts`.
- No circular imports across layers. Dependencies flow down: L4 → L3 → L2 → L1 → L0.

### TypeScript
- `strict: true` everywhere, no `any` escapes.
- Zod schemas are the single source of truth for tool input — JSON Schema is generated, never hand-written.
- Domain types in `src/domain/types.ts` — `Problem`, `Submission`, `UserProfile`, `VerificationResult`.

### Testing
- Test first when touching domain logic.
- Recorded fixtures in `test/fixtures/` — never hit live upstreams from automated tests.
- Trim fixtures to the smallest set that exercises the edge case.
- Every tool needs: happy path test, failure path test, Inspector manual verification.

### Output & Formatting
- Every tool result ends with a freshness footer: source, upstream call count, partial flag.
- Output is capped (search: ~800 tokens, verify: ~600 tokens). A formatting change that doubles output is a bug.
- `structuredContent` mirrors text for programmatic consumers.
- Compact markdown tables, never raw JSON dumps.

### Error Handling
- Tool errors return `isError: true` with actionable text — never crash the protocol.
- Upstream failures degrade to stale cache with a staleness note, not a failure.
- CF rate-limit (HTTP 200 with `status: "FAILED"`) must be detected from the body, never from HTTP status.
- SSRF guard: refuse any fetch to a non-allowlisted host.

### Logging
- **stdout is the protocol** on stdio transport. ALL logs go to stderr.
- Log format: `{ts, tool, args_hash, cache:"hit|miss|stale", upstream_calls, ms, ok}`.

## Rate Limits (Non-Negotiable)

- **Codeforces**: 1 request per 2 seconds. Queue with `PQueue({ intervalCap: 1, interval: 2100, concurrency: 1 })`.
- **AtCoder Problems (kenkoooo)**: volunteer-run. Sleep >1s between requests. Honor ETags. Send descriptive User-Agent.

## Tool Design Principles

- Tools are **task-shaped**, not endpoint-shaped. One tool may fan out to 3 upstream calls.
- Tools are **read-only**, **output-capped**, **deterministic** (with seeded shuffle for variety).
- `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` are the products — if they are wrong, nothing else matters.
- Never infer solved status from anything other than submissions via the custom verification tools.
- Tool descriptions state when to use AND when NOT to use (name the better tool).
- `annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true }` on all tools.

## Commit Convention

- Prefix: `M<n>: <task description>` (e.g., `M1: add throttled fetch with PQueue`).
- One task per commit. Gate unmet = milestone not done.

## Things That Will Tempt You (Don't)

1. Adding `cf_raw_api_call` — the model will only use that and rate limits die.
2. Skipping the cache — it works for one user, not five.
3. Returning raw upstream JSON — expensive and unusable.
4. Trusting HTTP status codes from Codeforces.
5. Logging to stdout on stdio transport.
6. Inferring solved from anything other than submissions.
7. Building a third judge before the first two are audited.
8. Shipping without the 50-problem manual audit.

## Doc Reference

Read these before writing code:
- `docs/00-GOALS.md` — goals, non-goals, success metrics
- `docs/01-MCP-PRIMER.md` — MCP protocol fundamentals
- `docs/02-UPSTREAM-APIS.md` — CF + AtCoder endpoints, limits, payload shapes
- `docs/03-SYSTEM-DESIGN.md` — architecture, cache, domain model, repo layout
- `docs/04-TOOL-CONTRACTS.md` — all 18 tool schemas and behavior specs
- `docs/05-BUILD-PLAN.md` — milestones M0-M7, daily loop, definition of done
- `docs/07-TESTING-QA.md` — 5 test layers, fixture rules, acceptance checks
- `docs/09-RISKS-AND-DECISIONS.md` — ADRs, risks, legal boundaries
