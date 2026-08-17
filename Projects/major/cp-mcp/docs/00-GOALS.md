# 00 — Goals

## 1. One-line mission

Build an open, read-only MCP server that gives any AI client a **trustworthy, unified,
difficulty-normalized view of Codeforces and AtCoder** — with first-class *verification*
of what a user actually solved.

## 2. Primary goals (v1)

| # | Goal | Why it matters | Done when |
|---|---|---|---|
| G1 | Any MCP client can query CF + AtCoder details via site-specific tools | Removes N×M integrations | 4 clients connected and calling tools |
| G2 | **Verify solved status** from real submissions | Training logs become auditable, not self-reported | `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` return AC/attempted/untouched with first-AC timestamp |
| G3 | Cross-site problem ranking/difficulty alignment | Powers automated ladders | Problem lists are returned in a target band mapped to a unified difficulty scale |
| G4 | Never break upstream rate limits | Server must be a good citizen and stay usable | Sustained load test shows 0 `Call limit exceeded` and ≤1 req/2s to CF |
| G5 | Token-efficient outputs | Tool results are paid for in context | No tool result exceeds ~2k tokens at default limits |
| G6 | Works both locally (stdio) and remotely (Streamable HTTP) | Desktop clients + web clients both need it | Same tool registry, two entrypoints, both green in Inspector |
| G7 | Open source and installable in <2 minutes | "Open MCP server" is the point | `npx cp-mcp` works; README has copy-paste configs for 4 clients |

## 3. Secondary goals (v1.1+)

- G8: Weakness analytics (tag-level AC rate vs rating band).
- G9: Contest performance breakdown (solve times, penalties, rank percentile).
- G10: MCP `prompts` for repeatable workflows ("pick today's ladder", "audit yesterday").
- G11: MCP `resources` exposing cached snapshots (problemset, user solved-set).
- G12: Public registry listing + `server.json` manifest.

## 4. Explicit non-goals (v1)

| Non-goal | Reason |
|---|---|
| Submitting code to CF/AtCoder | Requires auth + automation that violates spirit/ToS; huge risk surface |
| Scraping logged-in pages | ToS + fragility |
| Bulk mirroring problem statements | Disrespectful to upstream; copyright grey zone |
| Running/judging code | Different product entirely |
| Real-time contest standings streaming | Rate-limit suicide; poll on demand only |
| Storing user credentials | Server stays credential-free ⇒ stays "open" |
| Supporting every judge (LeetCode, CSES, CodeChef) | Ship 2 well; add adapters later behind the same domain model |

## 5. Users and stories

**U1 — The trainee (primary, me).**
- "Give me 5 unsolved graph problems rated 1300–1500 across both sites."
- "Did I actually AC the 6 problems in yesterday's log? Prove it."
- "What's my AC rate on strings vs graphs in the last 60 days?"

**U2 — The workspace agent (Notion).**
- Before marking a daily contract Done, calls `cp_verify_solved_codeforces` / `cp_verify_solved_atcoder` and refuses on mismatch.
- Fills a Problem Bank row with difficulty + tags + URL without human typing via `cp_get_problem_codeforces` / `cp_get_problem_atcoder` (or search tools).

**U3 — The coach / third-party user.**
- Connects the public URL, checks a student's rating trajectory and recent activity.

**U4 — The contributor.**
- Adds a new judge adapter by implementing one interface, without touching the MCP layer.

## 6. Success metrics

- **Correctness:** verification agrees with the site UI on 100% of a 50-problem manual audit.
- **Latency:** p95 tool call < 1.5s on cache hit; < 4s on cold miss.
- **Politeness:** 0 upstream 429/FAILED-rate-limit events over a 24h soak.
- **Context cost:** median tool result < 800 tokens.
- **Adoption:** works unmodified in Claude Desktop, Claude web, Notion, and one more client.

## 7. Design principles (the tie-breakers)

1. **Task-shaped tools.** If the model needs 3 calls to answer one natural question, you
   designed one tool too few.
2. **Cache is the product.** The upstreams are slow and rate-limited; your cache is the
   only reason this feels fast.
3. **Deterministic, small, sorted output.** Same input ⇒ same output. Stable ordering.
4. **Errors teach.** Every error message tells the model what to do next.
5. **Read-only by default.** Every tool annotated `readOnlyHint: true`. No mutations in v1.
6. **Never trust tool arguments.** They come from a language model. Validate, clamp, enum.
7. **Transport-agnostic core.** The MCP layer must be a thin shell over pure functions.
