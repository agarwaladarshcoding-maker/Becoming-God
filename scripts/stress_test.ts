import { handleGetUserCodeforces } from "../src/tools/getUserCodeforces.js";
import { handleSearchProblemsCodeforces } from "../src/tools/searchProblemsCodeforces.js";
import { syncUserSubmissions } from "../src/cache/sync.js";
import { initDb, closeDb } from "../src/cache/db.js";

async function run() {
  console.log("Initializing DB...");
  initDb(); // Ensure tables are created and PRAGMAs are set
  
  console.log("Starting stress test...");
  
  const handles = ["tourist", "Benq", "jiangly", "Radewoosh", "Petr", "Um_nik", "Errichto", "SecondThread", "ColinGalen", "Neal"];
  
  console.log("1. Concurrent handleGetUserCodeforces (100x)");
  const userPromises = [];
  for (let i = 0; i < 100; i++) {
    const handle = handles[i % handles.length];
    userPromises.push(
      handleGetUserCodeforces({ handle }).then(res => res.isError ? 0 : 1).catch(err => {
        console.error(`User error for ${handle}:`, err.message);
        return 0;
      })
    );
  }

  // We add AtCoder sync to test AtCoder rate limiters too
  console.log("2. Concurrent syncUserSubmissions for top users (10x Codeforces, 5x AtCoder)");
  const syncPromises = [];
  for (const handle of handles) {
    syncPromises.push(
      syncUserSubmissions("codeforces", handle).then(() => 1).catch(err => {
        console.error(`CF Sync error for ${handle}:`, err.message);
        return 0;
      })
    );
  }
  const acHandles = ["tourist", "chokudai", "ksn", "apiad", "wata"];
  for (const handle of acHandles) {
    syncPromises.push(
      syncUserSubmissions("atcoder", handle).then(() => 1).catch(err => {
        console.error(`AC Sync error for ${handle}:`, err.message);
        return 0;
      })
    );
  }

  console.log("3. Concurrent handleSearchProblemsCodeforces (50x)");
  const searchPromises = [];
  for (let i = 0; i < 50; i++) {
    searchPromises.push(
      handleSearchProblemsCodeforces({ minDifficulty: 1000 + (i * 10), maxDifficulty: 1200 + (i * 10) })
        .then(res => res.isError ? 0 : 1).catch(err => {
          console.error(`Search error:`, err.message);
          return 0;
        })
    );
  }

  console.log("Awaiting all promises...");
  const startTime = Date.now();
  const allResults = await Promise.all([...userPromises, ...syncPromises, ...searchPromises]);
  const endTime = Date.now();
  
  const successCount = allResults.filter(r => r === 1).length;
  console.log(`Stress test completed in ${(endTime - startTime) / 1000}s`);
  console.log(`Success: ${successCount} / ${allResults.length}`);

  closeDb();
}

run().catch(console.error);
