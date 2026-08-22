# Use a Node base image that supports better-sqlite3 build if needed
FROM node:20-slim

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
