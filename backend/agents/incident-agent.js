import BaseAgent from './base-agent.js';

class IncidentAgent extends BaseAgent {
  constructor(llmService) {
    super(llmService);
  }

  async process(query, context) {
    // TODO: Implement incident-response-specific logic
    console.log("Processing incident query:", query);

    const prompt = `
      Context: ${JSON.stringify(context)}
      Query: ${query}
      
      Provide guidance for incident response based on the query.
    `;
    
    return this.llmService.generate(prompt);
  }
}

export default IncidentAgent; 