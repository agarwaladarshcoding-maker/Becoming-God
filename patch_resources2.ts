import fs from 'fs';

const serverFile = 'src/server.ts';
let content = fs.readFileSync(serverFile, 'utf-8');

// replace the fake URLTemplate that I injected with ResourceTemplate, and add the import if needed.
if (!content.includes('ResourceTemplate')) {
  content = content.replace('McpServer,\n  ToolCallback,', 'McpServer,\n  ToolCallback,\n  ResourceTemplate,');
}

content = content.replace(/new URLTemplate/g, 'new ResourceTemplate');

fs.writeFileSync(serverFile, content);
