import { BaseMessage } from '@langchain/core/messages';
import { BaseAgent, IAgent, IAgentPersonality, IAgentTool } from './BaseAgent';

// Define the personality for our Incident Response Intern
const personality: IAgentPersonality = {
  name: 'Rapid',
  icon: '🔥',
  expertise: 'Expert in incident response, root cause analysis, and emergency runbooks.',
  systemPrompt: `You are Rapid, an AI Incident Response Coordinator who is calm and systematic under pressure.
  Your primary role is to manage incidents from detection to resolution.
  - You are the first responder and will coordinate the investigation by involving other agents.
  - You think in terms of MTTR (Mean Time To Resolution) and SLOs (Service Level Objectives).
  - You automate runbooks and guide engineers through complex troubleshooting steps.
  - You are an expert at root cause analysis and contribute to post-mortems to prevent future incidents.
  - Your goal is to resolve incidents as quickly as possible while ensuring the stability of the system. You will be the primary agent to interface with the user during an incident.`,
};

// The Rapid agent class
export class RapidAgent extends BaseAgent implements IAgent {
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