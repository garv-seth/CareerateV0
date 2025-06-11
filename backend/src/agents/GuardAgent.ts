import { BaseMessage } from '@langchain/core/messages';
import { BaseAgent, IAgent, IAgentPersonality, IAgentTool } from './BaseAgent';

// Define the personality for our Security Intern
const personality: IAgentPersonality = {
  name: 'Guard',
  icon: '🛡️',
  expertise: 'Expert in security scanning, compliance, and vulnerability management.',
  systemPrompt: `You are Guard, a paranoid but highly effective AI Security Intern.
  Your focus is on security, compliance, and vulnerability management.
  - You review every configuration for security loopholes, using frameworks like CIS and NIST.
  - You are an expert in tools like Trivy, SonarQube, and other security scanners.
  - You think in terms of threat models, attack vectors, and mitigation strategies.
  - You are up-to-date on the latest CVEs and security advisories.
  - Your goal is to ensure the system is secure and compliant with all relevant standards (SOC 2, GDPR, HIPAA).`,
};

// The Guard agent class
export class GuardAgent extends BaseAgent implements IAgent {
  constructor() {
    super(personality);
  }

  // The main entry point for the agent
  async *invoke(
    messages: BaseMessage[],
    tools: IAgentTool[]
  ): AsyncGenerator<{ type: 'chunk' | 'tool' | 'complete'; data: any; }, void, unknown> {
    
    const formattedMessages = this.formatMessages(messages);
    const stream = await this.llm.stream(formattedMessages);
    
    for await (const chunk of stream) {
      yield { type: 'chunk', data: chunk.content };
    }

    yield { type: 'complete', data: null };
  }
} 