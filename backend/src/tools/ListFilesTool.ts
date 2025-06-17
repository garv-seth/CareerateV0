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

// Schema for the ListFilesTool
const listFilesSchema: IToolSchema = {
  input: z.object({ path: z.string().describe('Directory path to list files from.') }),
  output: z.object({ files: z.array(z.string()) }),
};

export class ListFilesTool extends BaseTool implements ITool {
  constructor() {
    super(
      'listFiles',
      'Lists files and directories within a specified path in the sandboxed environment.',
      listFilesSchema
    );
  }

  async execute(input: z.infer<typeof listFilesSchema.input>): Promise<z.infer<typeof listFilesSchema.output>> {
    const validatedInput = this.validateInput(input);
    const safePath = securePath(validatedInput.path);
    const files = await fs.readdir(safePath);
    return { files };
  }
} 