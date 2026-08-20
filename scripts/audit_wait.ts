import fs from "fs";
import { handleVerifySolvedCodeforces } from "../src/tools/verifySolvedCodeforces.js";
import { handleVerifySolvedAtcoder } from "../src/tools/verifySolvedAtcoder.js";
import { initDb, getDb } from "../src/cache/db.js";

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  initDb();

  const cfQueries = [
    { handle: "tourist", problems: ["1A", "4A", "158A", "71A", "123D", "9999Z"] }, 
    { handle: "Benq", problems: ["1A", "4A", "158A", "71A", "300A", "300B", "300C", "300D"] },
    { handle: "jiangly", problems: ["1A", "4A", "158A", "71A", "1500A", "1500B", "1500C", "1500D"] }
  ];

  const acQueries = [
    { handle: "tourist", problems: ["abc001_1", "abc001_2", "abc001_3", "abc001_4", "agc001_a", "agc001_b"] },
    { handle: "ksn", problems: ["abc001_1", "abc001_2", "abc001_3", "abc001_4", "agc001_a", "agc001_b"] },
    { handle: "chokudai", problems: ["abc001_1", "abc001_2", "abc001_3", "abc001_4", "agc001_a", "agc001_b"] }
  ];

  // Wait for CF background syncs
  for (const q of cfQueries) {
    while (true) {
      const res = await handleVerifySolvedCodeforces(q);
      const structured = (res as any).structuredContent;
      if (!structured.partial) break;
      console.log(`Waiting for CF sync to finish for ${q.handle}...`);
      await sleep(10000);
    }
  }

  // Wait for AC background syncs
  for (const q of acQueries) {
    while (true) {
      const res = await handleVerifySolvedAtcoder(q);
      const structured = (res as any).structuredContent;
      if (!structured.partial) break;
      console.log(`Waiting for AC sync to finish for ${q.handle}...`);
      await sleep(10000);
    }
  }

  let output = "# M4 Verification Audit Checklist\n\n";
  output += "Please manually verify the following against the respective site UIs to ensure 100% accuracy.\n\n";

  let counter = 1;
  output += "## Codeforces\n\n";
  for (const q of cfQueries) {
    const res = await handleVerifySolvedCodeforces(q);
    const structured = (res as any).structuredContent;
    for (const r of structured.results) {
      if ("error" in r) {
        output += `- [ ] ${counter++}. **${q.handle}** on \`${r.input}\` -> ERROR: ${r.error}\n`;
      } else {
        output += `- [ ] ${counter++}. **${q.handle}** on \`${r.result.problemId}\` -> Status: **${r.result.status}**, Attempts: **${r.result.attempts}**, First AC: **${r.result.firstAcAt ? r.result.firstAcAt.substring(0,16) : "None"}** (Verdicts: ${r.result.distinctVerdicts.join(", ")})\n`;
      }
    }
  }

  output += "\n## AtCoder\n\n";
  for (const q of acQueries) {
    const res = await handleVerifySolvedAtcoder(q);
    const structured = (res as any).structuredContent;
    for (const r of structured.results) {
       if ("error" in r) {
        output += `- [ ] ${counter++}. **${q.handle}** on \`${r.input}\` -> ERROR: ${r.error}\n`;
      } else {
        output += `- [ ] ${counter++}. **${q.handle}** on \`${r.result.problemId}\` -> Status: **${r.result.status}**, Attempts: **${r.result.attempts}**, First AC: **${r.result.firstAcAt ? r.result.firstAcAt.substring(0,16) : "None"}** (Verdicts: ${r.result.distinctVerdicts.join(", ")})\n`;
      }
    }
  }

  fs.writeFileSync("audit_results.md", output);
  console.log("Wrote audit_results.md");
  process.exit(0);
}

main().catch(console.error);
