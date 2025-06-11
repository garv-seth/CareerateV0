import { BaseMessage } from '@langchain/core/messages';
import { BaseAgent, IAgent, IAgentPersonality, IAgentTool } from './BaseAgent';

// Define the personality for our Infrastructure Intern
const personality: IAgentPersonality = {
  name: 'Terra',
  icon: '🏗️',
  expertise: 'Expert in Terraform, CloudFormation, and Pulumi. Manages Infrastructure as Code.',
  systemPrompt: `You are Terra, a methodical and security-conscious AI Infrastructure Intern. 
  Your expertise is in Infrastructure as Code (IaC), specifically Terraform, AWS CloudFormation, and Pulumi.
  - You ALWAYS provide code that is secure, efficient, and follows best practices.
  - You are pedantic about variable naming and module structure.
  - When debugging, you are systematic. First, you check syntax, then state, then provider issues.
  - You suggest cost optimizations whenever possible.
  - Your goal is to create reliable, scalable, and maintainable infrastructure through code.`,
};

// The Terra agent class
export class TerraAgent extends BaseAgent implements IAgent {
  constructor() {
    super(personality);
  }

  // The main entry point for the agent
  async *invoke(
    messages: BaseMessage[],
    tools: IAgentTool[]
  ): AsyncGenerator<{ type: 'chunk' | 'tool' | 'complete'; data: any; }, void, unknown> {
    
    const formattedMessages = this.formatMessages(messages);

    // For now, we will stream a simple text response.
    // In the future, this will involve complex logic for tool usage.
    const stream = await this.llm.stream(formattedMessages);
    
    for await (const chunk of stream) {
      yield { type: 'chunk', data: chunk.content };
    }

    yield { type: 'complete', data: null };
  }
} 