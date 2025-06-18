import { StateGraph, END } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { agentRunners } from "./agents";
import { agents as agentDefinitions } from "@careerate/agents";
import { model } from "./llm";
import { tools } from "../tools";

// === Sub-Graph for a Single Agent ===

interface AgentWorkerState {
    messages: BaseMessage[];
}

const createAgentWorker = (agentId: keyof typeof agentRunners) => {
    const agentRunner = agentRunners[agentId];
    
    // 1. Agent node
    const agentNode = async (state: AgentWorkerState): Promise<Partial<AgentWorkerState>> => {
        const response = await agentRunner.invoke(state);
        return { messages: [response] };
    };

    // 2. Tools node
    const toolNode = async (state: AgentWorkerState): Promise<Partial<AgentWorkerState>> => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!(lastMessage instanceof AIMessage) || !lastMessage.tool_calls) {
            throw new Error("Invalid state: last message is not an AIMessage with tool calls.");
        }
        
        const toolResponses: ToolMessage[] = [];
        for (const toolCall of lastMessage.tool_calls) {
             const tool = tools.find((t) => t.name === toolCall.name);
             if (!tool) {
                toolResponses.push(new ToolMessage({ content: `Tool '${toolCall.name}' not found.`, tool_call_id: toolCall.id! }));
                continue;
             };
             try {
                const response = await (tool as any).invoke(toolCall.args);
                toolResponses.push(new ToolMessage({ content: JSON.stringify(response), tool_call_id: toolCall.id! }));
             } catch (error: any) {
                toolResponses.push(new ToolMessage({ content: `Error executing tool '${toolCall.name}': ${error.message}`, tool_call_id: toolCall.id! }));
             }
        }
        return { messages: toolResponses };
    };

    // 3. Edge logic
    const shouldContinue = (state: AgentWorkerState) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage instanceof AIMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools";
        }
        return END;
    };

    // 4. Assemble the graph
    const workerGraph = new StateGraph<AgentWorkerState>({
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
}

// === Main Graph for Orchestration ===

interface AgentState {
    messages: BaseMessage[];
    user_query: string;
    assigned_agents: string[];
    responses: Record<string, BaseMessage>;
}

// 1. Dispatcher Node
const dispatcherNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    const user_query = state.messages.find(m => m instanceof HumanMessage)?.content as string;
    const agentList = agentDefinitions.map((a: any) => `- ${a.id} (${a.name}): ${a.specialty}`).join("\n");
    const prompt = new SystemMessage(
      `You are an expert dispatcher. Analyze the user's query and determine which agents should collaborate.
       Return ONLY a comma-separated list of agent IDs (e.g., "terra,kube" or "cloud").
       Available Agents:\n${agentList}\n\nUser Query: "${user_query}"`
    );
    const response = await model.invoke([prompt]);
    const agentIds = response.content.toString().trim().split(',').map(id => id.trim()).filter(id => id);
    const validAgents = agentIds.filter(id => id in agentRunners);
    const assigned = validAgents.length > 0 ? validAgents : ['cloud'];
    console.log(`Dispatcher selected: ${assigned.join(', ')}`);
    return { assigned_agents: assigned, user_query };
}

// 2. Synthesizer Node
const synthesizerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    const { user_query, responses } = state;
    const responseList = Object.entries(responses).map(([agentId, message]) => 
        `### Response from ${agentId}:\n${message ? message.content : 'No response provided.'}`
    ).join("\n\n---\n\n");

    const prompt = new SystemMessage(
        `You are a master synthesizer. Your job is to combine the responses from multiple AI agents into a single, cohesive, and comprehensive answer for the user.
        User's original query: "${user_query}"
        Agent responses:\n${responseList}
        Please synthesize these into a single, final answer.`
    );
    const finalResponse = await model.invoke([prompt]);
    return { messages: [finalResponse] };
}

// 3. Assemble the main graph
const graph = new StateGraph<AgentState>({
    channels: {
        messages: { value: (x, y) => x.concat(y), default: () => [] },
        user_query: { value: (x, y) => y, default: () => "" },
        assigned_agents: { value: (x, y) => y, default: () => [] },
        responses: { value: (x, y) => ({...x, ...y}), default: () => ({}) },
    },
});

graph.addNode("dispatcher", dispatcherNode);
graph.addNode("synthesizer", synthesizerNode);

// Add agent worker nodes
for (const agentId in agentRunners) {
    const worker = createAgentWorker(agentId as keyof typeof agentRunners);
    graph.addNode(agentId, async (state: AgentState) => {
        const result = await worker.invoke({ messages: state.messages });
        // The last message from the worker is its final response
        const lastMessage = result.messages.pop();
        return { responses: { [agentId]: lastMessage } };
    });
    graph.addEdge(agentId, "synthesizer");
}

graph.setEntryPoint("dispatcher");

graph.addConditionalEdges(
    "dispatcher", 
    (state: AgentState) => state.assigned_agents,
    Object.fromEntries(Object.keys(agentRunners).map(id => [id, id]))
);

graph.addEdge("synthesizer", END);

export const app = graph.compile(); 