# cp-mcp — Current Understanding

## What We're Building
- An open, read-only MCP server that gives any AI client (Claude, Notion, Cursor, Gemini) access to Codeforces + AtCoder data
- 18 task-shaped tools — 9 for Codeforces and 9 for AtCoder — to ensure simple integration and platform isolation
- The core value: **machine-verified solve status** so training logs can't be faked

## The 18 Tools (9 per platform)

Each of the following exists as `_codeforces` and `_atcoder` variants:
1. `cp_get_user_{platform}` — profile snapshot (rating, rank, solved count)
2. `cp_rating_history_{platform}` — recent contest performance + trend
3. `cp_search_problems_{platform}` — the ladder engine (difficulty band, tags, exclude solved)
4. `cp_get_problem_{platform}` — single problem metadata + optional statement
5. `cp_get_submissions_{platform}` — recent submission history with verdicts
6. `cp_verify_solved_{platform}` — **THE killer tools** — prove from real submissions whether problems were solved
7. `cp_upcoming_contests_{platform}` — schedule with timezone conversion
8. `cp_contest_performance_{platform}` — post-contest breakdown
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
- Verification must be 100% accurate — there's a mandatory 50-problem manual audit at M4

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
- Task-shaped tools split by platform (18 tools) — better tool selection, simpler parameters, fewer round trips
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
- **Zero code exists yet**
- **Waiting for the command to begin M0**
