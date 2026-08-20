import fs from "fs";
import { handleVerifySolvedCodeforces } from "../src/tools/verifySolvedCodeforces.js";
import { handleVerifySolvedAtcoder } from "../src/tools/verifySolvedAtcoder.js";
import { initDb } from "../src/cache/db.js";

async function main() {
  initDb();

  const cfQueries = [
    { handle: "tourist", problems: ["1A", "4A", "158A", "71A", "123D", "9999Z"] }, // 9999Z doesn't exist
    { handle: "Benq", problems: ["1A", "4A", "158A", "71A", "300A", "300B", "300C", "300D"] },
    { handle: "jiangly", problems: ["1A", "4A", "158A", "71A", "1500A", "1500B", "1500C", "1500D"] }
  ];

  const acQueries = [
    { handle: "tourist", problems: ["abc001_1", "abc001_2", "abc001_3", "abc001_4", "agc001_a", "agc001_b"] },
    { handle: "ksn", problems: ["abc001_1", "abc001_2", "abc001_3", "abc001_4", "agc001_a", "agc001_b"] },
    { handle: "chokudai", problems: ["abc001_1", "abc001_2", "abc001_3", "abc001_4", "agc001_a", "agc001_b"] }
  ];

  let output = "# M4 Verification Audit Checklist\n\n";
  output += "Please manually verify the following against the respective site UIs to ensure 100% accuracy.\n\n";

  let counter = 1;

  output += "## Codeforces\n\n";
  for (const q of cfQueries) {
    try {
      console.log(`Running CF audit for ${q.handle}...`);
      const res = await handleVerifySolvedCodeforces(q);
      const structured = (res as any).structuredContent;
      
      for (const r of structured.results) {
        if ("error" in r) {
          output += `- [ ] ${counter++}. **${q.handle}** on \`${r.input}\` -> ERROR: ${r.error}\n`;
        } else {
          output += `- [ ] ${counter++}. **${q.handle}** on \`${r.result.problemId}\` -> Status: **${r.result.status}**, Attempts: **${r.result.attempts}**, First AC: **${r.result.firstAcAt ? r.result.firstAcAt.substring(0,16) : "None"}** (Verdicts: ${r.result.distinctVerdicts.join(", ")})\n`;
        }
      }
    } catch (e) {
      console.error("Error running CF audit for " + q.handle, e);
    }
  }

  output += "\n## AtCoder\n\n";
  for (const q of acQueries) {
    try {
      console.log(`Running AC audit for ${q.handle}...`);
      const res = await handleVerifySolvedAtcoder(q);
      const structured = (res as any).structuredContent;

      for (const r of structured.results) {
         if ("error" in r) {
          output += `- [ ] ${counter++}. **${q.handle}** on \`${r.input}\` -> ERROR: ${r.error}\n`;
        } else {
          output += `- [ ] ${counter++}. **${q.handle}** on \`${r.result.problemId}\` -> Status: **${r.result.status}**, Attempts: **${r.result.attempts}**, First AC: **${r.result.firstAcAt ? r.result.firstAcAt.substring(0,16) : "None"}** (Verdicts: ${r.result.distinctVerdicts.join(", ")})\n`;
        }
      }
    } catch (e) {
      console.error("Error running AC audit for " + q.handle, e);
    }
  }

  fs.writeFileSync("audit_results.md", output);
  console.log("Wrote audit_results.md");
}

main().catch(console.error);
