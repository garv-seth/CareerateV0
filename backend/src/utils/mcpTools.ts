import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export function createMCPTools(tools: MCPTool[], mcpClient: Client): any[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description || '',
    schema: tool.inputSchema ? z.object(tool.inputSchema.properties || {}) : z.object({}),
    execute: async (args: any) => {
      try {
        const result = await mcpClient.callTool({
          name: tool.name,
          arguments: args
        });
        
        if (result.isError) {
          throw new Error(result.content as string);
        }
        
        return result.content;
      } catch (error) {
        console.error(`Error executing MCP tool ${tool.name}:`, error);
        throw error;
      }
    }
  }));
} 