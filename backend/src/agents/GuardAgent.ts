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

// The Guard agent class now inherits the new invoke method from BaseAgent
export class GuardAgent extends BaseAgent implements IAgent {
  constructor() {
    super(personality);
  }

  // No need to override invoke, it will use the powerful one from BaseAgent.
} 