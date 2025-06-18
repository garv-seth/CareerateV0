import { Agent, AgentResponse } from "@careerate/types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { model } from "./llm";
import { agents as agentDefinitions } from "@careerate/agents";

// A map for easy lookup
const agentMap = new Map<string, Agent>(
  agentDefinitions.map((agent: Agent) => [agent.id, agent])
);

async function runAgent(agentId: string, query: string, context: any): Promise<AgentResponse> {
  const agent = agentMap.get(agentId);
  if (!agent) {
    throw new Error(`Agent with id ${agentId} not found.`);
  }

  const systemPrompt = `You are ${agent.name}, an AI assistant with the specialty of ${agent.specialty}. 
Your personality is: ${agent.personality.description}.
Your expertise level is ${agent.personality.expertise_level}.
Your communication style is ${agent.personality.communicationStyle}.
Your quirks are: ${agent.personality.quirks.join(', ')}.

Your capabilities are:
- ${agent.capabilities.join('\n- ')}

A user has the following query: "${query}"

Additional context for the query is:
${JSON.stringify(context, null, 2)}

Based on your personality and capabilities, provide a concise and actionable response.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(query),
  ];

  console.log(`Invoking ${agent.name} (${agent.id}) for query: ${query}`);
  const response = await model.invoke(messages);

  return {
    agentId: agent.id,
    content: response.content.toString(),
  };
}


export const terraAgent = {
  process: (query: string, context: any) => runAgent("terra", query, context),
};

export const kubeAgent = {
  process: (query: string, context: any) => runAgent("kube", query, context),
};

export const cloudAgent = {
  process: (query: string, context: any) => runAgent("cloud", query, context),
};

export const rapidAgent = {
  process: (query: string, context: any) => runAgent("rapid", query, context),
}; 