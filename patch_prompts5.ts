import fs from 'fs';

const serverFile = 'src/server.ts';
let content = fs.readFileSync(serverFile, 'utf-8');

// Replace the previous prompts injection. I'll just replace the whole section.
const newPrompts = `
  // Register MCP Prompts

  server.prompt(
    "daily_ladder_codeforces",
    "Generates instructions to create a daily Codeforces practice ladder based on the user's weaknesses.",
    { handle: z.string().describe("Codeforces handle") as any },
    ({ handle }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: \`Generate a daily Codeforces practice ladder for the user '\${handle}'. 
Please do the following:
1. Run cp_analyze_weaknesses_codeforces for '\${handle}' to identify their weakest tags.
2. Run cp_search_problems_codeforces using the weakest tags, targeting a difficulty slightly above their current rating (or 1300-1500 if unknown). Exclude problems they have already solved.
3. Present the 3-5 selected problems as today's ladder.\`
          }
        }
      ]
    })
  );

  server.prompt(
    "daily_ladder_atcoder",
    "Generates instructions to create a daily AtCoder practice ladder based on the user's weaknesses.",
    { handle: z.string().describe("AtCoder handle") as any },
    ({ handle }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: \`Generate a daily AtCoder practice ladder for the user '\${handle}'. 
Please do the following:
1. Run cp_analyze_weaknesses_atcoder for '\${handle}' to identify their weakest difficulty bands.
2. Run cp_search_problems_atcoder targeting a difficulty slightly above their current level (or 800-1200 if unknown). Exclude problems they have already solved.
3. Present the 3-5 selected problems as today's ladder.\`
          }
        }
      ]
    })
  );

  server.prompt(
    "audit_yesterday_codeforces",
    "Generates instructions to verify if the user solved yesterday's assigned Codeforces problems.",
    { 
      handle: z.string().describe("Codeforces handle") as any, 
      problems: z.string().describe("Comma-separated list of problem IDs") as any 
    },
    ({ handle, problems }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: \`Audit yesterday's Codeforces ladder for '\${handle}'. 
The assigned problems were: \${problems}.
Please run cp_verify_solved_codeforces on these problems.
Report which ones were successfully solved, which were attempted but not solved, and which were untouched.\`
          }
        }
      ]
    })
  );

  server.prompt(
    "audit_yesterday_atcoder",
    "Generates instructions to verify if the user solved yesterday's assigned AtCoder problems.",
    { 
      handle: z.string().describe("AtCoder handle") as any, 
      problems: z.string().describe("Comma-separated list of problem IDs") as any 
    },
    ({ handle, problems }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: \`Audit yesterday's AtCoder ladder for '\${handle}'. 
The assigned problems were: \${problems}.
Please run cp_verify_solved_atcoder on these problems.
Report which ones were successfully solved, which were attempted but not solved, and which were untouched.\`
          }
        }
      ]
    })
  );
`;

const startIdx = content.indexOf('// Register MCP Prompts');
const endIdx = content.lastIndexOf('return server;');
if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newPrompts + '\n  ' + content.substring(endIdx);
} else {
  // append
  content = content.replace('return server;', newPrompts + '\n  return server;');
}

fs.writeFileSync(serverFile, content);
