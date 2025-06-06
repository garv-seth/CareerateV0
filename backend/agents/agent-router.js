import TerraformAgent from './terraform-agent.js';
import KubernetesAgent from './kubernetes-agent.js';
import MonitoringAgent from './monitoring-agent.js';
import IncidentAgent from './incident-agent.js';

class AgentRouter {
  constructor(llmService) {
    this.agents = {
      'terraform': new TerraformAgent(llmService),
      'kubernetes': new KubernetesAgent(llmService),
      'monitoring': new MonitoringAgent(llmService),
      'incident': new IncidentAgent(llmService),
    };
  }

  static scoreRelevance(query, keyword) {
    return query.toLowerCase().includes(keyword) ? 1 : 0;
  }

  selectBestAgent(userQuery) {
    const agentScores = Object.keys(this.agents).map(agentName => ({
      name: agentName,
      confidence: AgentRouter.scoreRelevance(userQuery, agentName),
    }));

    agentScores.sort((a, b) => b.confidence - a.confidence);
    
    const bestAgentName = agentScores[0].confidence > 0 ? agentScores[0].name : 'incident'; // Default to incident agent
    return this.agents[bestAgentName];
  }

  async route(query, context) {
    const bestAgent = this.selectBestAgent(query);
    return bestAgent.process(query, context);
  }
}

export default AgentRouter; 