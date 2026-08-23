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
- [x] Implement `tools/upcomingContestsCodeforces.ts` (T7-CF), `tools/upcomingContestsAtcoder.ts` (T7-AC) with timezone conversion — both files existed but were never registered with the server until 2026-08-23. The AtCoder tool additionally had to be repointed: it was written against kenkoooo's `contests.json`, which is a purely historical archive (6,348 contests, zero in the future), so as originally written it would have answered "no upcoming contests" forever. It now scrapes `https://atcoder.jp/contests/` directly.

**Gate:** AtCoder search/fetch tools return estimated difficulties correctly, and no problem appears twice. — **Was false until 2026-08-23**: the catalogue read `difficulty` from `merged-problems.json`, which has no such field, so all 9,395 AtCoder problems had `difficulty = NULL` and `cp_search_problems_atcoder` returned "No AtCoder problems found" for every band ever queried. Fixed by reading `problem-models.json` instead — 4,785 problems now carry an estimated difficulty across 28 bands, 565 flagged low-confidence. ✓

---

## M4 - Verification and submissions

- [x] Migrations for `user_solved`, `user_sync`
- [x] `cache/sync.ts`: incremental submission sync for both sites with watermark, 60s overlap, idempotent upserts, first-backfill safety cap
- [x] Background job runner so a cold handle does not block a tool call; tools return `partial: true` with an explanatory note
- [x] `domain/verify.ts`: exact semantics (OK + testset TESTS / result AC, attempts, first AC, `withinWindow`)
- [x] Implement `tools/verifySolvedCodeforces.ts` (T6-CF) & `tools/verifySolvedAtcoder.ts` (T6-AC)
- [x] Implement `tools/getSubmissionsCodeforces.ts` (T5-CF) & `tools/getSubmissionsAtcoder.ts` (T5-AC)
- [x] **Manual audit: 53 problems checked against the Codeforces site UI, 53/53 agree (2026-08-23). AtCoder half blocked — see `audit_results.md`.**

**Gate:** `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` on yesterday's problem list return a correct table, and the 50-problem audit passes with zero disagreements. **The Codeforces half passed on 2026-08-23: 53 rows checked against `codeforces.com/submissions/AdarshAg/contest/<id>`, 53/53 agreement on status, attempt count and first-AC timestamp.** The AtCoder half could not be run — every AtCoder page exposing per-user submissions requires a signed-in account, so the AtCoder verifier's *logic* is audited (shared `verifySubmissionChain`, plus `test/verify.test.ts`) while its *upstream* (the kenkoooo mirror) is trusted rather than verified. Full method, row list and the block evidence are in `audit_results.md`.

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

None of this constituted the M4 manual audit; that was run separately on 2026-08-23 (see M4 above).

---

## 2026-08-23 - Second pass: verifier honesty and two unwired tools

A follow-up review the same day found and fixed one correctness defect and switched on two finished tools
that were sitting unused. Seven commits, `cp-mcp-fixes` branch.

- **`cp_verify_solved_*` could report a genuine old solve as `✗ untouched`.** The cold-start sync only had a
  4-second budget before answering, and at Codeforces' 1-request-per-2100ms throttle that bought exactly 2
  pages (400 submissions). For this project's own 773-submission / 426-problem history, that left 183 of
  426 problems outside the synced window — and the code treated "no submission on file yet" as "never
  submitted", so those 183 read as `✗ untouched` instead of the truth. Fixed in two parts:
  - `SyncStatus` gained a `complete: boolean` field (derived from the existing `user_sync` watermark, no
    schema change): does a full backfill of this handle's history exist?
  - `VerificationResult.status` gained `"unknown"`. `verifySubmissionChain` now takes a `historyComplete`
    parameter and returns `unknown` **only** when the submission list is empty *and* the history is
    incomplete. Positive findings (`solved`/`attempted`) are untouched either way — a submission in the
    cache is real regardless of what else hasn't synced yet; only the absence of one was ever unreliable.
  - Both verify tools render `? unknown` with "not in synced history yet" in the Verdicts cell, append
    `, N unknown` to the headline count, and add a note that the older history is still downloading and to
    ask again shortly. `structuredContent` carries `unknownCount` and `complete`.
  - `test/verify.test.ts` added — 12 tests for `verifySubmissionChain`, which previously had none.
- **Cold-start sync budget raised 4s → 20s**, so a normal account's history finishes on the first call
  instead of leaving most of it in the `unknown` state above. Measured on this project's cold cache after
  the change: 5 upstream calls, `partial: no`, `complete: true`, 0 unknown — and `1A` correctly reads solved
  2026-01-15, where under the old 4s budget the same row read `untouched`.
- **`cp_upcoming_contests_codeforces` registered.** It was fully written — schema, formatting, error
  paths — but never imported into `src/server.ts`, so no client could call it.
- **`cp_upcoming_contests_atcoder` repointed and registered.** As written it read kenkoooo's
  `contests.json`, a historical archive: 6,348 contests, zero in the future, latest start 2026-08-22.
  Registering it as-is would have answered "No upcoming AtCoder contests" for every window forever — the
  same failure shape as the verifier bug above, just on a different tool. It now scrapes the
  `contest-table-upcoming` table on `https://atcoder.jp/contests/` (host already allowlisted and throttled),
  cached under a new key `ac:contests:upcoming` at a 15-minute TTL, kept separate from
  `ac:catalogue:contests` which owns the historical archive used for AtCoder problem-URL derivation. A parse
  yielding zero rows returns `isError` rather than a cheerful empty result.
- **Tool count 15 → 17.** The two tools above are the additions.
- **MCP prompts can now default the handle.** The four prompts at `src/server.ts` took a required
  `handle`, so `daily_ladder_codeforces` still demanded one even though the tools already default it from
  `CP_MCP_CF_HANDLE`/`CP_MCP_AC_HANDLE`. `handle` is now optional and resolved through the same
  `resolveHandle` precedence the tools use.
- **All 13 `any` escapes removed from `src/`** (`grep -rn ": any\|as any\|any\[\]" src/` now returns 0).
  Typing the Codeforces submission payload surfaced a latent bug: CF omits `verdict`/`testset` while a
  submission is still judging, and `better-sqlite3` rejects `undefined` bind parameters; both now coalesce
  to `null`.

None of this constituted the M4 manual audit either — but it is what made a cold verify trustworthy enough
to run that audit against, which happened later the same day (see M4 above and `audit_results.md`).

---

## Summary

| Milestone | Status |
|-----------|--------|
| M0 Scaffold | ✓ Done |
| M1 First real tool | ✓ Done |
| M2 Cache + CF search | ✓ Done |
| M3 AtCoder + unified model | ✓ Done — AtCoder difficulty fixed 2026-08-23 (was NULL, now populated); upcoming-contests tools (T7) registered 2026-08-23 |
| M4 Verification + submissions | Tools done; `unknown` status added 2026-08-23 so absent history can't read as "not solved"; **manual audit run 2026-08-23 — Codeforces 53/53 against the site UI; AtCoder blocked by login wall** |
| M5 Remote transport | Local stdio entrypoint fixed 2026-08-23; **not deployed**, remote clients not connected |
| M6 Analytics + publish | Resources fixed 2026-08-23 and now working; **not published to npm/MCP registry** |
| M7 Hardening | ✓ Done |
