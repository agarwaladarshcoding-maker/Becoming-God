# 02 — Upstream APIs: Codeforces & AtCoder

> Everything the `upstream/` layer must know. Treat the constraints in §1.2 and §2.2 as
> hard requirements, not suggestions.

---

## 1. Codeforces (official API)

### 1.1 Basics
- Base: `https://codeforces.com/api/{methodName}` (mirror: `https://mirror.codeforces.com/api/...`).
- Every response is `{ "status": "OK" | "FAILED", "comment"?: string, "result"?: any }`.
- `lang=en|ru` optional parameter for localized text fields.
- Public data needs **no** authentication.

### 1.2 HARD CONSTRAINTS — read twice
1. **Rate limit: at most 1 request per 2 seconds.**
2. Exceeding it returns **HTTP 200** with `{"status":"FAILED","comment":"Call limit exceeded"}`.
   ⇒ Your HTTP client must branch on `body.status`, **never** on the HTTP status alone.
3. Codeforces also drops connections under load; treat `ECONNRESET`/`ETIMEDOUT` as retryable.
4. During live contests the API can be slow or partially unavailable. Always be able to
   serve stale cache.

### 1.3 Methods you will use

| Method | Params | Returns | Notes / cost |
|---|---|---|---|
| `user.info` | `handles` (semicolon-separated, up to ~10k chars) | array of User | **Batch handles in one call.** Cheap. |
| `user.rating` | `handle` | array of RatingChange | One per contest. Small. |
| `user.status` | `handle`, `from`, `count` | array of Submission | **The verification source.** Can be huge — always pass `count`. Newest first. |
| `problemset.problems` | `tags?`, `problemsetName?` | `{problems[], problemStatistics[]}` | **~10k problems, multi-MB. Fetch once, cache hard.** |
| `contest.list` | `gym?` | array of Contest | Contains `BEFORE` phase = upcoming. Cache 10 min. |
| `contest.standings` | `contestId`, `handles?`, `from?`, `count?`, `showUnofficial?` | `{contest, problems[], rows[]}` | Use `handles` to keep it tiny. |
| `contest.ratingChanges` | `contestId` | array of RatingChange | For post-contest analysis. |
| `user.friends` | requires auth | — | Skip in v1. |

### 1.4 Key object shapes (fields you actually need)

```jsonc
// User
{ "handle":"adarsh", "rating":1021, "maxRating":1120, "rank":"newbie",
  "maxRank":"pupil", "contribution":0, "lastOnlineTimeSeconds":1755300000,
  "registrationTimeSeconds":1690000000, "friendOfCount":3, "country":"India" }

// RatingChange
{ "contestId":1900, "contestName":"Codeforces Round 912", "handle":"adarsh",
  "rank":3120, "ratingUpdateTimeSeconds":1700000000,
  "oldRating":1000, "newRating":1021 }

// Submission  (verdict is the whole game)
{ "id":123456789, "contestId":1900, "creationTimeSeconds":1700000000,
  "relativeTimeSeconds":1234,
  "problem": { "contestId":1900, "index":"C", "name":"Anji's Binary Tree",
               "type":"PROGRAMMING", "rating":1300, "tags":["dfs and similar","trees"] },
  "author": { "contestId":1900, "members":[{"handle":"adarsh"}],
              "participantType":"PRACTICE" },  // CONTESTANT | PRACTICE | VIRTUAL | OUT_OF_COMPETITION
  "programmingLanguage":"GNU C++17", "verdict":"OK", "testset":"TESTS",
  "passedTestCount":42, "timeConsumedMillis":150, "memoryConsumedBytes":1024000 }

// Problem
{ "contestId":1900, "problemsetName":null, "index":"C", "name":"...",
  "type":"PROGRAMMING", "points":1500, "rating":1300, "tags":["dp","graphs"] }

// ProblemStatistics
{ "contestId":1900, "index":"C", "solvedCount":12345 }
```

### 1.5 Verdicts (enumerate them; don't guess)
`OK` (= accepted), `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`,
`RUNTIME_ERROR`, `COMPILATION_ERROR`, `IDLENESS_LIMIT_EXCEEDED`, `SECURITY_VIOLATED`,
`CRASHED`, `INPUT_PREPARATION_CRASHED`, `CHALLENGED`, `SKIPPED`, `TESTING`, `REJECTED`,
`PARTIAL`, `FAILED`, `PRESENTATION_ERROR`.

**Verification rule:** solved ⇔ exists a submission with `verdict === "OK"` **and**
`testset === "TESTS"`. Ignore `TESTING`/`SKIPPED`. Count `PARTIAL` as attempted.

### 1.6 Problem identity
- Canonical id: `` `${contestId}${index}` `` → `1900C`.
- URL forms: `https://codeforces.com/contest/1900/problem/C` and
  `https://codeforces.com/problemset/problem/1900/C`. Emit the `problemset` form (stable).
- Gym/ACMSGURU problems have `problemsetName` set and no `contestId` in the usual sense —
  **exclude them in v1** to avoid id collisions.
- `rating` may be **absent** for very new or unrated problems. Handle `undefined`.

### 1.7 Authenticated calls (only if you ever need private data)
- Add `apiKey`, `time`, and `apiSig = rand + SHA512(rand + "/" + methodName + "?" + sortedParams + "#" + secret)`
  where `rand` is 6 random digits. Keep this **out of v1**; it forces per-user secrets and
  breaks the "open server" property.

### 1.8 Tag vocabulary (for enums in tool schemas)
`implementation, math, greedy, dp, data structures, brute force, constructive algorithms,
graphs, sortings, binary search, dfs and similar, trees, strings, number theory,
combinatorics, geometry, bitmasks, two pointers, dsu, shortest paths, probabilities,
divide and conquer, hashing, games, flows, interactive, matrices, string suffix structures,
fft, graph matchings, ternary search, expression parsing, meet-in-the-middle, 2-sat,
chinese remainder theorem, schedules`

---

## 2. AtCoder (unofficial: AtCoder Problems)

### 2.1 Reality check
- **AtCoder has no official public API.** The de-facto standard is **AtCoder Problems** by
  kenkoooo — explicitly a third-party, volunteer-run project (MIT licensed frontend/backend).
- Consequence: it can change, deprecate endpoints, or go down. Version-guard everything and
  degrade gracefully.

### 2.2 HARD CONSTRAINTS
1. **Sleep >1 second between requests.**
2. **Use ETag / `If-None-Match` caching.** The static datasets are large and mostly static.
3. Endpoints get deprecated — watch the repo; keep the client behind an interface.
4. Tens of thousands of requests/day requires asking the maintainer first. You should be
   nowhere near that if your cache works.
5. Send a descriptive `User-Agent` identifying your project + contact URL.

### 2.3 Static datasets (`https://kenkoooo.com/atcoder/resources/...`)

| File | Contents | Size | Cache TTL |
|---|---|---|---|
| `contests.json` | all contests: `{id,start_epoch_second,duration_second,title,rate_change}` | ~1MB | 12h |
| `problems.json` | all problems: `{id,contest_id,problem_index,name,title}` | ~2MB | 12h |
| `merged-problems.json` | problems + `point`, `solver_count`, `fastest_*`, `shortest_*`, `first_*` | ~8MB | 24h |
| `contest-problem.json` | `{contest_id, problem_id, problem_index}` pairs (**a problem can appear in 2 contests**) | ~1MB | 24h |
| `problem-models.json` | **estimated difficulty**: `{difficulty, discrimination, irt_loglikelihood, irt_users, is_experimental}` | ~2MB | 24h |

`problem-models.json` is the gold mine — it is what makes AtCoder problems
difficulty-comparable to Codeforces ratings.

### 2.4 v3 API (`https://kenkoooo.com/atcoder/atcoder-api/v3/...`)

| Endpoint | Purpose |
|---|---|
| `user/submissions?user={u}&from_second={epoch}` | **Submissions since a timestamp** — the verification source. Paginate by advancing `from_second`. |
| `user/ac_rank?user={u}` | AC count rank |
| `user/streak_rank?user={u}` | Streak rank |
| `user/rated_point_sum_rank?user={u}` | Rated point sum rank |
| `from/{unix_second}` (v3 `submissions`) | All submissions since a time (heavy — avoid) |
| `language_list` | Language names |

Submission shape:
```jsonc
{ "id":12345, "epoch_second":1700000000, "problem_id":"abc300_c",
  "contest_id":"abc300", "user_id":"adarsh", "language":"C++ 20 (gcc 12.2)",
  "point":300.0, "length":1234, "result":"AC", "execution_time":45 }
```
Results: `AC, WA, TLE, MLE, RE, CE, QLE, OLE, IE, WJ, WR, Judging`.
**Solved ⇔ `result === "AC"`.**

### 2.5 Problem identity & the duplicate trap
- Problem id: `abc300_c`. Contest id: `abc300`.
- **The same problem can belong to two contests** (classic ABC/ARC shared rounds, e.g.
  `abc058` ↔ `arc071`). `contest-problem.json` reveals this. Deduplicate by `problem_id`,
  but keep the primary `contest_id` from `problems.json` for URL building.
- URL: `https://atcoder.jp/contests/{contest_id}/tasks/{problem_id}`.

### 2.6 Statements
- **Not available via any API.** Options:
  1. **v1 default: link only.** Return the URL, let the human/model open it.
  2. Optional `include_statement` flag that fetches the public task page, extracts the
     English section, caches for 30 days, and rate-limits to ≤1 req / 3s with a descriptive UA.
- Never bulk-crawl, never re-host, never fetch logged-in pages.
- Same policy applies to Codeforces statements (also not in the API).

### 2.7 Rating (user contest rating)
- AtCoder user rating is not in AtCoder Problems' core datasets. Options: skip in v1, or
  read the public `atcoder.jp/users/{u}/history/json` endpoint (undocumented; treat as
  best-effort, cache 6h, tolerate failure).

---

## 3. Difficulty normalization (cross-site)

You need one comparable scale so search tools can align difficulties across both sites.

- Codeforces `problem.rating` ∈ [800, 3500], step 100.
- AtCoder `problem-models.difficulty` is an IRT estimate, roughly comparable but
  **compressed at the low end and can be negative**.

Recommended v1 mapping (document it, expose it, allow override):

```
cf_equiv(atcoder_difficulty d):
  if d < 400:  return max(800, 800 + d * 0.5)      # clamp the negative/low tail
  else:        return 800 + (d - 400) * 1.0 + 400  # ~1:1 above 400, shifted
```
Simplify to: `cf_equiv = clamp(round((d < 400 ? 800 + d*0.5 : d + 400) / 100) * 100, 800, 3500)`

Also record and return:
- `difficulty_source`: `"official" | "estimated"`
- `is_experimental`: from `problem-models.json` (⇒ low confidence, flag it in output)

**Never silently present an estimate as an official rating.** The model will quote it as fact.

---

## 4. Upstream client checklist

- [ ] Per-host request queue: CF `1 req / 2.1s`, AtCoder `1 req / 1.2s`.
- [ ] Global concurrency 1 per host; parallel **across** hosts is fine.
- [ ] Retry: 3 attempts, exponential backoff (2s, 6s, 15s) + jitter, only on network errors
      / 5xx / `Call limit exceeded`.
- [ ] Timeout: 10s CF, 20s for large AtCoder datasets.
- [ ] ETag storage + `If-None-Match`; treat `304` as cache-valid.
- [ ] `stale-while-revalidate`: serve cache instantly, refresh in background.
- [ ] Descriptive `User-Agent`: `cp-mcp/0.1 (+https://github.com/<you>/cp-mcp)`.
- [ ] Body-level failure detection for CF (`status !== "OK"`).
- [ ] Structured logging to **stderr** only (stdout is the protocol on stdio).
- [ ] Circuit breaker: after 5 consecutive failures, serve cache-only for 60s.
