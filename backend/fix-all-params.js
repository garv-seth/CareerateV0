const fs = require('fs');

// Fix MCP routes
console.log('Fixing MCP routes...');
let mcpContent = fs.readFileSync('src/routes/mcp.ts', 'utf8');

// Replace all remaining serverId destructuring
mcpContent = mcpContent.replace(/const { serverId } = req\.params;/g, 'const serverId = req.params?.serverId as string;');

// Fix query parameter destructuring
mcpContent = mcpContent.replace(/const { limit = 100, level } = req\.query;/g, 'const limit = parseInt(req.query?.limit as string) || 100;\n      const level = (req.query?.level as string) || "info";');

fs.writeFileSync('src/routes/mcp.ts', mcpContent);
console.log('✅ Fixed MCP routes');

// Fix workspace routes
console.log('Fixing workspace routes...');
let workspaceContent = fs.readFileSync('src/routes/workspace.ts', 'utf8');

// Replace all workspaceId destructuring
workspaceContent = workspaceContent.replace(/const { workspaceId } = req\.params;/g, 'const workspaceId = req.params?.workspaceId as string;');

// Replace workspaceId and memberId destructuring
workspaceContent = workspaceContent.replace(/const { workspaceId, memberId } = req\.params;/g, 'const workspaceId = req.params?.workspaceId as string;\n      const memberId = req.params?.memberId as string;');

fs.writeFileSync('src/routes/workspace.ts', workspaceContent);
console.log('✅ Fixed workspace routes');

console.log('🎉 All parameter destructuring issues fixed!'); 