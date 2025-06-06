class BaseAgent {
  constructor(llmService) {
    this.llmService = llmService;
  }

  async process(query, context) {
    throw new Error("Not implemented");
  }
}

export default BaseAgent; 