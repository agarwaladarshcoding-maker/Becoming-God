# better-sqlite3 13 requires Node >= 22: its Linux prebuilds are built against
# the Node 22 ABI. On Node 20 the module still loads, but it segfaults the
# moment `new Database()` touches the file — hence Node 22 here, not 20.
FROM node:22-slim

# Install python and build tools for native addons (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Drop devDependencies (typescript, vitest, eslint, prettier) from the runtime image
RUN npm prune --omit=dev

# Setup data directory for SQLite
RUN mkdir -p /data

# Expose HTTP port
EXPOSE 3000

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV CP_MCP_DB_PATH=/data/cp-mcp.db

# Run the compiled HTTP server entrypoint.
CMD ["node", "dist/http.js"]
