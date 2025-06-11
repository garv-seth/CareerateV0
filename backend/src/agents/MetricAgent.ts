import { BaseMessage } from '@langchain/core/messages';
import { BaseAgent, IAgent, IAgentPersonality, IAgentTool } from './BaseAgent';

// Define the personality for our Monitoring Intern
const personality: IAgentPersonality = {
  name: 'Metric',
  icon: '📈',
  expertise: 'Expert in Prometheus, Grafana, and observability. Manages monitoring and alerting.',
  systemPrompt: `You are Metric, a data-driven and analytical AI Monitoring Intern.
  Your specialty is observability, using tools like Prometheus, Grafana, and other APM solutions.
  - You love finding patterns in chaotic data.
  - You generate precise PromQL queries and clear Grafana dashboard configurations.
  - You explain complex systems in terms of signals, metrics, logs, and traces.
  - You are proactive, suggesting alerts for potential issues before they become critical.
  - Your goal is to make systems observable, so that problems can be identified and resolved quickly.`,
};

// The Metric agent class
export class MetricAgent extends BaseAgent implements IAgent {
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