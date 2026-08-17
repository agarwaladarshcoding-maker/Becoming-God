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
```bash
node dist/bin/stdio.js
```

## Tools Included

- `ping` — Connection health check.
