import { ITool } from '../tools/BaseTool';
import { ShellTool } from '../tools/ShellTool';
import { ReadFileTool } from '../tools/ReadFileTool';
import { WriteFileTool } from '../tools/WriteFileTool';
import { ListFilesTool } from '../tools/ListFilesTool';

export class ToolManager {
  private tools: Map<string, ITool>;

  constructor() {
    this.tools = new Map<string, ITool>();
    this.registerTools();
  }

  private registerTools() {
    const shellTool = new ShellTool();
    this.tools.set(shellTool.name, shellTool);

    const readFileTool = new ReadFileTool();
    this.tools.set(readFileTool.name, readFileTool);

    const writeFileTool = new WriteFileTool();
    this.tools.set(writeFileTool.name, writeFileTool);

    const listFilesTool = new ListFilesTool();
    this.tools.set(listFilesTool.name, listFilesTool);

    // Add more tools here as they are developed (e.g., Kubernetes, AWS, etc.)
  }

  public getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  // This method provides the tools in a format compatible with LangChain's .withTools()
  public getLangChainTools() {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.schema.input.strip()._def.shape(),
    }));
  }
} 