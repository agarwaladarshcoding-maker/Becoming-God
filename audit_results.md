# M4 Verification Audit — Codeforces

**Status: PASSED for Codeforces (53/53, 100%). Not run for AtCoder — see the section at the bottom for why.**

Date run: 2026-08-23
Tool under test: `cp_verify_solved_codeforces`, built from commit `adece41` (`npm run build`, invoked over
stdio against `dist/bin/stdio.js`, not through a long-running client, so the audited binary is the one in
the tree).

## Method

The milestone gate is *"50 problems checked against the site UI. Must be 100%."* The point is
independence: the tool reads `api/user.status`, so the ground truth must come from somewhere that is not
that endpoint.

Ground truth here is the **Codeforces web UI** — `https://codeforces.com/submissions/AdarshAg/contest/<id>`,
fetched anonymously and parsed from the rendered `status-frame-datatable`. Same database, different code
path, and literally "the site UI" the milestone names.

Two details that matter for reading the numbers below:

- Anonymous page views render timestamps in **UTC+3**, while the tool reports UTC. Every site time was
  shifted by −3h before comparison.
- A problem counts as `untouched` when the handle's contest page contains **zero** rows for that index.
  The page covers practice and virtual submissions as well as contest ones, so absence there is real.

Rows were chosen to exercise the cases that can actually go wrong, not just the easy ones:

| Case | Rows |
| --- | --- |
| Solved on the first submission | 22 |
| Solved after 2–6 attempts (first-AC selection must pick the earliest) | 15 |
| Attempted, never solved | 7 |
| Untouched | 12 |
| Live-contest submissions judged on **pretests**, not full tests | 3 (2232A, 2232B, 2257C) |
| Verdict variety | OK, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, COMPILATION_ERROR, RUNTIME_ERROR |

All 53 rows are for handle **AdarshAg** — the account the server actually serves. Auditing borrowed
handles (tourist, Benq, jiangly) was considered and dropped: their histories exceed the 10,000-submission
safety cap in `src/cache/sync.ts`, so a cold sync truncates them and the audit would measure the cap
rather than the verifier.

## Results — 53/53 agree

Format: `problem -> status, attempts, first AC (UTC)`. Tool and site UI returned identical values on
every row; a single column is shown because there was nothing to disagree about.

### Contest 2254
- [x] 1. `2254A` -> solved, 1, 2026-08-04 14:39
- [x] 2. `2254B` -> solved, 2, 2026-08-04 16:44
- [x] 3. `2254C1` -> solved, 1, 2026-08-22 19:17
- [x] 4. `2254D` -> solved, 2, 2026-08-04 15:31
- [x] 5. `2254E` -> attempted, 2, none
- [x] 6. `2254F` -> untouched, 0, none

### Contest 2218
- [x] 7. `2218A` -> solved, 2, 2026-04-04 14:46
- [x] 8. `2218B` -> solved, 1, 2026-04-04 14:47
- [x] 9. `2218C` -> solved, 2, 2026-04-04 15:05
- [x] 10. `2218D` -> solved, 1, 2026-04-15 17:14
- [x] 11. `2218E` -> solved, 3, 2026-06-20 13:42
- [x] 12. `2218G` -> untouched, 0, none

### Contest 2193
- [x] 13. `2193A` -> solved, 1, 2026-05-17 17:23
- [x] 14. `2193B` -> solved, 4, 2026-03-24 14:06
- [x] 15. `2193C` -> solved, 2, 2026-07-02 14:10
- [x] 16. `2193D` -> solved, 1, 2026-07-02 14:52
- [x] 17. `2193H` -> untouched, 0, none

### Contest 2185
- [x] 18. `2185A` -> solved, 1, 2026-01-18 15:15
- [x] 19. `2185B` -> solved, 1, 2026-01-18 15:25
- [x] 20. `2185C` -> solved, 1, 2026-02-28 08:30
- [x] 21. `2185D` -> solved, 2, 2026-02-28 15:08
- [x] 22. `2185G` -> untouched, 0, none

### Contest 1899
- [x] 23. `1899A` -> solved, 1, 2026-02-21 20:04
- [x] 24. `1899B` -> solved, 6, 2026-05-01 21:38
- [x] 25. `1899C` -> solved, 1, 2026-05-03 10:25
- [x] 26. `1899E` -> solved, 2, 2026-03-06 11:25
- [x] 27. `1899D` -> untouched, 0, none

### Contest 1873
- [x] 28. `1873A` -> solved, 1, 2026-01-13 15:12
- [x] 29. `1873C` -> solved, 1, 2026-02-24 18:39
- [x] 30. `1873E` -> solved, 3, 2026-06-21 07:49
- [x] 31. `1873F` -> solved, 2, 2026-06-08 12:18
- [x] 32. `1873B` -> untouched, 0, none

### Contest 1791
- [x] 33. `1791C` -> solved, 1, 2026-03-08 07:39
- [x] 34. `1791D` -> solved, 1, 2026-02-19 20:10
- [x] 35. `1791E` -> solved, 2, 2026-05-07 12:01
- [x] 36. `1791G1` -> solved, 1, 2026-05-21 08:47
- [x] 37. `1791A` -> untouched, 0, none

### Contest 1742
- [x] 38. `1742C` -> solved, 3, 2026-02-14 11:27
- [x] 39. `1742D` -> solved, 1, 2026-05-16 17:04
- [x] 40. `1742E` -> solved, 2, 2026-06-30 06:13
- [x] 41. `1742G` -> attempted, 1, none
- [x] 42. `1742A` -> untouched, 0, none

### Contest 2232 — live contest, judged on pretests
- [x] 43. `2232A` -> attempted, 1, none (site: "Wrong answer on pretest 2")
- [x] 44. `2232B` -> attempted, 1, none (site: "Wrong answer on pretest 2")
- [x] 45. `2232C1` -> untouched, 0, none

### Contest 2257 — live contest, judged on pretests
- [x] 46. `2257A` -> solved, 1, 2026-08-17 14:44
- [x] 47. `2257B` -> solved, 1, 2026-08-17 14:54
- [x] 48. `2257C` -> attempted, 1, none (site: "Wrong answer on pretest 2")
- [x] 49. `2257D` -> untouched, 0, none

### Contests 1931, 2144 — attempted but never solved
- [x] 50. `1931D` -> attempted, 5, none
- [x] 51. `1931A` -> untouched, 0, none
- [x] 52. `2144C` -> attempted, 4, none
- [x] 53. `2144A` -> untouched, 0, none

## What this does and does not prove

**Proved.** On real data, `cp_verify_solved_codeforces` never disagreed with Codeforces itself — not on
status, not on attempt counts, not on which submission was the first AC. Attempt counts are exact, which
means no submission is double-counted or dropped, and first-AC selection is correct even where an AC is
followed by further submissions (1873E has two ACs; the earlier one is reported).

**Not proved by these rows.** The subtle Codeforces rule — verdict `OK` on `testset = PRETESTS` must *not*
count as solved — has no instance in this account's history. All three PRETESTS submissions here are
`WRONG_ANSWER`. That rule is instead covered by unit test in `test/verify.test.ts`
("CF OK on PRETESTS is not solved"), which asserts it directly against the pure function.

## AtCoder — not audited, and here is why

`cp_verify_solved_atcoder` shares the same domain function (`verifySubmissionChain`), so the *logic* above
is audited for both platforms. What is **not** audited is the AtCoder **data source**: the tool reads the
volunteer-run kenkoooo mirror, and nothing here checks the mirror against AtCoder itself.

An equivalent audit was attempted and is blocked. Every AtCoder page that shows per-user submissions
requires a signed-in account:

- `atcoder.jp/contests/<c>/submissions?f.User=<u>` -> redirects to "Please sign in first."
- `atcoder.jp/contests/<c>/submissions` (unfiltered) -> same
- `atcoder.jp/contests/<c>/standings` -> same
- `atcoder.jp/users/<u>` -> public, but carries rating only, no solved-problem data

Task pages (`atcoder.jp/contests/<c>/tasks/<t>`) are public, which confirms the block is specific to
submission data and not a general bot wall.

To close this gap someone with an AtCoder login has to spot-check a handful of problems against
`atcoder.jp` by hand. Until that happens, the honest statement is: **the AtCoder verifier's logic is
audited; its upstream is trusted, not verified.**
