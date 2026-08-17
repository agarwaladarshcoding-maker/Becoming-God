# cp-mcp — Progress Tracker

## Current Status: M0 Completed, Starting M1 (Upstream API + User Info)

Scaffold setup is complete. Verification via MCP Inspector has passed successfully.

---

## Milestone Tracker

### M0 — Scaffold (~90 min)
- [x] `npm init`, TypeScript strict, `tsx` dev, `vitest` tests
- [x] Install deps: `@modelcontextprotocol/sdk`, `zod`, `p-queue`, `better-sqlite3`, `hono`
- [x] `src/server.ts` with `buildServer()` and `ping` tool
- [x] `src/bin/stdio.ts` with bin entry in package.json
- [x] `.editorconfig`, prettier, eslint, MIT LICENSE, README skeleton
- [x] Git repo, first commit, GitHub remote

**Gate:** Inspector lists `ping` and calls it successfully.

---

### M1 — First Real Tool (1-2 blocks)
- [ ] `src/upstream/http.ts` — host allowlist, PQueue throttle, timeout, retry, UA
- [ ] `src/upstream/codeforces.ts` — `cfCall()` with body-level error detection
- [ ] `src/domain/types.ts` + `normalize.ts` — `UserProfile` + `cfUserToProfile()`
- [ ] `src/tools/getUserCodeforces.ts` (T1-CF) — Zod schema, clamping, formatted output + footer
- [ ] Structured logging to stderr
- [ ] Unit tests with fixtures; rate-limit failure → tool error test

**Gate:** "What's my Codeforces rating?" answers correctly in Claude Desktop.

---

### M2 — Cache + Problem Search, CF Only (2-3 blocks)
- [ ] `cache/db.ts` — SQLite open + migrations for `kv`, `problems`
- [ ] `cache/kv.ts` — TTL + stale-while-revalidate + ETag
- [ ] `cache/sync.ts` — `syncCfProblemCatalogue()`
- [ ] `domain/search.ts` — band filter, tag filter, ranking, seeded shuffle
- [ ] `tools/searchProblemsCodeforces.ts` (T3-CF)
- [ ] `tools/ratingHistoryCodeforces.ts` (T2-CF), `tools/getProblemCodeforces.ts` (T4-CF)
- [ ] `format/table.ts` + `format/freshness.ts`

**Gate:** Search returns <500ms warm, freshness footer present, deterministic ordering.

---

### M3 — AtCoder + split AtCoder tools (2-3 blocks)
- [ ] `upstream/atcoder.ts` — static datasets with ETag, v3 endpoints
- [ ] Ingest AtCoder problems, contests, problem-models
- [ ] `domain/difficulty.ts` — AtCoder IRT → CF scale mapping
- [ ] Deduplicate cross-contest problems (abc058/arc071 regression test)
- [ ] Implement AtCoder tools: `tools/getUserAtcoder.ts` (T1-AC), `tools/ratingHistoryAtcoder.ts` (T2-AC), `tools/searchProblemsAtcoder.ts` (T3-AC), `tools/getProblemAtcoder.ts` (T4-AC)
- [ ] Implement `tools/upcomingContestsCodeforces.ts` (T7-CF), `tools/upcomingContestsAtcoder.ts` (T7-AC) with timezone conversion

**Gate:** Mixed CF+AtCoder queries work, AtCoder labeled "estimated", zero dupes.

---

### M4 — Verification + Submissions (2-3 blocks) ⚠️ THE MILESTONE THAT MATTERS
- [ ] Migrations for `user_solved`, `user_sync`
- [ ] `cache/sync.ts` — incremental submission sync (watermark, overlap, caps)
- [ ] Background job runner — cold handle doesn't block tool calls
- [ ] `domain/verify.ts` — exact verification semantics
- [ ] Implement `tools/verifySolvedCodeforces.ts` (T6-CF) & `tools/verifySolvedAtcoder.ts` (T6-AC)
- [ ] Implement `tools/getSubmissionsCodeforces.ts` (T5-CF) & `tools/getSubmissionsAtcoder.ts` (T5-AC)
- [ ] **50-problem manual audit — must be 100% accurate**

**Gate:** Verification tools match site UI on all 50 audit problems.

**Risk buffer:** Assume this takes 2x the planned time. This is the product.

---

### M5 — Remote Transport + Deploy (1-2 blocks)
- [ ] `src/http.ts` — Hono + StreamableHTTPServerTransport (stateless mode)
- [ ] `/health` endpoint — snapshot ages, cache hit rate
- [ ] Per-IP rate limit (60 calls/5min), global upstream budget guard
- [ ] Origin validation, HTTPS enforcement
- [ ] Cache backend for target platform (D1/KV or volume)
- [ ] Dockerfile + deploy
- [ ] Smoke test with Inspector against public URL

**Gate:** Notion agent calls `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` against deployed URL.

---

### M6 — Analytics, Prompts, Publish (2-3 blocks)
- [ ] Implement `tools/analyzeWeaknessesCodeforces.ts` (T9-CF) & `tools/analyzeWeaknessesAtcoder.ts` (T9-AC)
- [ ] Implement `tools/contestPerformanceCodeforces.ts` (T8-CF) & `tools/contestPerformanceAtcoder.ts` (T8-AC)
- [ ] MCP prompts: `daily_ladder_codeforces`, `daily_ladder_atcoder`, `audit_yesterday_codeforces`, `audit_yesterday_atcoder`
- [ ] MCP resources: `cp://problems/snapshot_codeforces`, `cp://problems/snapshot_atcoder`, `cp://user/codeforces/{handle}/solved`, `cp://user/atcoder/{handle}/solved`
- [ ] README with copy-paste configs for all clients
- [ ] `server.json` manifest, npm publish, MCP registry submission
- [ ] CI: typecheck, test, build on push

**Gate:** A stranger installs and gets a working ladder in under 2 minutes.

---

### M7 — Hardening (Ongoing)
- [ ] 24h soak test — zero rate-limit failures
- [ ] Circuit breaker verified via fixture-based CF downtime simulation
- [ ] Token-size regression test
- [ ] Snapshot refresh cron
- [ ] Optional: statement fetching behind flag; third judge adapter

---

## How We Work

1. **One task at a time** from the current milestone. No skipping ahead.
2. **Test first** when touching domain logic.
3. Implement → run `vitest` → verify in MCP Inspector → commit `M<n>: <task>`.
4. Log the artifact (file path + commit hash) in this file under the milestone.
5. Gate unmet = milestone not done. Move on only after the gate passes.

## Completed Work Log

_(Entries added as tasks are completed)_

| Date | Milestone | Task | Commit | Files |
|------|-----------|------|--------|-------|
| — | — | Planning docs complete | — | 00-10 .md files |
