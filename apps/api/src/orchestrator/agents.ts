import { Agent, AgentResponse } from "@careerate/types";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { model } from "./llm";
import { agents as agentDefinitions } from "@careerate/agents";
import { tools } from "../tools";
import { Runnable } from "@langchain/core/runnables";

// A map for easy lookup
const agentMap = new Map<string, Agent>(
  agentDefinitions.map((agent: Agent) => [agent.id, agent])
);

function createAgentRunner(agentId: string): Runnable {
  const agent = agentMap.get(agentId);
  if (!agent) {
    throw new Error(`Agent with id ${agentId} not found.`);
  }

  const systemPrompt = `You are ${agent.name}, a specialized AI assistant.
Your personality: ${agent.personality.description}
Communication Style: ${agent.personality.communicationStyle}
Expertise: ${agent.specialty} (${agent.personality.expertise_level})
Capabilities: ${agent.capabilities.join(', ')}

You have access to a powerful web search tool. Use it to find the most current information to answer questions, especially if it involves competitor analysis or recent events.

When you have a final answer for the user, respond directly. Otherwise, you can use the search tool.`;

  const prompt = [
    new SystemMessage(systemPrompt),
    new HumanMessage("{input}"),
    new AIMessage("{agent_scratchpad}"),
  ];

  // This is a key step: binding the tools to the model tells the LLM how to call them.
  return model.bindTools(tools);
}

export const agentRunners = {
  terra: createAgentRunner("terra"),
  kube: createAgentRunner("kube"),
  cloud: createAgentRunner("cloud"),
  rapid: createAgentRunner("rapid"),
}; 