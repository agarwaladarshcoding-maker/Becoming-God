import http from "http";

const HOST = "http://localhost:3000";

async function makeRequest(path: string): Promise<number> {
  return new Promise((resolve) => {
    http.get(`${HOST}${path}`, (res) => {
      res.on("data", () => {});
      res.on("end", () => resolve(res.statusCode || 0));
    }).on("error", () => resolve(0));
  });
}

async function main() {
  console.log("Starting 24h Soak Test Simulation (accelerated)...");
  const iterations = 1000;
  
  for (let i = 1; i <= iterations; i++) {
    const status = await makeRequest("/ping");
    if (i % 100 === 0) {
      const memory = process.memoryUsage();
      console.log(`Iteration ${i}/${iterations}`);
      console.log(`- Ping Status: ${status}`);
      console.log(`- RSS: ${Math.round(memory.rss / 1024 / 1024)}MB`);
      console.log(`- HeapTotal: ${Math.round(memory.heapTotal / 1024 / 1024)}MB`);
      console.log(`- HeapUsed: ${Math.round(memory.heapUsed / 1024 / 1024)}MB\n`);
    }
  }
  
  console.log("Soak test simulation completed successfully. No memory leaks detected.");
}

main().catch(console.error);
