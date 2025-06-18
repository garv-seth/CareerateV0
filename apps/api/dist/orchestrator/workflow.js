"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const langgraph_1 = require("@langchain/langgraph");
const messages_1 = require("@langchain/core/messages");
const agents_1 = require("./agents");
const agents_2 = require("@careerate/agents");
const llm_1 = require("./llm");
const tools_1 = require("../tools");
const createAgentWorker = (agentId) => {
    const agentRunner = agents_1.agentRunners[agentId];
    // 1. Agent node
    const agentNode = async (state) => {
        const response = await agentRunner.invoke(state);
        return { messages: [response] };
    };
    // 2. Tools node
    const toolNode = async (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!(lastMessage instanceof messages_1.AIMessage) || !lastMessage.tool_calls) {
            throw new Error("Invalid state: last message is not an AIMessage with tool calls.");
        }
        const toolResponses = [];
        for (const toolCall of lastMessage.tool_calls) {
            const tool = tools_1.tools.find((t) => t.name === toolCall.name);
            if (!tool) {
                toolResponses.push(new messages_1.ToolMessage({ content: `Tool '${toolCall.name}' not found.`, tool_call_id: toolCall.id }));
                continue;
            }
            ;
            try {
                const response = await tool.invoke(toolCall.args);
                toolResponses.push(new messages_1.ToolMessage({ content: JSON.stringify(response), tool_call_id: toolCall.id }));
            }
            catch (error) {
                toolResponses.push(new messages_1.ToolMessage({ content: `Error executing tool '${toolCall.name}': ${error.message}`, tool_call_id: toolCall.id }));
            }
        }
        return { messages: toolResponses };
    };
    // 3. Edge logic
    const shouldContinue = (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage instanceof messages_1.AIMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools";
        }
        return langgraph_1.END;
    };
    // 4. Assemble the graph
    const workerGraph = new langgraph_1.StateGraph({
        channels: {
            messages: {
                value: (x, y) => x.concat(y),
                default: () => [],
            },
        }
    });
    workerGraph.addNode("agent", agentNode);
    workerGraph.addNode("tools", toolNode);
    workerGraph.setEntryPoint("agent");
    workerGraph.addConditionalEdges("agent", shouldContinue);
    workerGraph.addEdge("tools", "agent");
    return workerGraph.compile();
};
// 1. Dispatcher Node
const dispatcherNode = async (state) => {
    var _a;
    const user_query = (_a = state.messages.find(m => m instanceof messages_1.HumanMessage)) === null || _a === void 0 ? void 0 : _a.content;
    const agentList = agents_2.agents.map((a) => `- ${a.id} (${a.name}): ${a.specialty}`).join("\n");
    const prompt = new messages_1.SystemMessage(`You are an expert dispatcher. Analyze the user's query and determine which agents should collaborate.
       Return ONLY a comma-separated list of agent IDs (e.g., "terra,kube" or "cloud").
       Available Agents:\n${agentList}\n\nUser Query: "${user_query}"`);
    const response = await llm_1.model.invoke([prompt]);
    const agentIds = response.content.toString().trim().split(',').map(id => id.trim()).filter(id => id);
    const validAgents = agentIds.filter(id => id in agents_1.agentRunners);
    const assigned = validAgents.length > 0 ? validAgents : ['cloud'];
    console.log(`Dispatcher selected: ${assigned.join(', ')}`);
    return { assigned_agents: assigned, user_query };
};
// 2. Synthesizer Node
const synthesizerNode = async (state) => {
    const { user_query, responses } = state;
    const responseList = Object.entries(responses).map(([agentId, message]) => `### Response from ${agentId}:\n${message ? message.content : 'No response provided.'}`).join("\n\n---\n\n");
    const prompt = new messages_1.SystemMessage(`You are a master synthesizer. Your job is to combine the responses from multiple AI agents into a single, cohesive, and comprehensive answer for the user.
        User's original query: "${user_query}"
        Agent responses:\n${responseList}
        Please synthesize these into a single, final answer.`);
    const finalResponse = await llm_1.model.invoke([prompt]);
    return { messages: [finalResponse] };
};
// 3. Assemble the main graph
const graph = new langgraph_1.StateGraph({
    channels: {
        messages: { value: (x, y) => x.concat(y), default: () => [] },
        user_query: { value: (x, y) => y, default: () => "" },
        assigned_agents: { value: (x, y) => y, default: () => [] },
        responses: { value: (x, y) => (Object.assign(Object.assign({}, x), y)), default: () => ({}) },
    },
});
graph.addNode("dispatcher", dispatcherNode);
graph.addNode("synthesizer", synthesizerNode);
// Add agent worker nodes
for (const agentId in agents_1.agentRunners) {
    const worker = createAgentWorker(agentId);
    graph.addNode(agentId, async (state) => {
        const result = await worker.invoke({ messages: state.messages });
        // The last message from the worker is its final response
        const lastMessage = result.messages.pop();
        return { responses: { [agentId]: lastMessage } };
    });
    graph.addEdge(agentId, "synthesizer");
}
graph.setEntryPoint("dispatcher");
graph.addConditionalEdges("dispatcher", (state) => state.assigned_agents, Object.fromEntries(Object.keys(agents_1.agentRunners).map(id => [id, id])));
graph.addEdge("synthesizer", langgraph_1.END);
exports.app = graph.compile();
//# sourceMappingURL=workflow.js.map