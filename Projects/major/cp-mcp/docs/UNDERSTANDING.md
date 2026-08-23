# cp-mcp — Current Understanding

## What We're Building
- An open, read-only MCP server that gives any AI client (Claude, Notion, Cursor, Gemini) access to Codeforces + AtCoder data
- 17 tools exist today (16 CP tools + `ping`) — `cp_upcoming_contests_{codeforces,atcoder}` (T7) were registered 2026-08-23; `cp_contest_performance_{codeforces,atcoder}` (T8) is still specified in `docs/04-TOOL-CONTRACTS.md` but not implemented; the original design called for 18 (9 per platform)
- The core value: **machine-verified solve status** so training logs can't be faked

## Tool Inventory (17 implemented; design target is 9 per platform, 2 tools not yet built)

Each of the following exists as `_codeforces` and `_atcoder` variants:
1. `cp_get_user_{platform}` — profile snapshot (rating, rank, solved count)
2. `cp_rating_history_{platform}` — recent contest performance + trend
3. `cp_search_problems_{platform}` — the ladder engine (difficulty band, tags, exclude solved)
4. `cp_get_problem_{platform}` — single problem metadata + optional statement
5. `cp_get_submissions_{platform}` — recent submission history with verdicts
6. `cp_verify_solved_{platform}` — **THE killer tools** — prove from real submissions whether problems were solved
7. `cp_upcoming_contests_{platform}` — schedule with timezone conversion — **implemented and registered as of 2026-08-23**
8. `cp_contest_performance_{platform}` — post-contest breakdown — **not implemented**
9. `cp_analyze_weaknesses_{platform}` — tag-level stats to identify weak topics

## Architecture
- 5-layer design: Upstream (L0) → Cache (L1) → Domain (L2) → Tools (L3) → MCP Server (L4)
- Layers are strictly isolated — L4 doesn't know about HTTP, L0 doesn't know about MCP
- Domain layer (L2) is pure functions, no I/O — this is where all the interesting logic lives
- SQLite cache with TTL and stale-while-revalidate — tools almost never wait on network
- Two transports: stdio (local clients) and Streamable HTTP (remote/serverless)

## Critical Constraints
- CF rate limit: 1 req/2s, and failures come as HTTP 200 with `status: "FAILED"` in the body
- AtCoder Problems API is unofficial/volunteer-run — must be extra polite (>1s spacing, ETags, descriptive UA)
- AtCoder difficulties are IRT estimates mapped to CF scale — always labeled "estimated"
- Verification must be 100% accurate — the mandatory 50-problem M4 audit ran 2026-08-23: Codeforces 53/53, AtCoder blocked by a login wall

## Build Plan (7 Milestones)
- **M0**: Scaffold (npm, TS, ping tool) — ~90 min
- **M1**: First tool (`cp_get_user_codeforces`) over stdio — 1-2 blocks
- **M2**: SQLite cache + problem search (CF only) — 2-3 blocks
- **M3**: AtCoder integration + split tools — 2-3 blocks
- **M4**: Verification + submissions — 2-3 blocks (assume 2x time) ⚠️ **This is the product**
- **M5**: Remote transport + deploy — 1-2 blocks
- **M6**: Analytics, prompts, publish to npm/registry — 2-3 blocks
- **M7**: Hardening (soak test, circuit breaker, etc.)

## Key Design Decisions
- TypeScript + official MCP SDK for best client compatibility and `npx` distribution
- SQLite (not Redis) — zero infra, one file, fast enough by orders of magnitude
- Task-shaped tools split by platform (design target: 9 per platform; 17 implemented today) — better tool selection, simpler parameters, fewer round trips
- Stateless HTTP mode — works on serverless (Workers/Lambda)
- Read-only, credential-free — publicly shareable, tiny security surface

## The Notion Loop (Why This Matters)
- Morning: assign problems using `cp_search_problems_codeforces` / `cp_search_problems_atcoder` based on rating
- Evening: audit with `cp_verify_solved_codeforces` / `cp_verify_solved_atcoder` — day is Done only if tools confirm all solved
- Weekly: `cp_analyze_weaknesses_codeforces` / `cp_analyze_weaknesses_atcoder` drives the next week's topic focus
- Hard rule: the agent may never mark a day Done from prose — only from the tools

## Open Questions (To Resolve Before M3/M5)
- Do virtual/practice ACs count as solved?
- Exact AtCoder-to-CF difficulty mapping validation
- AtCoder synthetic tags?
- Cache backend for deployment (SQLite volume vs D1/KV)
- Third judge (CSES/CodeChef/LeetCode) — which one, after which milestone?

## Current State
- **All planning docs (00-10) are written and complete**
- **The server works over stdio** — 17 tools (16 CP tools + `ping`) implemented, 50/50 tests pass across 9 files, `npx tsc --noEmit` clean
- As of 2026-08-23, four defects that broke it in practice were found and fixed: the cache DB path was
  relative and failed under Claude Desktop's `cwd=/`; AtCoder difficulty was read from a JSON file that has
  no `difficulty` field (all 9,395 rows were `NULL`); AtCoder problem URLs pointed at the wrong contest for
  many problems; and the Streamable HTTP entrypoint (`src/http.ts`) had no listener, so it never served a
  request — the deprecated SSE server that duplicated it has been deleted. See `docs/progress.md`'s
  2026-08-23 entry for the full list, including the new `CP_MCP_CF_HANDLE`/`CP_MCP_AC_HANDLE` default-handle
  support.
- A second pass, also dated 2026-08-23, fixed a correctness defect in the verifier and switched on two
  finished-but-unwired tools: `cp_verify_solved_*` could report an old solve as `✗ untouched` simply because
  the cold-start sync hadn't downloaded that far back yet. A new `unknown`/`?` status now covers "not in
  synced history yet" without touching any positive (`solved`/`attempted`) result, the cold-start sync
  budget went from 4s to 20s so a normal account's history finishes on the first call instead of leaving
  most of it unresolved, and `cp_upcoming_contests_codeforces` / `cp_upcoming_contests_atcoder` (T7) were
  registered — the AtCoder one had to be repointed from kenkoooo's `contests.json` (a historical archive
  with zero future contests) to scraping `atcoder.jp/contests/` directly. See `docs/progress.md`'s second
  2026-08-23 entry for the full list.
- A third pass, also dated 2026-08-23, closed the remaining Tier 1 defects. `cp_search_problems_atcoder`
  no longer silently drops the 4,610 AtCoder problems (of 9,395) that have no kenkoooo difficulty estimate —
  it now always reports the exclusion count and offers `include_unrated: true` to return them (difficulty
  shown as `?`, ranked after every real match). The Codeforces submission sync's hard 10,000-submission
  ceiling — which looked like a clean finish and made the verifier print `✗ untouched` for solves outside
  the cap — is gone, replaced by ending the loop on Codeforces's real short final page. The container now
  builds and runs: a missing `.dockerignore` had been overwriting the image's Linux `node_modules` with
  macOS binaries and baking the developer's `cache.db` into the image, and the base image is now
  `node:22-slim` (see the Node requirement above; `better-sqlite3@13.0.3` segfaults under Node 20). The HTTP
  endpoint can now be gated with `CP_MCP_AUTH_TOKEN`, accepted as either a secret path segment
  (`/mcp/<token>`) or a `Bearer` header — the path form exists because claude.ai's custom-connector UI has
  no field for a custom header. See `docs/progress.md`'s third 2026-08-23 entry for the full list.
- Wired into Claude Code via `.mcp.json` in this repo. Remote (Streamable HTTP) is built, containerized, and
  auth-gated — all verified locally, including a live probe of the auth gate against the built server — but
  **still not deployed**. Creating the Fly app failed with `Error: We need your payment information to
  continue!` (no card on the Fly account). This is ready-and-blocked-on-billing, not "not started": the
  README documents the exact `flyctl` command sequence to run once that's resolved. Claude Web and Notion
  cannot reach the server yet.
- **`cp_upcoming_contests_*` (T7) are now implemented and registered.** `cp_contest_performance_*` (T8)
  remains unimplemented — out of scope for now.
- **The M4 manual audit was run on 2026-08-23 and the Codeforces half passed 53/53.** Every row was checked
  against `codeforces.com/submissions/AdarshAg/contest/<id>` — the site UI, a different code path from the
  `api/user.status` the tool reads — and status, attempt count and first-AC timestamp agreed on all 53,
  including live-contest submissions judged on pretests. "Machine-verified" is now a proven claim for
  Codeforces. **The AtCoder half is still open:** every AtCoder page showing per-user submissions requires a
  signed-in account, so the shared verification *logic* is audited but the kenkoooo mirror it reads is
  trusted, not verified. Closing that needs a human with an AtCoder login. See `audit_results.md`.
