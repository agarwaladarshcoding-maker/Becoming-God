import fs from 'fs';

const serverFile = 'src/server.ts';
let content = fs.readFileSync(serverFile, 'utf-8');

// Add imports
const cfImport = `import { analyzeWeaknessesCodeforcesSchema, handleAnalyzeWeaknessesCodeforces } from "./tools/analyzeWeaknessesCodeforces.js";\n`;
const acImport = `import { analyzeWeaknessesAtcoderSchema, handleAnalyzeWeaknessesAtcoder } from "./tools/analyzeWeaknessesAtcoder.js";\n`;

content = content.replace('import { getProblemAtcoderSchema', cfImport + acImport + 'import { getProblemAtcoderSchema');

// Add Codeforces registration
const cfReg = `
  // Register cp_analyze_weaknesses_codeforces tool
  registerCpTool(
    server,
    "cp_analyze_weaknesses_codeforces",
    {
      description:
        "Analyze a Codeforces user's weaknesses by grouping their attempted and solved problems by tags. Calculates solve rate and average attempts per tag. Useful for identifying topics to practice.",
      inputSchema: analyzeWeaknessesCodeforcesSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleAnalyzeWeaknessesCodeforces
  );
`;

content = content.replace('// Register getSubmissions tools', cfReg + '\n  // Register getSubmissions tools');

// Add AtCoder registration
const acReg = `
  // Register cp_analyze_weaknesses_atcoder tool
  registerCpTool(
    server,
    "cp_analyze_weaknesses_atcoder",
    {
      description:
        "Analyze an AtCoder user's weaknesses by grouping their attempted and solved problems by difficulty band. Calculates solve rate and average attempts per band.",
      inputSchema: analyzeWeaknessesAtcoderSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    handleAnalyzeWeaknessesAtcoder
  );
`;

content = content.replace('registerGetSubmissionsAtcoder(server);', 'registerGetSubmissionsAtcoder(server);\n' + acReg);

fs.writeFileSync(serverFile, content);
