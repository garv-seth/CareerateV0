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

// Schema for the WriteFileTool
const writeFileSchema: IToolSchema = {
  input: z.object({
    path: z.string().describe('Path to the file to write.'),
    content: z.string().describe('Content to write to the file.'),
  }),
  output: z.object({ success: z.boolean() }),
};

export class WriteFileTool extends BaseTool implements ITool {
  constructor() {
    super(
      'writeFile',
      'Writes content to a file in the sandboxed environment.',
      writeFileSchema
    );
  }

  async execute(input: z.infer<typeof writeFileSchema.input>): Promise<z.infer<typeof writeFileSchema.output>> {
    const validatedInput = this.validateInput(input);
    const { path, content } = validatedInput;
    const safePath = securePath(path);
    await fs.writeFile(safePath, content, 'utf-8');
    return { success: true };
  }
} 