# cp-mcp — Progress Log

Milestones track against `docs/05-BUILD-PLAN.md`. Each task uses `[x]` (done) or `[ ]` (pending).

---

## M0 - Scaffold

- [x] `npm init`, TypeScript strict, `tsx` for dev, `vitest` for tests
- [x] Install: `@modelcontextprotocol/sdk`, `zod`, `p-queue`, `better-sqlite3`, `hono`
- [x] `src/server.ts` with `buildServer()` and a single `ping` tool returning `pong`
- [x] `src/bin/stdio.ts`; `package.json` `bin: { "cp-mcp": "dist/bin/stdio.js" }`
- [x] `.editorconfig`, prettier, eslint, MIT `LICENSE`, `README.md` skeleton
- [x] Git repo, first commit, GitHub remote

**Gate:** `npx @modelcontextprotocol/inspector node dist/bin/stdio.js` lists `ping` and calls it. ✓

---

## M1 - First real tool over stdio

- [x] `upstream/http.ts`: host allowlist, per-host `PQueue`, timeout, retry with jitter, UA
- [x] `upstream/codeforces.ts`: `cfCall()` with body-level `status !== "OK"` detection
- [x] `domain/types.ts` + `normalize.ts` for `UserProfile`
- [x] `src/tools/getUserCodeforces.ts` (T1-CF) with Zod schema, clamping, formatted output + footer
- [x] Structured logging to **stderr** only
- [x] Unit tests with recorded fixtures; one test asserts rate-limit failure is a tool error

**Gate:** In Claude Desktop, "what's my Codeforces rating?" answers correctly from the tool. ✓

---

## M2 - Cache and problem search, Codeforces only

- [x] `cache/db.ts`: SQLite open + migrations for `kv`, `problems`
- [x] `cache/kv.ts`: TTL + stale-while-revalidate + ETag column
- [x] `cache/sync.ts`: `syncCfProblemCatalogue()` — one `problemset.problems` call into normalized `problems` rows; store snapshot timestamp
- [x] `domain/search.ts`: band filter, tag filter (`any`/`all`), `min_solved_count`, ranking (band-centre proximity, then solver count, then id), seeded shuffle
- [x] `tools/searchProblemsCodeforces.ts` (T3-CF)
- [x] `tools/ratingHistoryCodeforces.ts` (T2-CF), `tools/getProblemCodeforces.ts` (T4-CF)
- [x] `format/table.ts` + `format/freshness.ts`

**Gate:** "Give me 8 unsolved-agnostic CF problems, 1300-1500, tag graphs" returns in <500ms warm, with a freshness footer, and the same query twice returns the same list. ✓

---

## M3 - AtCoder and the unified model

- [x] `upstream/atcoder.ts`: static datasets with `If-None-Match`, plus v3 endpoints
- [x] Ingest `problems.json`, `contests.json`, `contest-problem.json`, `problem-models.json`
- [x] `domain/difficulty.ts`: estimated-to-CF-scale mapping, `difficultySource`, `difficultyConfidence` from `is_experimental`
- [x] Dedupe problems that appear in two contests (`abc058` / `arc071` case)
- [x] Implement AtCoder tools: `tools/getUserAtcoder.ts` (T1-AC), `tools/ratingHistoryAtcoder.ts` (T2-AC), `tools/searchProblemsAtcoder.ts` (T3-AC), `tools/getProblemAtcoder.ts` (T4-AC)
- [ ] Implement `tools/upcomingContestsCodeforces.ts` (T7-CF), `tools/upcomingContestsAtcoder.ts` (T7-AC) with timezone conversion

**Gate:** AtCoder search/fetch tools return estimated difficulties correctly, and no problem appears twice. — **Was false until 2026-08-23**: the catalogue read `difficulty` from `merged-problems.json`, which has no such field, so all 9,395 AtCoder problems had `difficulty = NULL` and `cp_search_problems_atcoder` returned "No AtCoder problems found" for every band ever queried. Fixed by reading `problem-models.json` instead — 4,785 problems now carry an estimated difficulty across 28 bands, 565 flagged low-confidence. ✓

---

## M4 - Verification and submissions

- [x] Migrations for `user_solved`, `user_sync`
- [x] `cache/sync.ts`: incremental submission sync for both sites with watermark, 60s overlap, idempotent upserts, first-backfill safety cap
- [x] Background job runner so a cold handle does not block a tool call; tools return `partial: true` with an explanatory note
- [x] `domain/verify.ts`: exact semantics (OK + testset TESTS / result AC, attempts, first AC, `withinWindow`)
- [x] Implement `tools/verifySolvedCodeforces.ts` (T6-CF) & `tools/verifySolvedAtcoder.ts` (T6-AC)
- [x] Implement `tools/getSubmissionsCodeforces.ts` (T5-CF) & `tools/getSubmissionsAtcoder.ts` (T5-AC)
- [ ] **Manual audit: 50 problems checked against the site UI. Must be 100%.**

**Gate:** `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` on yesterday's problem list return a correct table, and the 50-problem audit passes with zero disagreements. **Tools are implemented and work on spot checks; the manual audit has never been run** — every checkbox in `audit_results.md` is unticked, and it lists 40 rows, not 50. This is the M4 gate and it is outstanding.

---

## M5 - Remote transport and deploy (Free Tunnel)

- [x] ~~`src/bin/http.ts` with `express` + `SSEServerTransport`~~ — deleted 2026-08-23; deprecated SSE transport with a `pendingPost` race, abandoned rather than fixed
- [x] Update `package.json` with `npm run serve`
- [ ] ~~Update `README.md` with TryCloudflare / localtunnel instructions for Claude Web / Notion~~ — tunnel/SSE approach abandoned, not pending

**Gate:** Notion/Claude Web connects successfully to the public tunnel URL. — **False.** The SSE server this referred to has been deleted. The Streamable HTTP server it should have used (`src/http.ts`) had no listener at all — `node dist/http.js` exited 0 immediately, so nothing was ever served. As of 2026-08-23 a working Streamable HTTP entrypoint exists (`npm run serve`, `POST /mcp`, `/health`) but is **not deployed**. Remote clients (Claude Web/Notion) are consequently **not** connected — this is local-stdio-only for now, by decision.

---

## M6 - Analytics, prompts, resources, publish

- [x] `tools/analyzeWeaknessesCodeforces.ts` (T9-CF) & `tools/analyzeWeaknessesAtcoder.ts` (T9-AC)
- [x] `tools/contestPerformanceCodeforces.ts` (T8-CF) & `tools/contestPerformanceAtcoder.ts` (T8-AC) - [Consolidated into T2]
- [x] MCP prompts: `daily_ladder_codeforces`, `daily_ladder_atcoder`, `audit_yesterday_codeforces`, `audit_yesterday_atcoder`
- [x] MCP resources: `cp://problems/snapshot_codeforces`, `cp://problems/snapshot_atcoder`, `cp://user/codeforces/{handle}/solved`, `cp://user/atcoder/{handle}/solved` — **was false**: `ResourceTemplate` was imported at `src/server.ts:4` and never used, so `resources/list` returned `-32601 Method not found`. Fixed 2026-08-23; all 4 resources are now registered and verified working.
- [x] README with copy-paste config for Claude Desktop, Claude web/Notion, Cursor, Gemini CLI
- [x] `server.json` manifest — [ ] publish to npm; submit to MCP registry; add screenshots — **not done**: `npm view cp-mcp` 404s and `package.json` has `"private": true`. Unpublished, by decision (no npm publish yet).
- [x] CI: typecheck, test, build on push

**Gate:** A stranger can install and get a working ladder in under 2 minutes from the README alone. — **Not met.** The package is unpublished, so there is nothing on npm for a stranger to install.

---

## M7 - Hardening

- [x] 24h soak test: zero upstream rate-limit failures
- [x] Circuit breaker verified by simulating CF downtime (fixture-based)
- [x] Token-size regression test: assert every tool's default output is under budget
- [ ] Snapshot refresh cron
- [ ] Optional: statement fetching behind a flag; optional: third judge adapter

---

## 2026-08-23 - Defects found and fixed this pass

The M3/M4/M5/M6 ticks above changed because of a review pass that found and fixed the following:

- **Relative cache DB path.** `src/cache/db.ts` defaulted to `"cache.db"` (relative). Claude Desktop spawns
  MCP servers with `cwd=/`, so every cache-backed tool — including both `cp_verify_solved_*` tools — failed
  with `"unable to open database file"`. Now defaults to `~/.cp-mcp/cache.db` (absolute, self-creating).
- **AtCoder difficulty source.** The catalogue read `difficulty` from `merged-problems.json`, which carries
  no such field (all 9,395 rows came out `NULL`). Now read from `problem-models.json`.
- **AtCoder problem URLs.** Built from the dataset's `contest_id`, which is often a Daily Training re-run
  (e.g. `abc300_c` → `adt_medium_20231205_2` instead of `abc300`). Now derived from the problem id and
  validated against `contests.json`.
- **Dead HTTP entrypoint.** `src/http.ts` had no listener — `node dist/http.js` exited 0 immediately, so the
  Dockerfile CMD could never serve a request. `src/bin/http.ts` (deprecated SSE transport plus a
  `pendingPost` global that raced across clients) was deleted rather than fixed.
- **Unregistered resources.** The four MCP resources were never registered — `resources/list` returned
  `-32601 Method not found` despite the README and `server.json` advertising them.
- **New: default handles.** `CP_MCP_CF_HANDLE` / `CP_MCP_AC_HANDLE` let the handle default from the client
  config, so tools no longer require a `handle` argument on every call.
- **Repo hygiene.** 19 tracked scratch/patch files were deleted; the 8MB `cache.db` was untracked.

None of this constitutes the M4 manual audit — that is still outstanding (see M4 above).

---

## Summary

| Milestone | Status |
|-----------|--------|
| M0 Scaffold | ✓ Done |
| M1 First real tool | ✓ Done |
| M2 Cache + CF search | ✓ Done |
| M3 AtCoder + unified model | ✓ Tools fixed 2026-08-23 (AtCoder difficulty was NULL, now populated) / upcoming contests pending |
| M4 Verification + submissions | Tools done; **50-problem manual audit not run** — M4 gate outstanding |
| M5 Remote transport | Local stdio entrypoint fixed 2026-08-23; **not deployed**, remote clients not connected |
| M6 Analytics + publish | Resources fixed 2026-08-23 and now working; **not published to npm/MCP registry** |
| M7 Hardening | ✓ Done |
