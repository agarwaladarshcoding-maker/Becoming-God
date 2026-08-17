# 09 - Risks, Decisions, Open Questions

## 1. Architecture Decision Records

### ADR-001 TypeScript with the official MCP SDK
**Decision:** TypeScript, `@modelcontextprotocol/sdk`.
**Why:** best client compatibility, `npx` distribution for stdio hosts, deploys to Workers,
Zod-to-JSON-Schema is one line.
**Alternatives:** Python FastMCP (nicer for analytics, harder to distribute to desktop hosts);
Go or Rust (fast, smaller ecosystem for MCP).
**Revisit if:** analytics grow to need pandas-level work; then add a Python sidecar, do not port.

### ADR-002 SQLite as the cache
**Decision:** `better-sqlite3` file cache behind an interface.
**Why:** one file, real indexes, trivially inspectable, zero infra, fast enough by orders of
magnitude for a 15k-row catalogue.
**Alternatives:** in-memory only (loses the catalogue on restart, re-fetches multi-MB payloads);
Redis (extra infra); D1/KV (needed only on Workers).
**Consequence:** a cache interface must exist from day one so the Workers path is not a rewrite.

### ADR-003 Task-shaped tools split by platform
**Decision:** 18 tools (9 for Codeforces, 9 for AtCoder), each answering a natural question end to end for a specific judge platform.
**Why:** simplifies parameters (no need for a joint input site parameter), keeps validation schemas clean, avoids code branch complexity, and facilitates site-specific rate limit handling.
**Rejected:** a 1:1 mapping of CF API methods, a generic `cf_raw_api_call` escape hatch, and unified tool endpoints parameterizing `site: "cf" | "ac"`.
**Consequence:** more server-side logic, which is exactly where the value is.

### ADR-004 Normalize difficulty onto the Codeforces scale
**Decision:** map AtCoder IRT estimates onto the CF rating scale, always labelled
`estimated` with a confidence flag.
**Why:** cross-site ladders are impossible without one scale.
**Risk:** an estimate presented as fact would mislead. Mitigation: label in the data, in the
tool description, and in the server instructions.

### ADR-005 Read-only and credential-free in v1
**Decision:** no auth, no writes, no CF API key.
**Why:** it is what makes the server publicly shareable and keeps the security surface tiny.
**Consequence:** private CF data and submission automation are out of scope.

### ADR-006 Stateless Streamable HTTP
**Decision:** fresh server and transport per request; no session state in memory.
**Why:** works on serverless, trivially horizontally scalable, no session leaks.
**Cost:** no long-lived server-to-client streams. Acceptable, since every tool is a
request-response.

### ADR-007 Verification is the product
**Decision:** `cp_verify_solved_codeforces` and `cp_verify_solved_atcoder` are the highest-priority tools and get a manual 50-problem audit.
**Why:** an unverifiable training log is worthless; correctness here is the differentiator.
**Consequence:** M4 carries the largest schedule buffer.

### ADR-008 Statements are opt-in and link-first
**Decision:** default to returning URLs; statement fetching sits behind a flag with a 30-day
cache and heavy throttling.
**Why:** neither site offers statements via API; bulk crawling is rude and legally grey.

## 2. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Trigger to act |
|---|---|---|---|---|---|
| R1 | AtCoder Problems deprecates or changes an endpoint | high | high | loader interface, fixtures, watch the repo, degrade to CF-only | any 404 or schema mismatch |
| R2 | Codeforces rate limit tripped under multi-user load | medium | high | global queue, budget guard, cache-first, circuit breaker | 1 call-limit event in logs |
| R3 | Verification disagrees with the site UI | medium | critical | exhaustive fixtures, 50-problem audit, exact verdict semantics | any audit mismatch |
| R4 | Token blowup in tool output | medium | medium | caps, projection, token-budget CI test | any result over budget |
| R5 | Getting IP-blocked by an upstream | low | high | polite UA with contact, conservative intervals, honor ETags | any 403 or block page |
| R6 | Difficulty estimate mistaken for an official rating | medium | medium | labels in data, description and instructions | a model quotes it as official |
| R7 | Slow cold sync makes tools time out | medium | medium | background sync, partial results, safety caps | any call over 20s |
| R8 | Spec version drift breaks a client | low | medium | pin the SDK, test the client matrix each release | a client fails to connect |
| R9 | Duplicate or missing problems after dedupe | medium | medium | abc058/arc071 regression test, unique index on id | duplicate id in output |
| R10 | Scope creep into judging, submitting, more sites | high | medium | non-goals list in doc 00, one judge adapter at a time | a new site before M6 ships |
| R11 | Public abuse of the open endpoint | low | low | per-IP limits, read-only tools, no arbitrary fetch | traffic spike |
| R12 | Losing the cache file (redeploy) | medium | low | idempotent re-sync, warm-up cron, volume mounts | after any deploy |

## 3. Legal and etiquette boundaries

1. **Codeforces API** is official and public; respect the documented 1 request / 2 seconds.
2. **AtCoder Problems** is a volunteer project. Sleep more than 1s, use ETags, do not run
   tens of thousands of requests per day without asking the maintainer.
3. **No login-gated scraping.** Ever. No credential storage, no session replay.
4. **No bulk statement mirroring.** Statements are the sites' content, not yours.
5. **Attribute both sources** in the README and in the server instructions.
6. **Identify yourself** in the User-Agent with a contact URL so maintainers can reach you.
7. **No rating manipulation, no submission automation, no anti-plagiarism circumvention.**

## 4. Open questions to resolve before M3 and M5

- [ ] Q1 Do virtual and practice ACs count as solved for verification? (Proposal: yes, but
      expose `participation` so a caller can filter. Decide before the audit.)
- [ ] Q2 Exact AtCoder-to-CF difficulty mapping. Validate empirically against 30 problems you
      have solved on both sites, then freeze and document the curve.
- [ ] Q3 Should AtCoder get synthetic tags (from AtCoder Problems' community data or your own
      labels)? If yes, that is a new dataset and a new confidence label.
- [ ] Q4 AtCoder user rating source: skip it, or read the undocumented history JSON as
      best-effort?
- [ ] Q5 Multi-user cache isolation on the public endpoint: shared catalogue plus per-handle
      solved sets is fine, but cap the number of distinct handles synced per hour.
- [ ] Q6 Cache backend for the chosen host: SQLite volume, or D1 + KV?
- [ ] Q7 Do you want an optional API key later for a higher rate budget for yourself?
- [ ] Q8 Third judge (CSES, CodeChef, LeetCode) - which one, and after which milestone?

## 5. Things that will tempt you (do not do them)

1. Adding `cf_raw_api_call` "just for debugging". It becomes the only tool the model uses and
   your rate-limit guarantees evaporate.
2. Skipping the cache during M1 and M2 because live calls work fine for one user. They will
   not work at all for five.
3. Returning the raw upstream JSON because it is "more complete". It is more expensive and
   less usable.
4. Trusting the HTTP status code from Codeforces.
5. Logging to stdout on stdio. The protocol stream dies and the failure looks unrelated.
6. Inferring solved status from anything other than submissions.
7. Building the fourth judge before the first two are audited.
8. Shipping without the 50-problem audit because "it looked right in three spot checks".
