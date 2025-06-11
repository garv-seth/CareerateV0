import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ITool } from '../tools/BaseTool';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export type { ITool };

// Defines the personality and capabilities of an agent
export interface IAgentPersonality {
  // The agent's name (e.g., "Terra")
  name: string;
  // A description of the agent's expertise
  expertise: string;
  // The system prompt that defines the agent's behavior and personality
  systemPrompt: string;
  // Emojis or icons to represent the agent
  icon: string;
}

// The core interface for all specialized agents
export interface IAgent {
  personality: IAgentPersonality;
  
  // The main entry point for an agent to handle a request
  invoke(
    messages: BaseMessage[],
    tools: ITool[]
  ): AsyncGenerator<{ type: 'chunk' | 'tool_call' | 'tool_result' | 'complete'; data: any; }, void, unknown>;
}

// An abstract base class providing common functionality for all agents
export abstract class BaseAgent implements IAgent {
  public personality: IAgentPersonality;
  protected llm: ChatOpenAI | ChatAnthropic;

  constructor(personality: IAgentPersonality) {
    this.personality = personality;

    // Prioritize Anthropic for more creative/complex reasoning, fallback to OpenAI
    if (process.env.ANTHROPIC_API_KEY) {
      this.llm = new ChatAnthropic({
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        modelName: 'claude-3-sonnet-20240229',
        streaming: true,
        temperature: 0.7,
      });
    } else if (process.env.OPENAI_API_KEY) {
      this.llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4-turbo-preview',
        streaming: true,
        temperature: 0.7,
      });
    } else {
      throw new Error('No LLM API key provided for agent initialization.');
    }
  }

  // The main entry point for an agent, now with a ReAct loop
  async *invoke(
    messages: BaseMessage[],
    tools: ITool[]
  ): AsyncGenerator<{ type: 'chunk' | 'tool_call' | 'tool_result' | 'complete'; data: any; }, void, unknown> {
    
    let currentMessages = this.formatMessages(messages, tools);

    for (let i = 0; i < 5; i++) { // Limit to 5 iterations to prevent infinite loops
      const stream = await this.llm.stream(currentMessages, {
        tools: tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: zodToJsonSchema(t.schema.input, "ToolInput"),
          },
        })),
      });

      let fullResponse = '';
      let toolCalls: any[] = [];

      for await (const chunk of stream) {
        fullResponse += chunk.content;
        if (chunk.tool_calls) {
          toolCalls.push(...(chunk.tool_calls as any[]));
        }
        yield { type: 'chunk', data: chunk.content };
      }

      currentMessages.push(new AIMessage(fullResponse));

      if (toolCalls.length === 0) {
        break; // No tool calls, so we're done
      }

      for (const toolCall of toolCalls) {
        const tool = tools.find(t => t.name === toolCall.function.name);
        if (!tool) {
          yield { type: 'tool_result', data: { tool_call_id: toolCall.id, name: toolCall.function.name, result: 'Error: Tool not found' } };
          continue;
        }

        try {
          const args = JSON.parse(toolCall.function.arguments);
          yield { type: 'tool_call', data: { name: tool.name, args } };
          
          const result = await tool.execute(args);
          yield { type: 'tool_result', data: { tool_call_id: toolCall.id, name: tool.name, result } };
          
          currentMessages.push(new ToolMessage(JSON.stringify(result), toolCall.id));

        } catch (error) {
          const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
          yield { type: 'tool_result', data: { tool_call_id: toolCall.id, name: tool.name, result: `Error: ${errorMessage}` } };
        }
      }
    }

    yield { type: 'complete', data: null };
  }
  
  // Helper to format messages with tool definitions for the LLM
  protected formatMessages(messages: BaseMessage[], tools: ITool[]): BaseMessage[] {
    const toolDefs = tools.map(t => `${t.name}: ${t.description}`).join('\n');
    const systemPrompt = `${this.personality.systemPrompt}\n\nYou have access to the following tools:\n${toolDefs}\n\nYou must use these tools to answer the user's request.`;
    return [new SystemMessage(systemPrompt), ...messages];
  }
} 