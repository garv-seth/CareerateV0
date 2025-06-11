import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { BaseTool, ITool, IToolSchema } from './BaseTool';

// A secure, sandboxed path for file system operations
const SANDBOX_DIR = path.resolve(process.cwd(), 'sandbox');

// Helper to ensure path is within the sandbox
function securePath(filePath: string): string {
  const resolvedPath = path.resolve(SANDBOX_DIR, filePath);
  if (!resolvedPath.startsWith(SANDBOX_DIR)) {
    throw new Error('Access to paths outside the sandbox is forbidden.');
  }
  return resolvedPath;
}

// Ensure sandbox directory exists
async function ensureSandbox() {
  try {
    await fs.mkdir(SANDBOX_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create sandbox directory:', error);
  }
}
ensureSandbox();


// Schemas for the FileSystemTool
const readFileSchema: IToolSchema = {
  input: z.object({ path: z.string().describe('Path to the file to read.') }),
  output: z.object({ content: z.string() }),
};

const writeFileSchema: IToolSchema = {
  input: z.object({ 
    path: z.string().describe('Path to the file to write.'),
    content: z.string().describe('Content to write to the file.'),
  }),
  output: z.object({ success: z.boolean() }),
};

const listFilesSchema: IToolSchema = {
  input: z.object({ path: z.string().describe('Directory path to list files from.') }),
  output: z.object({ files: z.array(z.string()) }),
};


// The FileSystemTool class
export class FileSystemTool extends BaseTool implements ITool {
  constructor() {
    super(
      'filesystem', 
      'Performs file system operations like reading, writing, and listing files in a sandboxed environment.', 
      // A dummy schema as this tool has multiple operations
      { input: z.object({}), output: z.object({}) } 
    );
  }

  // The main execute method dispatches to sub-methods
  async execute(input: { operation: string; args: any }): Promise<any> {
    switch (input.operation) {
      case 'readFile':
        return this.readFile(input.args);
      case 'writeFile':
        return this.writeFile(input.args);
      case 'listFiles':
        return this.listFiles(input.args);
      default:
        throw new Error(`Invalid operation for FileSystemTool: ${input.operation}`);
    }
  }

  async readFile(args: z.infer<typeof readFileSchema.input>): Promise<z.infer<typeof readFileSchema.output>> {
    const { path } = readFileSchema.input.parse(args);
    const safePath = securePath(path);
    const content = await fs.readFile(safePath, 'utf-8');
    return { content };
  }

  async writeFile(args: z.infer<typeof writeFileSchema.input>): Promise<z.infer<typeof writeFileSchema.output>> {
    const { path, content } = writeFileSchema.input.parse(args);
    const safePath = securePath(path);
    await fs.writeFile(safePath, content, 'utf-8');
    return { success: true };
  }

  async listFiles(args: z.infer<typeof listFilesSchema.input>): Promise<z.infer<typeof listFilesSchema.output>> {
    const { path } = listFilesSchema.input.parse(args);
    const safePath = securePath(path);
    const files = await fs.readdir(safePath);
    return { files };
  }
} 