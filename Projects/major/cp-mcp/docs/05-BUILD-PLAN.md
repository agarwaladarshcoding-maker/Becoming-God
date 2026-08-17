# 05 - Build Plan

Seven milestones. Each has a **gate**: a demonstrable artifact. No gate, no progress.
Estimates assume focused evening blocks; adjust to your daily contract.

---

## M0 - Scaffold (1 block, ~90 min)

Tasks
- [ ] `npm init`, TypeScript strict, `tsx` for dev, `vitest` for tests.
- [ ] Install: `@modelcontextprotocol/sdk`, `zod`, `p-queue`, `better-sqlite3`, `hono`.
- [ ] `src/server.ts` with `buildServer()` and a single `ping` tool returning `pong`.
- [ ] `src/bin/stdio.ts`; `package.json` `bin: { "cp-mcp": "dist/bin/stdio.js" }`.
- [ ] `.editorconfig`, prettier, eslint, MIT `LICENSE`, `README.md` skeleton.
- [ ] Git repo, first commit, GitHub remote.

Gate: `npx @modelcontextprotocol/inspector node dist/bin/stdio.js` lists `ping` and calls it.

---

## M1 - First real tool over stdio (1-2 blocks)

Tasks
- [ ] `upstream/http.ts`: host allowlist, per-host `PQueue`, timeout, retry with jitter, UA.
- [ ] `upstream/codeforces.ts`: `cfCall()` with **body-level** `status !== "OK"` detection.
- [ ] `domain/types.ts` + `normalize.ts` for `UserProfile`.
- [ ] `src/tools/getUserCodeforces.ts` (T1-CF) with Zod schema, clamping, formatted output + footer.
- [ ] Structured logging to **stderr** only.
- [ ] Unit tests with recorded fixtures; one test asserts rate-limit failure is a tool error.

Gate: In Claude Desktop, "what's my Codeforces rating?" answers correctly from the tool.

---

## M2 - Cache and problem search, Codeforces only (2-3 blocks)

Tasks
- [ ] `cache/db.ts`: SQLite open + migrations for `kv`, `problems`.
- [ ] `cache/kv.ts`: TTL + stale-while-revalidate + ETag column.
- [ ] `cache/sync.ts`: `syncCfProblemCatalogue()` - one `problemset.problems` call into
      normalized `problems` rows; store snapshot timestamp.
- [ ] `domain/search.ts`: band filter, tag filter (`any`/`all`), `min_solved_count`,
      ranking (band-centre proximity, then solver count, then id), seeded shuffle.
- [ ] `tools/searchProblemsCodeforces.ts` (T3-CF).
- [ ] `tools/ratingHistoryCodeforces.ts` (T2-CF), `tools/getProblemCodeforces.ts` (T4-CF).
- [ ] `format/table.ts` + `format/freshness.ts`.

Gate: "Give me 8 unsolved-agnostic CF problems, 1300-1500, tag graphs" returns in <500ms
warm, with a freshness footer, and the same query twice returns the same list.

---

## M3 - AtCoder and the unified model (2-3 blocks)

Tasks
- [ ] `upstream/atcoder.ts`: static datasets with `If-None-Match`, plus v3 endpoints.
- [ ] Ingest `problems.json`, `contests.json`, `contest-problem.json`, `problem-models.json`.
- [ ] `domain/difficulty.ts`: estimated-to-CF-scale mapping, `difficultySource`,
      `difficultyConfidence` from `is_experimental`.
- [ ] Dedupe problems that appear in two contests (`abc058` / `arc071` case).
- [ ] Implement AtCoder tools: `tools/getUserAtcoder.ts` (T1-AC), `tools/ratingHistoryAtcoder.ts` (T2-AC), `tools/searchProblemsAtcoder.ts` (T3-AC), `tools/getProblemAtcoder.ts` (T4-AC).
- [ ] Implement `tools/upcomingContestsCodeforces.ts` (T7-CF), `tools/upcomingContestsAtcoder.ts` (T7-AC) with timezone conversion.

Gate: AtCoder search/fetch tools return estimated difficulties correctly, and no problem appears twice.

---

## M4 - Verification and submissions (2-3 blocks) - the milestone that matters

Tasks
- [ ] Migrations for `user_solved`, `user_sync`.
- [ ] `cache/sync.ts`: incremental submission sync for both sites (see 03 section 4)
      with watermark, 60s overlap, idempotent upserts, first-backfill safety cap.
- [ ] Background job runner so a cold handle does not block a tool call; tools return
      `partial: true` with an explanatory note.
- [ ] `domain/verify.ts`: exact semantics (OK + testset TESTS / result AC, attempts, first AC,
      `withinWindow`).
- [ ] Implement `tools/verifySolvedCodeforces.ts` (T6-CF) & `tools/verifySolvedAtcoder.ts` (T6-AC).
- [ ] Implement `tools/getSubmissionsCodeforces.ts` (T5-CF) & `tools/getSubmissionsAtcoder.ts` (T5-AC).
- [ ] **Manual audit: 50 problems checked against the site UI. Must be 100%.**

Gate: `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` on yesterday's problem list return a correct table, and the
50-problem audit passes with zero disagreements.

---

## M5 - Remote transport and deploy (1-2 blocks)

Tasks
- [ ] `src/http.ts` with Hono + `StreamableHTTPServerTransport` in **stateless** mode.
- [ ] `/health` returning snapshot ages and cache hit rate.
- [ ] Per-IP rate limit (e.g. 60 tool calls / 5 min) and a global upstream budget guard.
- [ ] `Origin` validation; HTTPS only; no secrets in the image.
- [ ] Cache backend for the target platform (D1/KV on Workers, or a volume for Fly/Railway).
- [ ] Deploy; smoke test with Inspector against the public URL.
- [ ] Connect from Notion and Claude web.

Gate: Notion agent calls `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` against the deployed URL successfully.

---

## M6 - Analytics, prompts, resources, publish (2-3 blocks)

Tasks
- [ ] Implement `tools/analyzeWeaknessesCodeforces.ts` (T9-CF) & `tools/analyzeWeaknessesAtcoder.ts` (T9-AC).
- [ ] Implement `tools/contestPerformanceCodeforces.ts` (T8-CF) & `tools/contestPerformanceAtcoder.ts` (T8-AC).
- [ ] MCP prompts: `daily_ladder_codeforces`, `daily_ladder_atcoder`, `audit_yesterday_codeforces`, `audit_yesterday_atcoder`.
- [ ] MCP resources: `cp://problems/snapshot_codeforces`, `cp://problems/snapshot_atcoder`, `cp://user/codeforces/{handle}/solved`, `cp://user/atcoder/{handle}/solved`.
- [ ] README with copy-paste config for Claude Desktop, Claude web/Notion, Cursor, Gemini CLI.
- [ ] `server.json` manifest; publish to npm; submit to the MCP registry; add screenshots.
- [ ] CI: typecheck, test, build on push.

Gate: A stranger can install and get a working ladder in under 2 minutes from the README alone.

---

## M7 - Hardening (ongoing)

- [ ] 24h soak test: zero upstream rate-limit failures.
- [ ] Circuit breaker verified by simulating CF downtime (fixture-based).
- [ ] Token-size regression test: assert every tool's default output is under budget.
- [ ] Snapshot refresh cron.
- [ ] Optional: statement fetching behind a flag; optional: third judge adapter.

---

## Daily working loop

1. Pick the **single next unchecked task** in the current milestone. No skipping ahead.
2. Write the test or fixture first when touching domain logic.
3. Implement, run `vitest`, then verify by hand in Inspector.
4. Commit with `M<n>: <task>`.
5. Log the artifact (file path + commit) in your progress log. Gate unmet = milestone not done.

## Definition of Done (applies to every tool)

- [ ] Zod schema with bounds, enums, defaults; JSON Schema generated, not hand-written.
- [ ] Description states when to use, when not to, and the units.
- [ ] `annotations.readOnlyHint = true`.
- [ ] Output capped, deterministic ordering, freshness footer.
- [ ] `structuredContent` present and matching the text.
- [ ] Errors caused by the outside world return `isError: true` with actionable text.
- [ ] Unit test with a recorded fixture, plus one failure-path test.
- [ ] Verified by hand in Inspector and in at least one real client.

## Risk buffer

Assume M4 takes twice as long as planned. Submission paging, boundary conditions and the
50-problem audit are where reality bites. Everything before M4 is plumbing; M4 is the product.
