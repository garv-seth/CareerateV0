"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRunners = void 0;
const messages_1 = require("@langchain/core/messages");
const llm_1 = require("./llm");
const agents_1 = require("@careerate/agents");
const tools_1 = require("../tools");
// A map for easy lookup
const agentMap = new Map(agents_1.agents.map((agent) => [agent.id, agent]));
function createAgentRunner(agentId) {
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
        new messages_1.SystemMessage(systemPrompt),
        new messages_1.HumanMessage("{input}"),
        new messages_1.AIMessage("{agent_scratchpad}"),
    ];
    // This is a key step: binding the tools to the model tells the LLM how to call them.
    return llm_1.model.bindTools(tools_1.tools);
}
exports.agentRunners = {
    terra: createAgentRunner("terra"),
    kube: createAgentRunner("kube"),
    cloud: createAgentRunner("cloud"),
    rapid: createAgentRunner("rapid"),
};
//# sourceMappingURL=agents.js.map