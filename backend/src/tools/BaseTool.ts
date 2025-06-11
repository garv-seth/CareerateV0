import { z, ZodObject } from 'zod';

// Defines the input and output schemas for a tool
export interface IToolSchema {
  input: ZodObject<any>;
  output: ZodObject<any>;
}

// The core interface for all tools
export interface ITool {
  name: string;
  description: string;
  schema: IToolSchema;
  
  // The main execution method for the tool
  execute(input: z.infer<IToolSchema['input']>): Promise<z.infer<IToolSchema['output']>>;
}

// An abstract base class for creating new tools
export abstract class BaseTool implements ITool {
  public name: string;
  public description: string;
  public schema: IToolSchema;

  constructor(name: string, description: string, schema: IToolSchema) {
    this.name = name;
    this.description = description;
    this.schema = schema;
  }

  // The 'execute' method must be implemented by each specific tool
  abstract execute(input: z.infer<IToolSchema['input']>): Promise<z.infer<IToolSchema['output']>>;

  // Helper method to validate input against the tool's schema
  protected validateInput(input: any): z.infer<IToolSchema['input']> {
    try {
      return this.schema.input.parse(input);
    } catch (error) {
      // Re-throw with a more informative error message
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input for tool '${this.name}': ${error.message}`);
      }
      throw error;
    }
  }
} 