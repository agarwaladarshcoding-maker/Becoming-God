# 04 - Tool Contracts

> Eighteen tools. Every one is site-specific, read-only, capped, deterministic, and task-shaped.
> Naming: `cp_*_codeforces` and `cp_*_atcoder`.
> All tools set `annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true }`.

## Shared conventions

- Problem ids accepted: e.g. `1900C`, `cf:1900C`, `abc300_c`, `ac:abc300_c`, or a full problem URL. Normalize all of them; error clearly on ambiguity.
- Handles: `^[A-Za-z0-9_.-]{1,32}$`. Codeforces is case-insensitive; echo the canonical form.
- Dates: ISO-8601 (`2026-08-16`, `2026-08-16T00:00:00Z`). Relative accepted: `7d`, `30d`.
- `limit`: every list tool has one. Default 10, max 25, silently clamped (clamp noted in footer).
- Every result ends with a freshness footer, e.g.
  `source: cache (CF snapshot 3h old) | 2 upstream calls | partial: no`
- Result shape: `content[0].text` is a compact markdown table or summary;
  `structuredContent` carries typed JSON for programmatic clients.

---

## T1-Codeforces: cp_get_user_codeforces

Purpose: profile snapshot for a Codeforces handle.

```jsonc
{
  "name": "cp_get_user_codeforces",
  "title": "Get Codeforces user profile",
  "description": "Get a Codeforces user profile: current rating, max rating, rank title, solved count and last activity. Use for 'what is my rating on Codeforces' questions. For solved/unsolved questions about specific Codeforces problems, use cp_verify_solved_codeforces instead.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string", "pattern": "^[A-Za-z0-9_.-]{1,32}$" }
    },
    "required": ["handle"]
  }
}
```

Upstream: CF `user.info` (plus `user.rating` tail for context).
Output: 6-8 lines - handle, rating, maxRating, rank, solvedCount, lastActiveAt, profileUrl.
Error text example: `handle not found on Codeforces - handles are case-insensitive but must match exactly; check spelling.`

## T1-AtCoder: cp_get_user_atcoder

Purpose: profile snapshot for an AtCoder handle.

```jsonc
{
  "name": "cp_get_user_atcoder",
  "title": "Get AtCoder user profile",
  "description": "Get an AtCoder user profile: current rating (best effort), rank, solved count and last activity. Use for 'what is my rating on AtCoder' questions. For solved/unsolved questions about specific AtCoder problems, use cp_verify_solved_atcoder instead.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string", "pattern": "^[A-Za-z0-9_.-]{1,32}$" }
    },
    "required": ["handle"]
  }
}
```

Upstream: AtCoder problems unofficial endpoints (`user/ac_rank`, etc.).
Output: 6-8 lines - handle, rank, solvedCount, and best-effort rating information.

---

## T2-Codeforces: cp_rating_history_codeforces

```jsonc
{
  "name": "cp_rating_history_codeforces",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "limit":  { "type": "integer", "minimum": 1, "maximum": 50, "default": 15,
                  "description": "Most recent N contests." },
      "summary_only": { "type": "boolean", "default": false,
                  "description": "Return only aggregate stats (peak, trend, best/worst delta)." }
    },
    "required": ["handle"]
  }
}
```

Output: table `date | contest | rank | old -> new | delta` plus a one-line trend summary.

## T2-AtCoder: cp_rating_history_atcoder

```jsonc
{
  "name": "cp_rating_history_atcoder",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "limit":  { "type": "integer", "minimum": 1, "maximum": 50, "default": 15,
                  "description": "Most recent N contests." },
      "summary_only": { "type": "boolean", "default": false,
                  "description": "Return only aggregate stats (peak, trend, best/worst delta)." }
    },
    "required": ["handle"]
  }
}
```

Output: table `date | contest | rank | old -> new | delta` plus rating trend summary (best-effort).

---

## T3-Codeforces: cp_search_problems_codeforces

```jsonc
{
  "name": "cp_search_problems_codeforces",
  "description": "Find practice problems on Codeforces within a difficulty band, optionally filtered by topic tags and optionally excluding problems a given handle already solved. This is the tool for building Codeforces practice ladders. Difficulty uses the official Codeforces rating scale (800-3500). Returns at most `limit` problems, ranked by proximity to the band centre and by solver count.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "min_difficulty": { "type": "integer", "minimum": 0, "maximum": 4000 },
      "max_difficulty": { "type": "integer", "minimum": 0, "maximum": 4000 },
      "tags": { "type": "array", "items": { "type": "string" },
                "description": "Codeforces tag names, e.g. ['graphs','dfs and similar']." },
      "tag_mode": { "enum": ["any","all"], "default": "any" },
      "exclude_solved_by": { "type": "string",
                "description": "Handle whose solved problems are filtered out." },
      "min_solved_count": { "type": "integer", "default": 200,
                "description": "Skip obscure problems with few solvers." },
      "limit": { "type": "integer", "minimum": 1, "maximum": 25, "default": 10 },
      "seed":  { "type": "integer", "description": "Deterministic shuffle seed for day-to-day variety." }
    },
    "required": ["min_difficulty", "max_difficulty"]
  }
}
```

Output table: `# | id | name | difficulty | tags | url`

## T3-AtCoder: cp_search_problems_atcoder

```jsonc
{
  "name": "cp_search_problems_atcoder",
  "description": "Find practice problems on AtCoder within a difficulty band, optionally excluding problems a given handle already solved. This is the tool for building AtCoder practice ladders. Difficulty is mapped onto the Codeforces rating scale (800-3500) and is explicitly labeled 'estimated'. Returns at most `limit` problems, ranked by proximity to the band centre and by solver count.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "min_difficulty": { "type": "integer", "minimum": 0, "maximum": 4000,
                          "description": "Difficulty on the Codeforces equivalent scale." },
      "max_difficulty": { "type": "integer", "minimum": 0, "maximum": 4000,
                          "description": "Difficulty on the Codeforces equivalent scale." },
      "exclude_solved_by": { "type": "string",
                "description": "Handle whose solved problems are filtered out." },
      "min_solved_count": { "type": "integer", "default": 200,
                "description": "Skip obscure problems with few solvers." },
      "limit": { "type": "integer", "minimum": 1, "maximum": 25, "default": 10 },
      "seed":  { "type": "integer", "description": "Deterministic shuffle seed for day-to-day variety." }
    },
    "required": ["min_difficulty", "max_difficulty"]
  }
}
```

Output table: `# | id | name | difficulty (estimated) | url`

---

## T4-Codeforces: cp_get_problem_codeforces

```jsonc
{
  "name": "cp_get_problem_codeforces",
  "description": "Get metadata for one Codeforces problem by id or URL: name, difficulty, tags, solver count and canonical link. Set include_statement true only when the user explicitly needs the problem text.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "problem": { "type": "string", "description": "Problem id ('1900C') or full URL." },
      "include_statement": { "type": "boolean", "default": false }
    },
    "required": ["problem"]
  }
}
```

## T4-AtCoder: cp_get_problem_atcoder

```jsonc
{
  "name": "cp_get_problem_atcoder",
  "description": "Get metadata for one AtCoder problem by id or URL: name, difficulty (estimated), solver count and canonical link. Set include_statement true only when the user explicitly needs the problem text.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "problem": { "type": "string", "description": "Problem id ('abc300_c') or full URL." },
      "include_statement": { "type": "boolean", "default": false }
    },
    "required": ["problem"]
  }
}
```

---

## T5-Codeforces: cp_get_submissions_codeforces

```jsonc
{
  "name": "cp_get_submissions_codeforces",
  "description": "List a handle's recent Codeforces submissions, newest first, with verdicts. Use for 'what did I attempt on Codeforces', debugging patterns or language stats. For a yes/no answer about specific problems use cp_verify_solved_codeforces, which is cheaper and exact.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "since":  { "type": "string", "description": "ISO date or relative like '7d'." },
      "verdict":{ "enum": ["any","accepted","failed"], "default": "any" },
      "problem":{ "type": "string", "description": "Optional: restrict to one problem id." },
      "limit":  { "type": "integer", "minimum": 1, "maximum": 50, "default": 20 }
    },
    "required": ["handle"]
  }
}
```

Output table: `at | problem | verdict | lang | timeMs`.

## T5-AtCoder: cp_get_submissions_atcoder

```jsonc
{
  "name": "cp_get_submissions_atcoder",
  "description": "List a handle's recent AtCoder submissions, newest first, with verdicts. Use for 'what did I attempt on AtCoder', debugging patterns or language stats. For a yes/no answer about specific problems use cp_verify_solved_atcoder, which is cheaper and exact.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "since":  { "type": "string", "description": "ISO date or relative like '7d'." },
      "verdict":{ "enum": ["any","accepted","failed"], "default": "any" },
      "problem":{ "type": "string", "description": "Optional: restrict to one problem id." },
      "limit":  { "type": "integer", "minimum": 1, "maximum": 50, "default": 20 }
    },
    "required": ["handle"]
  }
}
```

Output table: `at | problem | verdict | lang | timeMs`.

---

## T6-Codeforces: cp_verify_solved_codeforces (the killer tool)

Purpose: prove, from real Codeforces submissions, whether specific problems were solved and when.

```jsonc
{
  "name": "cp_verify_solved_codeforces",
  "description": "Verify from actual Codeforces submission history whether a handle solved specific problems, and when. Returns solved | attempted | untouched per problem with first-AC timestamp, attempt count and verdicts seen. Use this before marking practice work as done. Authoritative: never infer solved status from other tools.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle":   { "type": "string" },
      "problems": { "type": "array", "items": { "type": "string" },
                    "minItems": 1, "maxItems": 25,
                    "description": "Problem ids or URLs." },
      "since":    { "type": "string",
                    "description": "Only count ACs at or after this time; earlier ACs are reported as solved with withinWindow false." },
      "require_full_tests": { "type": "boolean", "default": true,
                    "description": "Require testset TESTS so pretest-only passes do not count." }
    },
    "required": ["handle", "problems"]
  }
}
```

Output:
```
| problem | status    | first AC (UTC)   | attempts | verdicts   |
|---------|-----------|------------------|----------|------------|
| 1900C   | solved    | 2026-08-16 18:22 | 3        | WA, WA, OK |
| 1899D   | attempted | -                | 5        | WA, TLE    |
| 1901A   | untouched | -                | 0        | -          |

2/3 solved | window: since 2026-08-16 | source: live sync (12 upstream calls) | partial: no
```

## T6-AtCoder: cp_verify_solved_atcoder (the killer tool)

Purpose: prove, from real AtCoder submissions, whether specific problems were solved and when.

```jsonc
{
  "name": "cp_verify_solved_atcoder",
  "description": "Verify from actual AtCoder submission history whether a handle solved specific problems, and when. Returns solved | attempted | untouched per problem with first-AC timestamp, attempt count and verdicts seen. Use this before marking practice work as done. Authoritative: never infer solved status from other tools.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle":   { "type": "string" },
      "problems": { "type": "array", "items": { "type": "string" },
                    "minItems": 1, "maxItems": 25,
                    "description": "Problem ids or URLs." },
      "since":    { "type": "string",
                    "description": "Only count ACs at or after this time; earlier ACs are reported as solved with withinWindow false." }
    },
    "required": ["handle", "problems"]
  }
}
```

Output matches the table structure above (using AC instead of OK as solved status).

---

## T7-Codeforces: cp_upcoming_contests_codeforces

```jsonc
{
  "name": "cp_upcoming_contests_codeforces",
  "description": "List upcoming Codeforces rounds within a time window, with start times in a requested timezone and duration. Use for scheduling practice.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "within_days": { "type": "integer", "minimum": 1, "maximum": 30, "default": 7 },
      "timezone": { "type": "string", "default": "UTC",
                    "description": "IANA timezone, e.g. Asia/Kolkata." },
      "rated_only": { "type": "boolean", "default": false },
      "limit": { "type": "integer", "maximum": 25, "default": 10 }
    }
  }
}
```

## T7-AtCoder: cp_upcoming_contests_atcoder

```jsonc
{
  "name": "cp_upcoming_contests_atcoder",
  "description": "List upcoming AtCoder contests within a time window, with start times in a requested timezone and duration. Use for scheduling practice.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "within_days": { "type": "integer", "minimum": 1, "maximum": 30, "default": 7 },
      "timezone": { "type": "string", "default": "UTC",
                    "description": "IANA timezone, e.g. Asia/Kolkata." },
      "rated_only": { "type": "boolean", "default": false },
      "limit": { "type": "integer", "maximum": 25, "default": 10 }
    }
  }
}
```

---

## T8-Codeforces: cp_contest_performance_codeforces

```jsonc
{
  "name": "cp_contest_performance_codeforces",
  "description": "Analyze one Codeforces contest for a handle: per-problem solve time, attempts, penalties, final rank and rating delta. Use for post-contest review.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "contest_id": { "type": "string", "description": "e.g. '1900'." }
    },
    "required": ["handle", "contest_id"]
  }
}
```

## T8-AtCoder: cp_contest_performance_atcoder

```jsonc
{
  "name": "cp_contest_performance_atcoder",
  "description": "Analyze one AtCoder contest for a handle: per-problem solve time, attempts, penalties, final rank and rating delta (best effort). Use for post-contest review.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "contest_id": { "type": "string", "description": "e.g. 'abc300'." }
    },
    "required": ["handle", "contest_id"]
  }
}
```

---

## T9-Codeforces: cp_analyze_weaknesses_codeforces

```jsonc
{
  "name": "cp_analyze_weaknesses_codeforces",
  "description": "Aggregate a handle's recent Codeforces submissions into tag-level and difficulty-level performance: attempts, AC rate, average attempts-to-solve and weakest topics. Use when the user asks what to work on. Aggregation happens server-side; only a small summary table is returned.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "window_days": { "type": "integer", "minimum": 7, "maximum": 365, "default": 60 },
      "group_by": { "enum": ["tag","difficulty","both"], "default": "tag" },
      "min_samples": { "type": "integer", "default": 3,
                       "description": "Hide buckets with too little data." }
    },
    "required": ["handle"]
  }
}
```

## T9-AtCoder: cp_analyze_weaknesses_atcoder

```jsonc
{
  "name": "cp_analyze_weaknesses_atcoder",
  "description": "Aggregate a handle's recent AtCoder submissions into difficulty-level performance, since AtCoder lacks tags. Aggregation happens server-side; only a small summary table is returned.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "handle": { "type": "string" },
      "window_days": { "type": "integer", "minimum": 7, "maximum": 365, "default": 60 },
      "min_samples": { "type": "integer", "default": 3,
                       "description": "Hide buckets with too little data." }
    },
    "required": ["handle"]
  }
}
```

---

## Cross-cutting rules

1. Clamp, never reject, on numeric bounds; mention the clamp in the footer.
2. Deterministic ordering always, with a final tiebreak on `id`, so repeated calls are stable.
3. Every tool can answer from stale cache and must say so rather than fail.
4. Field projection is mandatory. Never pass an upstream object through untouched.
5. `structuredContent` mirrors the table for programmatic consumers; text stays readable.
6. Tool descriptions are prompts: when to use, when NOT to use (name the better tool), units,
   and the estimate-vs-official caveat.

## Tools deliberately NOT built

| Tempting tool | Why not |
|---|---|
| `cf_raw_api_call` | Unbounded proxy; destroys rate-limit and safety guarantees |
| `cp_submit_solution` | Auth plus ToS risk, no training upside |
| `cp_get_editorial` | Blog scraping; fragile, low signal |
| `cp_full_standings` | Enormous payload no model can use |
| One tool per CF method | Context bloat, worse tool selection, more round trips |

## Future: prompts and resources (M6)

Prompts
- `daily_ladder_codeforces` (args: `handle`, `target_band`, `topic`): instructs the model to call `cp_search_problems_codeforces` then format a day plan.
- `daily_ladder_atcoder` (args: `handle`, `target_band`): instructs the model to call `cp_search_problems_atcoder` then format a day plan.
- `audit_yesterday_codeforces` (args: `handle`, `problems`): `cp_verify_solved_codeforces` plus a pass/fail verdict.
- `audit_yesterday_atcoder` (args: `handle`, `problems`): `cp_verify_solved_atcoder` plus a pass/fail verdict.

Resources
- `cp://problems/snapshot_codeforces` - Codeforces catalogue metadata.
- `cp://problems/snapshot_atcoder` - AtCoder catalogue metadata.
- `cp://user/codeforces/{handle}/solved` - Codeforces solved-set as an attachable resource.
- `cp://user/atcoder/{handle}/solved` - AtCoder solved-set as an attachable resource.
