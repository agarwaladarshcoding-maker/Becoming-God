# 07 - Testing and QA

## 1. The five test layers

| Layer | Tool | What it proves | When it runs |
|---|---|---|---|
| Unit (domain) | vitest | verify / search / difficulty logic is correct | every save |
| Contract (tools) | vitest | schemas, clamping, caps, footers, error paths | every save |
| Integration (upstream) | vitest with recorded fixtures | parsing, throttling, ETag, failure detection | pre-commit |
| Protocol | MCP Inspector | initialize, tools/list, tools/call on both transports | milestone gate |
| Eval (model-facing) | scripted prompts in a real client | the model picks the right tool and reads output correctly | milestone gate |

Never hit live upstreams from automated tests. Record fixtures once, trim them, commit them.

## 2. Fixture discipline

```
test/fixtures/
  cf/user.info.ok.json              cf/user.info.notfound.json
  cf/user.status.page1.json         cf/user.status.pretests.json
  cf/problemset.problems.trim.json  (200 problems, not 10k)
  cf/ratelimit.failed.json          cf/contest.list.json
  ac/problems.trim.json             ac/problem-models.trim.json
  ac/contest-problem.dupe.json      (the abc058 / arc071 pair)
  ac/user.submissions.page1.json
```

Rules: trim large payloads to the smallest set that still exercises the edge case; one fixture
per named scenario; never edit a fixture to make a test pass without renaming it.

## 3. Domain unit tests (the must-have list)

### verify.ts
- [ ] WA, WA, then OK gives solved, attempts 3, first AC equal to the third submission time
- [ ] OK on testset PRETESTS with requireFullTests true gives attempted
- [ ] OK on testset PRETESTS with requireFullTests false gives solved
- [ ] an AC that predates `since` gives solved with withinWindow false
- [ ] zero submissions gives untouched with attempts 0
- [ ] TESTING or WJ present is excluded from attempts and noted in output
- [ ] AtCoder result AC gives solved; WA only gives attempted
- [ ] duplicate submissions for one problem across two contest ids are counted once
- [ ] virtual and practice participation both count as solved (document the choice)

### search.ts
- [ ] the band filter is inclusive at both ends
- [ ] tag_mode all requires every tag; any requires one
- [ ] problems with no difficulty are excluded from a banded search
- [ ] min_solved_count filters obscure problems
- [ ] identical inputs produce an identical ordering (run twice, compare)
- [ ] different seeds change the ordering; the same seed does not
- [ ] limit is clamped to 25 and the clamp is reported in the footer

### difficulty.ts
- [ ] a negative estimate maps to the 800 floor
- [ ] an estimate of 1200 maps to a sane CF-scale value; the mapping is monotonic
- [ ] an experimental model sets confidence to low
- [ ] official CF ratings pass through untouched with source official

## 4. Contract tests (per tool)

For every tool, assert:
- [ ] the generated JSON Schema has the documented required fields, enums and bounds
- [ ] out-of-range numbers are clamped rather than rejected, and the clamp appears in the footer
- [ ] the result never exceeds the documented row cap
- [ ] the text result ends with a freshness footer
- [ ] structuredContent is present and consistent with the text
- [ ] an upstream failure yields isError true plus actionable text, never a thrown protocol error
- [ ] a stale cache still produces an answer when the upstream is unreachable

## 5. Throttle and resilience tests

- [ ] two sequential CF calls are spaced at least 2000ms apart (fake timers)
- [ ] 10 concurrent tool calls produce at most 1 CF request per 2s in aggregate
- [ ] a call-limit body triggers retry with backoff, then a graceful cached answer
- [ ] a 304 response is treated as cache-valid and consumes no parse work
- [ ] 5 consecutive upstream failures open the circuit breaker; it half-opens after 60s
- [ ] a request to a non-allowlisted host throws before any network call (SSRF guard)

## 6. Protocol testing with the Inspector

```bash
# stdio
npm run build
npx @modelcontextprotocol/inspector node dist/bin/stdio.js

# remote, after M5
npx @modelcontextprotocol/inspector --url https://cp-mcp.example.dev/mcp
```

Checklist inside the Inspector:
- [ ] initialize succeeds and shows your server instructions
- [ ] tools/list shows every tool with a title, description and full schema
- [ ] each tool call returns readable text plus structuredContent
- [ ] an intentionally bad argument returns a clear, actionable error
- [ ] nothing extraneous is printed to stdout (in stdio mode that kills the protocol)

## 7. Model-facing eval set

Keep `test/eval/questions.md` with the expected tool for each question. Run it manually in a
real client after any description change and assert the first tool call matches.

| # | Question | Expected first tool |
|---|---|---|
| 1 | what is my codeforces rating | cp_get_user_codeforces |
| 2 | am i improving on Codeforces over the last 10 contests | cp_rating_history_codeforces |
| 3 | give me 5 graph problems around 1400 on Codeforces i have not solved | cp_search_problems_codeforces |
| 4 | did i actually solve 1900C and 1899D yesterday | cp_verify_solved_codeforces |
| 5 | what did i attempt on AtCoder this week | cp_get_submissions_atcoder |
| 6 | when is the next atcoder contest in IST | cp_upcoming_contests_atcoder |
| 7 | how did i do in CF round 1900 | cp_contest_performance_codeforces |
| 8 | what Codeforces topic should i work on | cp_analyze_weaknesses_codeforces |
| 9 | what is problem abc300_c | cp_get_problem_atcoder |
| 10 | how many problems have i solved on atcoder | cp_get_user_atcoder |
| 11 | is 1901A solved on Codeforces | cp_verify_solved_codeforces |
| 12 | build me a week of string problems 1200-1400 on Codeforces | cp_search_problems_codeforces |

Failure mode to watch: the model answering "solved" from submissions history output instead of
calling the custom platform verification tools. If that happens, strengthen the descriptions and the instructions.

## 8. The 50-problem manual audit (M4 gate)

1. Pick 50 problems across both sites: 20 solved long ago, 15 solved recently, 10 attempted but
   unsolved, 5 never opened.
2. Record the ground truth from the site UI into a CSV.
3. Run verification tools in batches of 25.
4. Diff the results. Any disagreement blocks M4: investigate, add a fixture, fix, re-run.

## 9. Token-budget regression test

- Serialize each tool's default-argument output and assert a character budget (roughly 4 chars
  per token): search 3200, verify 2400, submissions 3200, user 600.
- Run it in CI. A formatting change that doubles output size is a bug, not a style choice.

## 10. Soak test (M7)

- Script 200 random tool calls spread over 24h against the deployed server.
- Assert zero rate-limit failures, zero unhandled exceptions, a cache hit rate above 80%, and
  p95 latency within the NFR table in doc 03.

## 11. Manual client matrix (M5 and M6 gates)

| Client | Transport | Checks |
|---|---|---|
| Claude Desktop | stdio | discovery, call, error display |
| Claude web | Streamable HTTP | connect, call, follow-up turn still works |
| Notion agent | Streamable HTTP | verification usable inside a workflow |
| Cursor | stdio | discovery and call |
| Gemini CLI | stdio | discovery and call |

## 12. Pre-release checklist

- [ ] npx cp-mcp works on a clean machine with no configuration
- [ ] README configs copy-paste correctly for all five clients
- [ ] LICENSE, CONTRIBUTING, SECURITY and a documented rate-limit policy exist
- [ ] no secrets, no PII in the cache; the cache path is documented and configurable
- [ ] the User-Agent identifies the project with a contact URL
- [ ] Codeforces API and AtCoder Problems are credited in the README
