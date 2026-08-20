import { handleVerifySolvedCodeforces } from "../src/tools/verifySolvedCodeforces.js";
import { initDb } from "../src/cache/db.js";

async function main() {
  initDb();
  console.log(await handleVerifySolvedCodeforces({ handle: "tourist", problems: ["1A", "4A"] }));
}
main().catch(console.error);
