# 10 - Notion Integration (closing the loop on the training log)

The point of `cp-mcp` is not that an AI can read Codeforces. It is that your daily training
contract stops being self-reported. This doc describes the loop.

## 1. The gate

Today: "solved 4 problems" is a checkbox someone ticks.
After M4: a day is Done only if the platform-specific verification tool (`cp_verify_solved_codeforces` or `cp_verify_solved_atcoder`) returns `solved` with
`withinWindow: true` for every assigned problem.

```
Day page (assigned problems)
        |
        v
Notion agent turn  ---->  cp_verify_solved_codeforces or cp_verify_solved_atcoder (by site)
        |                                   |
        |  <-------- solved / attempted / untouched + first AC time
        v
If all solved  -> mark Done, write first-AC times into the log row
If any failed  -> keep Open, append the failure to the Mistake Log with the verdicts seen
```

Hard rule: the agent may never mark a day Done from prose in the page. Only from the tool.

## 2. Recommended Notion data shape

**Problem Bank** (one row per assigned problem)

| Property | Type | Filled by |
|---|---|---|
| Name | title | you or the agent |
| Site | select (Codeforces / AtCoder) | agent |
| Problem ID | text (`1900C`, `abc300_c`) | agent - the join key |
| URL | url | `cp_get_problem_codeforces` / `cp_get_problem_atcoder` |
| Difficulty | number | `cp_search_problems_codeforces` / `cp_search_problems_atcoder` |
| Difficulty Source | select (official / estimated) | tool output, never guessed |
| Tags | multi-select | `cp_search_problems_codeforces` / `cp_search_problems_atcoder` |
| Assigned On | date | daily planner |
| Status | select (Assigned / Attempted / Solved) | **only** verification tool |
| First AC (UTC) | date | verification tool |
| Attempts | number | verification tool |
| Verdicts Seen | text | verification tool |
| Verified At | date | agent, each audit run |

**Daily Tracker** gets: `Assigned Count`, `Verified Solved Count`, `Gate Passed` (checkbox),
`Audit Note` (text). `Gate Passed` is written by the audit run only.

**Daily Tracker** properties are updated via the corresponding verification tool.

**Mistake Log** gets a row per failed problem with the verdict list, so failures never vanish.

## 3. Daily loop (three agent turns)

### Morning: assign
1. `cp_get_user_codeforces` or `cp_get_user_atcoder` for the current rating.
2. `cp_search_problems_codeforces` or `cp_search_problems_atcoder` with the band derived from rating, `exclude_solved_by` your handle,
   `seed` = today's date, `limit` = day quota plus 2.
3. Create Problem Bank rows with `Status = Assigned`.
4. Write the day plan onto the day page with URLs and time boxes.

### Evening: audit
1. Read today's Problem Bank rows where `Assigned On = today`.
2. Call `cp_verify_solved_codeforces` or `cp_verify_solved_atcoder` (as appropriate for each problem site) with your handle, problem IDs, and since = today 00:00 IST -> UTC.
3. Update each row: `Status`, `First AC`, `Attempts`, `Verdicts Seen`, `Verified At`.
4. Set `Gate Passed` only when every row is `Solved` with `withinWindow: true`.
5. For each failure, append a Mistake Log row: problem, verdicts, and one next action.

### Weekly: adjust
1. `cp_analyze_weaknesses_codeforces(window_days = 14)` & `cp_analyze_weaknesses_atcoder(window_days = 14)`.
2. `cp_rating_history_codeforces(summary_only = true)` & `cp_rating_history_atcoder(summary_only = true)`.
3. Write a weekly review: weakest two tags, the band that should shift, and the next week's
   topic focus. Feed those into next week's search tools.

## 4. Timezone discipline

You work in IST; both APIs report UTC epochs.
- Day boundary: `IST 00:00` = `UTC 18:30` the previous day. Always convert explicitly.
- Pass `since` as a UTC ISO timestamp, not a bare date, or a late-night solve lands on the
  wrong day.
- Store `First AC` in UTC in the database and render in IST on the page. Never store local
  time in a shared field.

## 5. Prompt for the Notion audit agent

```
You audit the ICPC daily contract. You have cp-mcp connected.

Steps:
1. Read today's assigned problems from the Problem Bank (Assigned On = today).
2. Call cp_verify_solved_codeforces or cp_verify_solved_atcoder (site-dependent) with handle, the problem ids, and since set to today's
   00:00 IST converted to UTC, with require_full_tests true.
3. Write the tool's statuses into the rows verbatim. Do not reinterpret or round up.
4. Set Gate Passed only if every problem is solved with withinWindow true.
5. For every failure, create a Mistake Log row with the problem, the verdicts seen, the
   attempt count, and exactly one next action.
6. If the tool result footer says the data is partial or stale, do not set Gate Passed;
   note the staleness and say when to re-run.
7. Report a 3-line summary: assigned vs solved, the gate result, and the single most
   important failure.

Never infer solved status from page text, from cp_get_submissions_codeforces/atcoder, or from my claims.
```

## 6. Automation options

| Approach | How | Good for |
|---|---|---|
| Manual chat turn | ask the agent to audit | starting out, full control |
| Scheduled Notion agent trigger | daily at 23:30 IST, runs the audit prompt | hands-off gating |
| Server-side cron plus Notion API | cp-mcp writes rows directly | later, once verification is trusted |

Start manual. Move to a scheduled trigger only after the 50-problem audit passes, otherwise
you automate wrong answers.

## 7. Why this matters more than the tooling

1. **No unverified Done.** The gate is machine-checked, so the log is evidence.
2. **Failures persist.** Every non-AC becomes a Mistake Log row with the actual verdicts.
3. **Assignment stops repeating.** `exclude_solved_by` guarantees no problem is assigned twice.
4. **Band drift is data-driven.** Weakness analysis, not vibes, moves the difficulty band.
5. **One source of truth.** The judge is the authority; Notion mirrors it.

## 8. Failure modes to plan for

| Situation | Correct behavior |
|---|---|
| Sync still warming | report partial, do not pass the gate, re-run in a few minutes |
| AC found but outside the window | show it, do not pass the gate, note it was solved earlier |
| Handle typo | fail loudly with the actionable error, never silently pass |
| Upstream down | serve cached verification with an explicit staleness note, gate stays open |
| Problem id missing from the catalogue | fail that row only, still report the rest |
