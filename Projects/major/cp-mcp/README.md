# cp-mcp

Competitive Programming Model Context Protocol (MCP) Server. Exposes Codeforces and AtCoder competitive programming data as high-level task-shaped tools to MCP clients (dynamic training ladders, machine-verified solved status, analytics, and more).

## Setup

Requires Node 18+. `better-sqlite3` is a native module and gets compiled during `npm install`, so a working C++ toolchain is expected on your machine.

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

15 tools total (14 CP tools + `ping`). `cp_upcoming_contests_{cf,ac}` and `cp_contest_performance_{cf,ac}` are specified in `docs/04-TOOL-CONTRACTS.md` but **not implemented yet** — they are not available.

- `cp_get_user_{codeforces,atcoder}` — Fetch user profile info, current rating, and max rating.
- `cp_rating_history_{codeforces,atcoder}` — Fetch rating history, recent contest performances, and rating trends.
- `cp_search_problems_{codeforces,atcoder}` — Find practice problems within a specific difficulty band, topic tags, and optionally excluding solved problems.
- `cp_get_problem_{codeforces,atcoder}` — Get metadata for a specific problem by ID or URL.
- `cp_verify_solved_{codeforces,atcoder}` — Machine-verify whether a handle has solved specific problems using submission history.
- `cp_get_submissions_{codeforces,atcoder}` — Fetch recent submissions for a handle.
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

### Claude Code

This repo ships a `.mcp.json` in its root, so Claude Code picks up the `cp-mcp` server automatically for any session opened in this project — no manual configuration needed. Open `.mcp.json` and fill in `CP_MCP_CF_HANDLE` / `CP_MCP_AC_HANDLE` with your handles (they ship blank).

### Claude Desktop

Add this to `~/Library/Application Support/Claude/claude_desktop_config.json`, filling in your handles, then **fully quit and restart Claude Desktop** (closing the window is not enough — it keeps the old config in memory until the process restarts):

```json
{
  "mcpServers": {
    "cp-mcp": {
      "command": "/opt/homebrew/bin/node",
      "args": ["/Users/adarshagarwala/Documents/Becoming-God/Projects/major/cp-mcp/dist/bin/stdio.js"],
      "env": { "CP_MCP_CF_HANDLE": "", "CP_MCP_AC_HANDLE": "" }
    }
  }
}
```

Use the absolute path to `node` (`/opt/homebrew/bin/node` on this machine, check yours with `which node`) rather than a bare `node` — Claude Desktop's spawn environment does not reliably include Homebrew's `bin` on `PATH`, and a bare `node` command is a common silent-failure mode.

### Gemini CLI / Cursor

`~/.gemini/settings.json` uses the same `mcpServers` shape as above — add the same block under its own `mcpServers` key. Cursor's MCP settings (Settings → Features → MCP) accept the same command/args/env fields via its UI or `mcp.json`.

## Remote / HTTP

`npm run serve` starts a Streamable HTTP server (`POST /mcp`) with a `/health` endpoint, built on `@hono/node-server`. It is **not currently deployed** — the `Dockerfile` and `fly.toml` exist and build correctly but nothing is hosted right now. Only this Streamable HTTP transport exists; there is no other web-facing transport or tunnel setup to configure.

## Cache

The SQLite cache defaults to `~/.cp-mcp/cache.db`, created automatically on first run regardless of the process's working directory. Set `CP_MCP_DB_PATH` to override the location (e.g. for tests, which use `:memory:`).
