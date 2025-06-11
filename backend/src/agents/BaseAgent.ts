import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

// Defines the tools an agent can use (e.g., AWS CLI, kubectl)
export interface IAgentTool {
  name: string;
  description: string;
  // A function that executes the tool with given arguments
  execute(args: any): Promise<string>;
}

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
    tools: IAgentTool[]
  ): AsyncGenerator<{ type: 'chunk' | 'tool' | 'complete', data: any }, void, unknown>;
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

  // The `invoke` method must be implemented by each specialized agent
  abstract invoke(
    messages: BaseMessage[],
    tools: IAgentTool[]
  ): AsyncGenerator<{ type: 'chunk' | 'tool' | 'complete', data: any }, void, unknown>;
  
  // Helper to format messages for the LLM
  protected formatMessages(messages: BaseMessage[]): BaseMessage[] {
    return [new SystemMessage(this.personality.systemPrompt), ...messages];
  }
} 