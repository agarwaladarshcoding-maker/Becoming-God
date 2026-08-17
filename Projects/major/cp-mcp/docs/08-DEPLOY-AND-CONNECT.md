# 08 - Deploy and Connect

## 1. Distribution channels

| Channel | Who uses it | Effort |
|---|---|---|
| npm package with a bin | Claude Desktop, Cursor, Gemini CLI, any stdio host | low |
| Public HTTPS endpoint | Claude web, Notion, ChatGPT, any remote host | medium |
| Docker image | self-hosters | low once the HTTP entry exists |
| MCP registry listing | discovery | low, do it last |

Ship both stdio and remote. They serve different clients and cost you one extra file.

## 2. package.json essentials

```jsonc
{
  "name": "cp-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": { "cp-mcp": "dist/bin/stdio.js" },
  "files": ["dist", "README.md", "LICENSE"],
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/bin/stdio.ts",
    "dev:http": "tsx watch src/http.ts",
    "inspect": "npx @modelcontextprotocol/inspector node dist/bin/stdio.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

Add a shebang to `src/bin/stdio.ts` and make sure the built file keeps it.

## 3. Hosting options for the remote endpoint

| Platform | Pros | Cons | Cache backend |
|---|---|---|---|
| Cloudflare Workers | cheap, global, fast cold start, first-class MCP support | no local disk, stateless only | D1 + KV |
| Fly.io | real disk, long-running process, simple | one region unless you scale | SQLite on a volume |
| Railway / Render | easiest Docker deploy | cold starts on free tiers | SQLite on a volume |
| Your own VPS | full control, cron jobs | you own uptime | SQLite |

Recommendation: **Fly.io or Railway for v1** (SQLite on a volume keeps the cache code simple),
migrate to Workers + D1 later if you want global latency.

### Environment variables

```
CP_MCP_CACHE_PATH=/data/cp-mcp.sqlite
CP_MCP_USER_AGENT=cp-mcp/0.1 (+https://github.com/you/cp-mcp)
CP_MCP_CF_INTERVAL_MS=2100
CP_MCP_AC_INTERVAL_MS=1200
CP_MCP_RATE_LIMIT_PER_IP=60
CP_MCP_RATE_LIMIT_WINDOW_S=300
CP_MCP_ENABLE_STATEMENTS=false
CP_MCP_LOG_LEVEL=info
```

No secrets. That is the point: a credential-free server is safe to run publicly.

### Dockerfile sketch

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
ENV CP_MCP_CACHE_PATH=/data/cp-mcp.sqlite
VOLUME /data
EXPOSE 8080
CMD ["node", "dist/http.js"]
```

### Warm-up cron

Refresh snapshots off the critical path:
- CF problem catalogue: every 6h
- AtCoder datasets: every 12h (ETag makes this nearly free)
- Solved-set for your own handles: every 30 min

On Fly use a scheduled machine; on Workers use a cron trigger; on a VPS use systemd timers.

## 4. Client configuration snippets (put these in your README)

### Claude Desktop (stdio)
`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS,
`%APPDATA%\Claude\claude_desktop_config.json` on Windows:

```json
{
  "mcpServers": {
    "cp-mcp": {
      "command": "npx",
      "args": ["-y", "cp-mcp"],
      "env": { "CP_MCP_CACHE_PATH": "~/.cache/cp-mcp.sqlite" }
    }
  }
}
```

### Cursor
`.cursor/mcp.json` in the project or `~/.cursor/mcp.json` globally - same shape as above.

### Gemini CLI
`~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "cp-mcp": { "command": "npx", "args": ["-y", "cp-mcp"] }
  }
}
```

### Claude web / ChatGPT / Notion (remote)
Add a custom connector pointing at `https://cp-mcp.example.dev/mcp`. No auth needed for the
read-only public server. In Notion this becomes an MCP connection on your personal agent or
on a custom agent, after which any agent turn can call the tools.

### Local remote testing
```bash
npm run dev:http                # serves http://localhost:8080/mcp
npx @modelcontextprotocol/inspector --url http://localhost:8080/mcp
```
For hosts that only speak stdio but need a remote server, `mcp-remote` bridges the two.

## 5. Registry manifest (server.json)

```jsonc
{
  "name": "io.github.you/cp-mcp",
  "description": "Codeforces and AtCoder practice data: problem search, submission verification, contest schedules.",
  "version": "0.1.0",
  "repository": { "url": "https://github.com/you/cp-mcp", "source": "github" },
  "packages": [
    { "registryType": "npm", "identifier": "cp-mcp", "version": "0.1.0",
      "transport": { "type": "stdio" } }
  ],
  "remotes": [
    { "type": "streamable-http", "url": "https://cp-mcp.example.dev/mcp" }
  ]
}
```

## 6. Release checklist

- [ ] `npm run build && npm run test && npm run typecheck` clean
- [ ] version bumped, CHANGELOG entry written
- [ ] `npm publish --access public`
- [ ] Docker image built and pushed, remote deployed, `/health` green
- [ ] README: what it does, the 5 client configs, the tool table, rate-limit policy,
      attribution to Codeforces and AtCoder Problems, MIT license
- [ ] GitHub topics: `mcp`, `model-context-protocol`, `codeforces`, `atcoder`,
      `competitive-programming`
- [ ] registry submission + a short demo GIF of a verification call

## 7. Operating the public server

- **Budget guard:** a global counter caps upstream calls per hour. When tripped, serve
  cache-only and say so in the footer. This protects both you and the upstreams.
- **Abuse:** per-IP limits, no arbitrary-host fetching, no write tools. Worst case a bad
  actor drains your cache reads, which cost nothing upstream.
- **Deprecation watch:** subscribe to the AtCoder Problems repo. If an endpoint dies, your
  loader interface means one file changes.
- **Status transparency:** `/health` publicly shows snapshot ages so users can see staleness.
- **Attribution and courtesy:** credit both data sources in the README and in the server
  instructions. A descriptive User-Agent with a contact URL means maintainers can reach you
  instead of blocking you.
