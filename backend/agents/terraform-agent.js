import BaseAgent from './base-agent.js';

class TerraformAgent extends BaseAgent {
  constructor(llmService) {
    super(llmService);
  }

  async process(query, context) {
    // TODO: Implement Terraform-specific logic
    console.log("Processing Terraform query:", query);
    
    const prompt = `
      Context: ${JSON.stringify(context)}
      Query: ${query}
      
      Generate a Terraform configuration based on the query.
    `;
    
    return this.llmService.generate(prompt);
  }
}

export default TerraformAgent; 