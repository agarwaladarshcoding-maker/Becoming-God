# cp-mcp

Competitive Programming Model Context Protocol (MCP) Server. Exposes Codeforces and AtCoder competitive programming data as high-level task-shaped tools to MCP clients (dynamic training ladders, machine-verified solved status, analytics, and more).

## Setup

Requires **Node 22 or newer** (`better-sqlite3@13.0.3` declares `engines.node >= 22` and its prebuilds are built against that ABI — on Node 20 the module loads but segfaults the moment it touches the database file). `better-sqlite3` is a native module and gets compiled during `npm install`, so a working C++ toolchain is expected on your machine.

```bash
# Install dependencies (compiles better-sqlite3)
npm install

# Build — clients run the compiled dist/, not src/
npm run build

# Run unit tests
npm run test
```

Every client configuration below points at `dist/bin/stdio.js`, so re-run `npm run build` after pulling changes.

## Features Included

### Tools

17 tools total (16 CP tools + `ping`). `cp_contest_performance_{cf,ac}` is specified in `docs/04-TOOL-CONTRACTS.md` but **not implemented yet** — it is not available.

- `cp_get_user_{codeforces,atcoder}` — Fetch user profile info, current rating, and max rating.
- `cp_rating_history_{codeforces,atcoder}` — Fetch rating history, recent contest performances, and rating trends.
- `cp_search_problems_{codeforces,atcoder}` — Find practice problems within a specific difficulty band, topic tags, and optionally excluding solved problems. On AtCoder, 4,610 of 9,395 problems (mostly sponsored/university problems, `typical90`, `dp`, `practice` — not the ABC/ARC/AGC ladder, which is 99.5% covered) have no difficulty estimate from kenkoooo's IRT model and are excluded by default; a non-zero exclusion is always named in the footer. Pass `include_unrated: true` to get them back, rendered with difficulty `?` and ranked after every genuinely-matching row (a reserved ~20% share of `limit`, at least one row) — this is the only way to reach curated practice sets like `dp_a` "Frog 1", the most-solved AtCoder problem in existence at 91,360 solvers.
- `cp_get_problem_{codeforces,atcoder}` — Get metadata for a specific problem by ID or URL.
- `cp_verify_solved_{codeforces,atcoder}` — Machine-verify whether a handle has solved specific problems using submission history. On a cold cache the answer for an older problem may come back `? unknown` instead of `✓`/`✗` — that means your submission history for that period is still downloading, **not** that the problem is unsolved. Ask again shortly; it resolves to a real answer once the backfill finishes (normally on the first call for a typical account — the first sync of a handle is given a 20-second budget to pull its history before answering).
- `cp_get_submissions_{codeforces,atcoder}` — Fetch recent submissions for a handle.
- `cp_upcoming_contests_{codeforces,atcoder}` — List upcoming contests in a time window, with start times converted to a requested timezone.
- `cp_analyze_weaknesses_{codeforces,atcoder}` — Analyze a user's weaknesses by grouping attempted and solved problems by tags or difficulty bands.
- `ping` — Connection health check.

On the handle-taking tools, `handle` is optional — see "Configuring your handle" below.

### MCP Resources

4 resources are registered: 2 static resources (`resources/list`) and 2 resource templates (`resources/templates/list`).

- `cp://problems/snapshot_codeforces` — Snapshot of Codeforces problem catalogue.
- `cp://problems/snapshot_atcoder` — Snapshot of AtCoder problem catalogue.
- `cp://user/codeforces/{handle}/solved` — Solved-problem summary for a Codeforces handle.
- `cp://user/atcoder/{handle}/solved` — Solved-problem summary for an AtCoder handle.

### MCP Prompts

- `daily_ladder_codeforces` — Generate a personalized daily practice ladder for Codeforces based on a user's weaknesses.
- `daily_ladder_atcoder` — Generate a personalized daily practice ladder for AtCoder based on a user's weaknesses.
- `audit_yesterday_codeforces` — Verify if a user solved their assigned Codeforces problems from yesterday.
- `audit_yesterday_atcoder` — Verify if a user solved their assigned AtCoder problems from yesterday.

## Configuring your handle

Set `CP_MCP_CF_HANDLE` and/or `CP_MCP_AC_HANDLE` in the client's `env` block (see configs below) and the handle-taking tools no longer need a `handle` argument — you can just ask "which of these have I solved?" and the server resolves your handle from the environment. An explicit `handle` argument, when given, still overrides the environment default. If neither is set and no argument is passed, the tool returns an actionable error naming the missing env var, not a generic validation failure.

## Client Configuration

### One command

```bash
npm run install:local
```

That wires cp-mcp into Claude Code (**every directory**, not just this repo) and Claude Desktop, and installs
two launchd agents. It is idempotent — re-run it after `git pull` and it reports "unchanged" where nothing moved.

The two clients are wired by different routes on purpose:

- **Claude Code** — via `claude mcp add --scope user`. `~/.claude.json` is rewritten continuously by running
  Claude Code sessions, so hand-merging it would be last-writer-wins against its owner. The installer only ever
  *reads* that file, to decide whether a write is needed. If the `claude` binary isn't on `PATH`, the step is
  skipped and the exact command is printed — never a fallback hand-edit of a live config.
- **Claude Desktop** — hand-merged, because there is no CLI for it. Backed up first, only `mcpServers["cp-mcp"]`
  touched, and aborted untouched if the file doesn't parse: it carries a `preferences` blob of real app state
  whose loss would not be obvious.

Absolute paths are used for both `command` and `args`, because GUI-launched Claude Desktop does not inherit your
shell `PATH` and a bare `node` is a common silent-failure mode.

> **Quit Claude Desktop before running this.** Not just closing the window — Cmd-Q. Claude Desktop persists its
> config from memory while running, and was observed here rewriting `claude_desktop_config.json` between two
> installer runs, silently dropping the `mcpServers` entry that had just been added. The installer warns when it
> detects the app running; heed it, or the install will appear to succeed and quietly not stick.

Afterwards, start a new Claude Code session so it picks up the user-scope registration.

### Doing it by hand

If you'd rather not run the installer, the entry is an ordinary stdio server:

```json
{
  "mcpServers": {
    "cp-mcp": {
      "command": "/opt/homebrew/bin/node",
      "args": ["/absolute/path/to/cp-mcp/dist/bin/stdio.js"],
      "env": { "CP_MCP_CF_HANDLE": "your-handle" }
    }
  }
}
```

`~/.gemini/settings.json` uses the same `mcpServers` shape. Cursor's MCP settings (Settings → Features → MCP)
accept the same command/args/env fields.

## Background agents

`npm run install:local` also installs two launchd agents:

| Label | What it does |
| --- | --- |
| `com.adarsh.cp-mcp.server` | Runs the HTTP server on `127.0.0.1:3000`, `KeepAlive`. |
| `com.adarsh.cp-mcp.refresh` | Warms the catalogues and your submission history at 04:00. |

The refresh exists because Codeforces allows one request per 2100ms, so a cold submission backfill costs real
wall-clock time. Paying it overnight beats paying it the moment you ask "did I solve this?".

Logs are at `~/.cp-mcp/server.log` and `~/.cp-mcp/refresh.log`. To stop either:

```bash
launchctl bootout gui/$(id -u)/com.adarsh.cp-mcp.server
```

Delete the matching plist in `~/Library/LaunchAgents/` to keep it from coming back.

**The daemon is deliberately not registered as a second Claude Code server.** Claude Code and Claude Desktop
reach cp-mcp over stdio; adding the same 17 tools again over HTTP would duplicate every tool in the client's
list. The daemon is there for everything else local — other MCP clients, `curl`, scripts.

## Local HTTP server

`npm run serve` starts a Streamable HTTP server (`POST /mcp`) with a `/health` endpoint, built on
`@hono/node-server`. Under `install:local` this is what the `com.adarsh.cp-mcp.server` agent runs.

It binds **`127.0.0.1` only**. That default matters: the daemon carries `CP_MCP_CF_HANDLE`, and `resolveHandle`
(`src/domain/config.ts`) falls back to it, so every caller who omits a handle silently gets yours. An
all-interfaces bind would hand a handle-scoped server to anyone on the same cafe wifi or campus LAN. Set
`CP_MCP_HTTP_HOST=0.0.0.0` to opt out deliberately — and if you do, read the warning at the end of the auth
section first.

### Auth

Set `CP_MCP_AUTH_TOKEN` and the endpoint gates every request to `/mcp`; unset, behaviour is unchanged (open, as in local dev). Two ways to present the token, checked with a constant-time comparison:

- **Secret path** — `POST https://<host>/mcp/<token>`. This is the form claude.ai's custom-connector UI needs: it accepts a URL plus optional OAuth client ID/secret and has no field for a custom header, so a header-only gate would lock out the very client this deploy targets.
- **Bearer header** — `Authorization: Bearer <token>` on `POST /mcp`, for clients that can send headers (Claude Code, Cursor).

`/health` stays open so health checks and manual probing don't need the secret. The trade-off with the secret-path form is deliberate: a capability URL can appear in proxy logs. That's acceptable here because the server is read-only over public competitive-programming data — a leak costs rate budget, not privacy.

**Setting `CP_MCP_CF_HANDLE` is correct on a loopback daemon and wrong on a shared one.** `resolveHandle` (`src/domain/config.ts`) falls back to these env vars. On your own laptop, bound to `127.0.0.1`, that is exactly what you want — you shouldn't retype your own handle on your own machine. On anything other people can reach, it would make every anonymous caller silently default to your handle. If you ever set `CP_MCP_HTTP_HOST` to something other than loopback, unset the handle vars in the same breath.

## Cache

The SQLite cache lives at `~/.cp-mcp/cache.db`, created automatically on first run regardless of the process's
working directory. Set `CP_MCP_DB_PATH` to override it (tests use `:memory:`).

### Back it up

```bash
npm run backup
```

The problem catalogues re-download in minutes. Your submission history — the thing behind "machine-verified
solve status" — does not. This uses SQLite's online backup API rather than copying the file, so the snapshot is
consistent even while the daemon is writing; a plain `cp` would miss whatever is still in the WAL. It then
checkpoints with `TRUNCATE` and keeps the last 7 backups in `~/.cp-mcp/backups/`.

**Never delete `cache.db-wal` by hand.** An uncheckpointed WAL holds committed transactions that are not yet in
the main file; removing it discards them. That is how 773 real submissions were lost once already.

### Several clients at once

Claude Code, Claude Desktop and the daemon are three processes sharing one database. Concurrent reads and writes
are fine (WAL mode, 5s busy timeout), but the Codeforces throttle is per-process, so three of them would
collectively exceed the 1-request-per-2-seconds limit — and Codeforces signals over-quota with **HTTP 200 and
`status: "FAILED"` in the body**, which would degrade silently into a short sync and a false "untouched" verdict.

A `sync_lock` lease (`src/cache/lock.ts`) prevents that: only the lease holder fetches for a given handle, and
everyone else returns cached data immediately rather than queueing. A crashed holder's lease expires and is
reclaimed, so nothing wedges.

## Hosting it remotely (optional, not required)

Everything above runs on your laptop and needs no server. `Dockerfile`, `.dockerignore` and `fly.toml` remain in
the repo for anyone who wants a hosted instance, and the image is known to build and serve `/health`. Nothing in
the local setup depends on them.

The cost of staying local is honest and worth stating: **Claude Web and Notion cannot reach a loopback address**,
so neither can use this. Claude Code (every directory), Claude Desktop and any other local client can.

If you do host it: generate a token, set it as a secret rather than in committed config, and **do not set
`CP_MCP_CF_HANDLE`** on the host, for the reason in the auth section above.
