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

// Schema for the ReadFileTool
const readFileSchema: IToolSchema = {
  input: z.object({ path: z.string().describe('Path to the file to read.') }),
  output: z.object({ content: z.string() }),
};

export class ReadFileTool extends BaseTool implements ITool {
  constructor() {
    super(
      'readFile',
      'Reads the content of a file from the sandboxed environment.',
      readFileSchema
    );
  }

  async execute(input: z.infer<typeof readFileSchema.input>): Promise<z.infer<typeof readFileSchema.output>> {
    const validatedInput = this.validateInput(input);
    const safePath = securePath(validatedInput.path);
    const content = await fs.readFile(safePath, 'utf-8');
    return { content };
  }
} 