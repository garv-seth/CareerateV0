import { z } from 'zod';
import { exec } from 'child_process';
import { BaseTool, ITool, IToolSchema } from './BaseTool';

// Define the schema for the ShellTool's input and output
const shellSchema: IToolSchema = {
  input: z.object({
    command: z.string().describe("The shell command to execute."),
  }),
  output: z.object({
    stdout: z.string().describe("The standard output from the command."),
    stderr: z.string().describe("The standard error from the command, if any."),
  }),
};

// The ShellTool class for executing shell commands
export class ShellTool extends BaseTool implements ITool {
  constructor() {
    super(
      'shell', 
      'Executes a shell command in a sandboxed environment.', 
      shellSchema
    );
  }

  // Execute the shell command
  async execute(
    input: z.infer<typeof shellSchema.input>
  ): Promise<z.infer<typeof shellSchema.output>> {
    const validatedInput = this.validateInput(input);
    const { command } = validatedInput;

    // Security: Basic command validation to prevent obvious abuse
    // In a real-world scenario, this would be far more robust.
    const forbiddenCommands = ['rm -rf', '>', '<', '|', '&'];
    if (forbiddenCommands.some(forbidden => command.includes(forbidden))) {
      return { stdout: '', stderr: 'Error: Command contains forbidden characters.' };
    }

    return new Promise((resolve) => {
      exec(command, { timeout: 10000, shell: '/bin/sh' }, (error, stdout, stderr) => {
        if (error) {
          // Resolve with the error message in stderr, don't reject the promise
          resolve({ stdout, stderr: stderr || error.message });
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  }
} 