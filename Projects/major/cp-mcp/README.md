# cp-mcp

Competitive Programming Model Context Protocol (MCP) Server. Exposes Codeforces and AtCoder competitive programming data as high-level task-shaped tools to MCP clients (dynamic training ladders, machine-verified solved status, analytics, and more).

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run unit tests
npm run test
```

## Running the Server

### Stdio Transport (Default)
Used for Claude Desktop and Cursor.
```bash
node dist/bin/stdio.js
```

### HTTP Transport (For Claude Web / Notion)
Used for web-based MCP clients that require a public HTTPS URL. Start the server:
```bash
npm run serve
```
Then, in a new terminal, create a secure public tunnel to your local server using Cloudflare Tunnels (recommended for stability and bypassing anti-phishing blocks):
```bash
cloudflared tunnel --url http://localhost:3000
```
*(If you don't have `cloudflared`, install it via `brew install cloudflared` on macOS).*

Look for the `https://....trycloudflare.com` URL in the terminal output. Copy that URL, append `/sse` to it (e.g. `https://xxx.trycloudflare.com/sse`), and paste it into Claude Web or Notion's MCP settings.

## Features Included

### Tools
- `cp_get_user_{codeforces,atcoder}` — Fetch user profile info, current rating, and max rating.
- `cp_rating_history_{codeforces,atcoder}` — Fetch rating history, recent contest performances, and rating trends.
- `cp_search_problems_{codeforces,atcoder}` — Find practice problems within a specific difficulty band, topic tags, and optionally excluding solved problems.
- `cp_get_problem_{codeforces,atcoder}` — Get metadata for a specific problem by ID or URL.
- `cp_verify_solved_{codeforces,atcoder}` — Machine-verify whether a handle has solved specific problems using submission history.
- `cp_analyze_weaknesses_{codeforces,atcoder}` — Analyze a user's weaknesses by grouping attempted and solved problems by tags or difficulty bands.
- `ping` — Connection health check.

### MCP Resources
- `cp://problems/snapshot_codeforces` — Snapshot of Codeforces problem catalogue.
- `cp://problems/snapshot_atcoder` — Snapshot of AtCoder problem catalogue.
- `cp://user/codeforces/{handle}/solved` — View all solved problems for a Codeforces handle.
- `cp://user/atcoder/{handle}/solved` — View all solved problems for an AtCoder handle.

### MCP Prompts
- `daily_ladder_codeforces` — Generate a personalized daily practice ladder for Codeforces based on a user's weaknesses.
- `daily_ladder_atcoder` — Generate a personalized daily practice ladder for AtCoder based on a user's weaknesses.
- `audit_yesterday_codeforces` — Verify if a user solved their assigned Codeforces problems from yesterday.
- `audit_yesterday_atcoder` — Verify if a user solved their assigned AtCoder problems from yesterday.

## Client Configuration

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cp-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/cp-mcp/dist/bin/stdio.js"]
    }
  }
}
```

### Cursor

Add this in Cursor Settings -> Features -> MCP:
- **Type**: `command`
- **Name**: `cp-mcp`
- **Command**: `node /absolute/path/to/cp-mcp/dist/bin/stdio.js`

### Notion Web / Claude Web

These clients require an HTTP/SSE connection.

1. Start the HTTP server: `npm run serve`
2. Start the tunnel: `cloudflared tunnel --url http://localhost:3000`
3. Copy the `.trycloudflare.com` URL.
4. In Notion or Claude Web, add a new MCP Server:
   - **Type**: `SSE`
   - **URL**: `https://<your-tunnel-url>.trycloudflare.com/sse`
