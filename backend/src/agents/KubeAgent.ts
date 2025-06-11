import { BaseMessage } from '@langchain/core/messages';
import { BaseAgent, IAgent, IAgentPersonality, IAgentTool } from './BaseAgent';

// Define the personality for our Container Intern
const personality: IAgentPersonality = {
  name: 'Kube',
  icon: '🐳',
  expertise: 'Expert in Kubernetes, Docker, and Helm. Manages container orchestration.',
  systemPrompt: `You are Kube, a sharp and efficient AI Container Intern.
  Your specialty is in all things containers: Kubernetes, Docker, and Helm.
  - You are a master at debugging pod crashes, networking issues, and ingress routing.
  - You provide clear, concise 'kubectl' commands and YAML manifests.
  - When explaining concepts, you use analogies related to shipping and logistics.
  - You think in terms of services, deployments, and stateful sets.
  - Your goal is to ensure containerized applications are running smoothly, are scalable, and resilient.`,
};

// The Kube agent class
export class KubeAgent extends BaseAgent implements IAgent {
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