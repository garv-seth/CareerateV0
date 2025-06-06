import BaseAgent from './base-agent.js';

class MonitoringAgent extends BaseAgent {
  constructor(llmService) {
    super(llmService);
  }

  async process(query, context) {
    // TODO: Implement monitoring-specific logic
    console.log("Processing monitoring query:", query);

    const prompt = `
      Context: ${JSON.stringify(context)}
      Query: ${query}
      
      Generate a Prometheus query or Grafana dashboard configuration based on the query.
    `;
    
    return this.llmService.generate(prompt);
  }
}

export default MonitoringAgent; 