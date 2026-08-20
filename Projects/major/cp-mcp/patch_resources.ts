import fs from 'fs';

const serverFile = 'src/server.ts';
let content = fs.readFileSync(serverFile, 'utf-8');

const resourcesImport = `
import { getDb } from "./cache/db.js";
`;

content = content.replace('import { registerGetSubmissionsCodeforces', resourcesImport + '\nimport { registerGetSubmissionsCodeforces');

const resourceRegistrations = `
  // Register MCP Resources
  
  // Codeforces Problem Snapshot
  server.resource(
    "cp-problems-snapshot-codeforces",
    "cp://problems/snapshot_codeforces",
    async (uri) => {
      const db = getDb();
      const count = db.prepare("SELECT count(*) as c FROM problems WHERE site = 'codeforces'").get() as {c: number};
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ site: "codeforces", totalProblems: count.c, timestamp: new Date().toISOString() }, null, 2),
        }],
      };
    }
  );

  // AtCoder Problem Snapshot
  server.resource(
    "cp-problems-snapshot-atcoder",
    "cp://problems/snapshot_atcoder",
    async (uri) => {
      const db = getDb();
      const count = db.prepare("SELECT count(*) as c FROM problems WHERE site = 'atcoder'").get() as {c: number};
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ site: "atcoder", totalProblems: count.c, timestamp: new Date().toISOString() }, null, 2),
        }],
      };
    }
  );

  // User Solved Codeforces
  server.resource(
    "cp-user-solved-codeforces",
    new URLTemplate("cp://user/codeforces/{handle}/solved"),
    async (uri, { handle }) => {
      const db = getDb();
      const rows = db.prepare("SELECT problem_id, first_ac_at, attempts FROM user_solved WHERE site = 'codeforces' AND handle = ? COLLATE NOCASE").all(handle as string);
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ site: "codeforces", handle, solvedCount: rows.filter((r: any) => r.first_ac_at !== null).length, data: rows }, null, 2),
        }],
      };
    }
  );

  // User Solved AtCoder
  server.resource(
    "cp-user-solved-atcoder",
    new URLTemplate("cp://user/atcoder/{handle}/solved"),
    async (uri, { handle }) => {
      const db = getDb();
      const rows = db.prepare("SELECT problem_id, first_ac_at, attempts FROM user_solved WHERE site = 'atcoder' AND handle = ? COLLATE NOCASE").all(handle as string);
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ site: "atcoder", handle, solvedCount: rows.filter((r: any) => r.first_ac_at !== null).length, data: rows }, null, 2),
        }],
      };
    }
  );
`;

// we also need to import ResourceTemplate/URLTemplate? Wait, does MCP SDK use URLTemplate or ResourceTemplate?
// Checking `@modelcontextprotocol/sdk` types or existing imports.
// In `mcp.js`, it usually exposes `ResourceTemplate`.
