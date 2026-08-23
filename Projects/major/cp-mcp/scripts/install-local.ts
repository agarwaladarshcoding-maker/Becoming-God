// Wires cp-mcp into every client that can reach it locally: Claude Code (every
// directory, not just this repo) and Claude Desktop.
//
// The two take deliberately different routes, because the files differ in who
// owns them:
//
//   Claude Code    — `claude mcp add --scope user`. ~/.claude.json is rewritten
//                    continuously by running Claude Code sessions, so a
//                    read-parse-write of the whole file would race them. We
//                    only ever READ it, to decide whether a write is needed.
//
//   Claude Desktop — hand-merged. There is no CLI for it, and its config holds
//                    a `preferences` blob of real app state (window layout,
//                    per-account settings) that must survive untouched, so we
//                    back up first and merge only mcpServers["cp-mcp"].
//
// Structured as small exported functions rather than one `main()` so a later
// step (launchd registration) can extend the same file without restructuring it.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const MIN_NODE_MAJOR = 22;

export const SERVER_LABEL = "com.adarsh.cp-mcp.server";
export const REFRESH_LABEL = "com.adarsh.cp-mcp.refresh";

export interface McpServerEntry {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export type McpConfig = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow `unknown` JSON into an object we can merge into, without ever casting. */
function asConfigObject(value: unknown): McpConfig {
  if (!isRecord(value)) {
    throw new Error("config root is not a JSON object");
  }
  return value;
}

/**
 * True when `obj.mcpServers["cp-mcp"]` already deep-equals `entry` — the
 * idempotency check. Anything short of an exact match (missing key, extra
 * key, different value) counts as a change so a stale entry always gets
 * overwritten rather than silently left in place.
 */
export function entryMatches(obj: McpConfig, entry: McpServerEntry): boolean {
  const servers = obj["mcpServers"];
  if (!isRecord(servers)) return false;
  const existing = servers["cp-mcp"];
  return JSON.stringify(existing) === JSON.stringify(entry);
}

/**
 * Merge `entry` into `obj.mcpServers["cp-mcp"]` in place, creating
 * `mcpServers` if absent, and leaving every other key untouched.
 */
export function mergeEntry(obj: McpConfig, entry: McpServerEntry): McpConfig {
  const servers = isRecord(obj["mcpServers"]) ? obj["mcpServers"] : {};
  const nextServers: Record<string, unknown> = { ...servers, "cp-mcp": entry };
  return { ...obj, mcpServers: nextServers };
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return (
    String(d.getFullYear()) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

export interface UpdateResult {
  path: string;
  action: "written" | "unchanged" | "created";
  backupPath: string | null;
}

/**
 * Read `configPath`, merge `entry` into its `mcpServers["cp-mcp"]`, and write
 * it back — after backing up the original. Never touches the file if the
 * result would be identical to what's already there, and never partially
 * writes: a parse failure aborts before anything is touched.
 */
export function updateConfig(configPath: string, entry: McpServerEntry): UpdateResult {
  if (!fs.existsSync(configPath)) {
    const created: McpConfig = { mcpServers: { "cp-mcp": entry } };
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(created, null, 2) + "\n", "utf8");
    return { path: configPath, action: "created", backupPath: null };
  }

  const raw = fs.readFileSync(configPath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `${configPath} exists but is not valid JSON — aborting without changing it (${
        err instanceof Error ? err.message : String(err)
      })`
    );
  }
  const obj = asConfigObject(parsed);

  if (entryMatches(obj, entry)) {
    return { path: configPath, action: "unchanged", backupPath: null };
  }

  const backupPath = `${configPath}.bak-${timestamp()}`;
  fs.copyFileSync(configPath, backupPath);

  const merged = mergeEntry(obj, entry);
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + "\n", "utf8");

  return { path: configPath, action: "written", backupPath };
}

/** Throws with a clear message if the running Node is below the minimum the project requires. */
export function assertNodeVersion(execPath: string): void {
  const versionOutput = process.version; // e.g. "v26.4.0" — matches the interpreter at execPath in normal use.
  const major = Number(versionOutput.replace(/^v/, "").split(".")[0]);
  if (!Number.isFinite(major) || major < MIN_NODE_MAJOR) {
    throw new Error(
      `Node ${versionOutput} (${execPath}) is below the required >=${MIN_NODE_MAJOR}.0.0. ` +
        `better-sqlite3@13 segfaults on older Node the moment it opens the cache database. ` +
        `Install Node ${MIN_NODE_MAJOR}+ and re-run.`
    );
  }
}

/** Throws with a clear message if `npm run build` has not produced the stdio entrypoint. */
export function assertBuilt(stdioPath: string): void {
  if (!fs.existsSync(stdioPath)) {
    throw new Error(
      `${stdioPath} does not exist — run \`npm run build\` first (this script does that for you via ` +
        `\`npm run install:local\`, so seeing this means the build step failed silently).`
    );
  }
}

export function claudeCodeConfigPath(): string {
  return path.join(os.homedir(), ".claude.json");
}

export function claudeDesktopConfigPath(): string {
  return path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json"
  );
}

export function buildServerEntry(nodePath: string, stdioPath: string): McpServerEntry {
  // CP_MCP_CF_HANDLE is deliberate HERE and would be wrong on a shared host:
  // resolveHandle (src/domain/config.ts) falls back to it, so on a server other
  // people call, every anonymous caller would silently get this handle. These
  // are single-user processes on the owner's own laptop, where not retyping
  // your own handle is the entire point.
  //
  // No CP_MCP_AC_HANDLE: resolveHandle treats empty-after-trim as unset, so an
  // empty placeholder buys nothing and just adds an argument the CLI below has
  // to carry. The AtCoder tools take an explicit `handle` until one is set.
  return {
    command: nodePath,
    args: [stdioPath],
    env: { CP_MCP_CF_HANDLE: "AdarshAg" },
  };
}

// ---------------------------------------------------------------------------
// Claude Code registration
//
// ~/.claude.json is NOT hand-edited here, unlike the Claude Desktop config.
// Claude Code owns that file and rewrites it continuously while sessions run —
// session state, project entries, history. A read-parse-write of the whole
// file against a live writer is last-writer-wins: whatever it wrote between
// our read and our write is silently lost, or ours is. So writes go through
// `claude mcp add`, which is the supported path; we only ever READ the file,
// to decide whether a write is needed at all.
// ---------------------------------------------------------------------------

/** Result of running a subprocess. Injected in tests so no real CLI is invoked. */
export interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (file: string, args: string[]) => RunResult;

export const defaultRunner: CommandRunner = (file, args) => {
  // Arguments are passed as an array, never as a shell string: the repo path
  // contains spaces ("Becoming-God/Projects/..."), and there is no shell here
  // to mis-split them.
  const res = spawnSync(file, args, { encoding: "utf8" });
  return {
    status: res.status,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
};

/** The exact argv for registering the stdio server at user scope. */
export function claudeCodeAddArgs(entry: McpServerEntry): string[] {
  const envArgs = Object.entries(entry.env).flatMap(([k, v]) => ["-e", `${k}=${v}`]);
  // `--scope user` is what makes the server resolve in EVERY directory rather
  // than only this repo — the whole point of the step. The `--` terminator
  // separates cp-mcp's own flags from the command being wrapped.
  return ["mcp", "add", "--scope", "user", "cp-mcp", ...envArgs, "--", entry.command, ...entry.args];
}

/**
 * Read-only check for an already-registered user-scoped entry. Reading is
 * safe against a live writer in a way that writing is not. A malformed file
 * is reported as "not registered" rather than throwing: the CLI is the thing
 * that will actually have to cope with it, and it knows how.
 */
export function readUserScopedEntry(claudeJsonPath: string): unknown {
  if (!fs.existsSync(claudeJsonPath)) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(claudeJsonPath, "utf8"));
  } catch {
    return undefined;
  }
  if (!isRecord(parsed)) return undefined;
  const servers = parsed["mcpServers"];
  if (!isRecord(servers)) return undefined;
  return servers["cp-mcp"];
}

/**
 * True when the registered entry already launches the same binary with the
 * same arguments. Compares command and args only, not env: the CLI normalises
 * env representation, and a spurious mismatch would make every run re-register.
 */
export function claudeCodeEntryCurrent(existing: unknown, entry: McpServerEntry): boolean {
  if (!isRecord(existing)) return false;
  const args = existing["args"];
  if (!Array.isArray(args)) return false;
  return (
    existing["command"] === entry.command &&
    JSON.stringify(args) === JSON.stringify(entry.args)
  );
}

export interface ClaudeCodeResult {
  action: "registered" | "unchanged" | "skipped";
  detail: string;
}

export function registerWithClaudeCode(
  entry: McpServerEntry,
  claudeJsonPath: string,
  claudeBinary: string | null,
  runner: CommandRunner = defaultRunner
): ClaudeCodeResult {
  const addArgs = claudeCodeAddArgs(entry);

  if (claudeBinary === null) {
    // Deliberately no fallback to hand-editing ~/.claude.json. Silently
    // corrupting a live config is far worse than skipping a step the user
    // can finish in one paste.
    return {
      action: "skipped",
      detail: `\`claude\` not found on PATH. Register it yourself with:\n    claude ${addArgs.join(" ")}`,
    };
  }

  if (claudeCodeEntryCurrent(readUserScopedEntry(claudeJsonPath), entry)) {
    return { action: "unchanged", detail: "already registered at user scope" };
  }

  // `add` refuses a name that already exists in this scope, so clear a stale
  // entry first. Scoped explicitly: an unscoped remove would delete whichever
  // scope it found, and this repo also has a PROJECT-scoped cp-mcp in
  // .mcp.json that must survive untouched.
  runner(claudeBinary, ["mcp", "remove", "--scope", "user", "cp-mcp"]);

  const res = runner(claudeBinary, addArgs);
  if (res.status !== 0) {
    throw new Error(
      `\`claude ${addArgs.join(" ")}\` exited with ${String(res.status)}: ${res.stderr.trim() || res.stdout.trim()}`
    );
  }
  return { action: "registered", detail: "registered at user scope (all directories)" };
}

export function findClaudeBinary(runner: CommandRunner = defaultRunner): string | null {
  const res = runner("/usr/bin/which", ["claude"]);
  if (res.status !== 0) return null;
  const found = res.stdout.trim();
  return found.length > 0 ? found : null;
}

function reportLine(result: UpdateResult): string {
  switch (result.action) {
    case "created":
      return `  ${result.path} — created (did not exist)`;
    case "unchanged":
      return `  ${result.path} — unchanged (already correct)`;
    case "written":
      return `  ${result.path} — written (backup: ${result.backupPath})`;
  }
}

export function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.join(scriptDir, "..");
  const stdioPath = path.join(repoRoot, "dist", "bin", "stdio.js");

  assertNodeVersion(process.execPath);
  assertBuilt(stdioPath);

  const entry = buildServerEntry(process.execPath, stdioPath);

  console.log("cp-mcp local install");
  console.log(`  node:  ${process.execPath}`);
  console.log(`  stdio: ${stdioPath}`);
  console.log("");

  // Claude Code — via its own CLI, because it owns and rewrites ~/.claude.json.
  const code = registerWithClaudeCode(entry, claudeCodeConfigPath(), findClaudeBinary());
  console.log("Claude Code:");
  console.log(`  ${code.detail}`);
  console.log("");

  // Claude Desktop — hand-merged, because there is no CLI for it. Its config
  // carries a `preferences` blob of real app state that must survive.
  const desktop = updateConfig(claudeDesktopConfigPath(), entry);
  console.log("Claude Desktop:");
  console.log(reportLine(desktop));
  console.log("");

  // launchd — the loopback daemon and the nightly cache warm.
  const logDir = cpMcpHome();
  fs.mkdirSync(logDir, { recursive: true });
  const token = ensureAuthToken(path.join(logDir, "auth-token"));

  const serverAgent = installLaunchAgent(
    SERVER_LABEL,
    buildServerPlist(
      SERVER_LABEL,
      [process.execPath, path.join(repoRoot, "dist", "http.js")],
      {
        PORT: "3000",
        // Loopback, always. See the comment on resolveBindHost in src/http.ts:
        // this daemon carries a default handle, so an all-interfaces bind
        // would answer strangers on any network this laptop joins.
        CP_MCP_HTTP_HOST: "127.0.0.1",
        CP_MCP_AUTH_TOKEN: token,
        ...entry.env,
      },
      path.join(logDir, "server.log")
    ),
    launchAgentsDir(),
    true
  );

  const refreshAgent = installLaunchAgent(
    REFRESH_LABEL,
    buildRefreshPlist(
      REFRESH_LABEL,
      [process.execPath, "--import", "tsx", path.join(repoRoot, "scripts", "refresh-cache.ts")],
      entry.env,
      path.join(logDir, "refresh.log"),
      4
    ),
    launchAgentsDir()
  );

  console.log("launchd agents:");
  for (const agent of [serverAgent, refreshAgent]) {
    console.log(`  ${agent.label} — ${agent.action}: ${agent.detail}`);
  }
  console.log("");
  console.log(`  HTTP daemon:  http://127.0.0.1:3000/mcp`);
  console.log(`  auth token:   ${path.join(logDir, "auth-token")} (mode 0600)`);
  console.log(`  logs:         ${logDir}/server.log, ${logDir}/refresh.log`);
  console.log("");

  console.log(
    "Restart Claude Desktop and start a new Claude Code session for the change to take effect."
  );
  console.log(
    "AtCoder tools still need an explicit `handle` — set CP_MCP_AC_HANDLE in the configs above to default it."
  );
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  try {
    main();
  } catch (err) {
    console.error(`install-local failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// launchd agents
//
// Two agents, following the convention already on this machine in
// com.adarsh.becominggod.dailypush.plist: absolute paths everywhere (launchd
// inherits no shell environment) and stdout/stderr to a log file.
//
//   com.adarsh.cp-mcp.server   — the loopback HTTP server, KeepAlive, for any
//                                local client that speaks Streamable HTTP.
//   com.adarsh.cp-mcp.refresh  — nightly cache warm at 04:00.
//
// The HTTP daemon is deliberately NOT registered as a second Claude Code
// server. Claude Code and Claude Desktop reach cp-mcp over stdio; adding the
// same 17 tools again over HTTP would just duplicate every tool in the
// client's list. The daemon exists for everything else local — other MCP
// clients, curl, scripts.
// ---------------------------------------------------------------------------

export function launchAgentsDir(): string {
  return path.join(os.homedir(), "Library", "LaunchAgents");
}

export function cpMcpHome(): string {
  return path.join(os.homedir(), ".cp-mcp");
}

/**
 * Read the daemon's auth token, generating and persisting one on first run.
 * Persisted (0600) rather than regenerated, so re-running the installer does
 * not silently invalidate a token the user has already configured elsewhere.
 */
export function ensureAuthToken(tokenPath: string): string {
  if (fs.existsSync(tokenPath)) {
    const existing = fs.readFileSync(tokenPath, "utf8").trim();
    if (existing.length > 0) return existing;
  }
  const token = randomBytes(24).toString("hex");
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, token + "\n", { encoding: "utf8", mode: 0o600 });
  return token;
}

function plistEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function plistDict(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([k, v]) => `      <key>${plistEscape(k)}</key>\n      <string>${plistEscape(v)}</string>`)
    .join("\n");
}

function plistArgs(args: string[]): string {
  return args.map((a) => `      <string>${plistEscape(a)}</string>`).join("\n");
}

export function buildServerPlist(
  label: string,
  args: string[],
  env: Record<string, string>,
  logPath: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plistEscape(label)}</string>

    <key>ProgramArguments</key>
    <array>
${plistArgs(args)}
    </array>

    <key>EnvironmentVariables</key>
    <dict>
${plistDict(env)}
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>${plistEscape(logPath)}</string>

    <key>StandardErrorPath</key>
    <string>${plistEscape(logPath)}</string>
</dict>
</plist>
`;
}

export function buildRefreshPlist(
  label: string,
  args: string[],
  env: Record<string, string>,
  logPath: string,
  hour: number
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plistEscape(label)}</string>

    <key>ProgramArguments</key>
    <array>
${plistArgs(args)}
    </array>

    <key>EnvironmentVariables</key>
    <dict>
${plistDict(env)}
    </dict>

    <key>StartCalendarInterval</key>
    <dict>
      <key>Hour</key>
      <integer>${String(hour)}</integer>
      <key>Minute</key>
      <integer>0</integer>
    </dict>

    <key>RunAtLoad</key>
    <false/>

    <key>StandardOutPath</key>
    <string>${plistEscape(logPath)}</string>

    <key>StandardErrorPath</key>
    <string>${plistEscape(logPath)}</string>
</dict>
</plist>
`;
}

export interface AgentResult {
  label: string;
  action: "installed" | "unchanged" | "failed";
  detail: string;
}

/**
 * Write the plist and (re)load it. Idempotent: identical content is left
 * alone, so re-running does not bounce a healthy daemon.
 */
export function installLaunchAgent(
  label: string,
  plist: string,
  agentsDir: string,
  // KeepAlive agents need an explicit kickstart: `bootstrap` loads the job but
  // does not reliably start it, which left the daemon "not running / never
  // exited" with an empty log. Calendar-interval agents must NOT be kickstarted
  // — that would run the nightly refresh immediately, at install time.
  start = false,
  runner: CommandRunner = defaultRunner
): AgentResult {
  const target = path.join(agentsDir, `${label}.plist`);
  const uid = String(process.getuid ? process.getuid() : 0);

  if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === plist) {
    return { label, action: "unchanged", detail: `${target} (already current)` };
  }

  fs.mkdirSync(agentsDir, { recursive: true });
  fs.writeFileSync(target, plist, "utf8");

  // bootout first so a changed plist is actually re-read; it fails harmlessly
  // when the agent was never loaded, which is why its status is ignored.
  runner("/bin/launchctl", ["bootout", `gui/${uid}/${label}`]);
  const res = runner("/bin/launchctl", ["bootstrap", `gui/${uid}`, target]);
  if (res.status !== 0) {
    return {
      label,
      action: "failed",
      detail: `wrote ${target} but launchctl bootstrap failed: ${res.stderr.trim() || res.stdout.trim()}`,
    };
  }
  if (start) {
    const kick = runner("/bin/launchctl", ["kickstart", "-k", `gui/${uid}/${label}`]);
    if (kick.status !== 0) {
      return {
        label,
        action: "failed",
        detail: `bootstrapped ${target} but kickstart failed: ${kick.stderr.trim() || kick.stdout.trim()}`,
      };
    }
  }

  return { label, action: "installed", detail: target };
}
