import { StateGraph, END } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { agentRunners } from "./agents";
import { agents as agentDefinitions } from "@careerate/agents";
import { model } from "./llm";
import { tools } from "../tools";

// Helper function to determine which agent is best for the job
const determinePrimaryAgent = async (query: string): Promise<string> => {
    const agentList = agentDefinitions.map(a => `- ${a.id} (${a.name}): ${a.specialty} - ${a.personality.description}`).join("\n");
    const prompt = new SystemMessage(
      `You are an expert dispatcher. Your job is to determine which SINGLE agent is best suited to handle a user's query.
      You must respond with only the agent's ID. Do not provide any other text or explanation.
  
      Available Agents:
      ${agentList}
      
      User Query: "${query}"`
    );
  
    const response = await model.invoke([prompt]);
    const agentId = response.content.toString().trim();
    
    if (agentId in agentRunners) {
        console.log(`Primary agent selected: ${agentId}`);
        return agentId;
    }
    
    console.log("Could not determine a specific agent, defaulting to 'cloud'.");
    return 'cloud'; // Default fallback
};

interface AgentState {
    messages: BaseMessage[];
}

const callModel = async (state: AgentState) => {
    const { messages } = state;
    const query = messages.find(m => m instanceof HumanMessage)?.content as string;
    const agentId = await determinePrimaryAgent(query);
    const agentRunner = agentRunners[agentId as keyof typeof agentRunners];

    const response = await agentRunner.invoke({
        input: query,
        messages: messages, // Pass the whole history
    });
    
    return { messages: [response] };
};

const callTool = async (state: AgentState) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];

    if (!(lastMessage instanceof AIMessage) || !lastMessage.tool_calls) {
        throw new Error("No tool calls found in the last message.");
    }

    const toolResponses: ToolMessage[] = [];

    for (const toolCall of lastMessage.tool_calls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
            continue;
        }
        const response = await tool.invoke(toolCall.args);
        if (toolCall.id) {
            toolResponses.push(new ToolMessage({
                content: response,
                tool_call_id: toolCall.id,
            }));
        }
    }

    return { messages: toolResponses };
};

const shouldContinue = (state: AgentState) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage instanceof AIMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      return "tools";
    }
    return END;
};

const graph = new StateGraph<AgentState>({
    channels: {
        messages: {
            value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
            default: () => [],
        },
    }
});

graph.addNode("agent", callModel);
graph.addNode("tools", callTool);

graph.setEntryPoint("agent");
graph.addConditionalEdges("agent", shouldContinue);
graph.addEdge("tools", "agent");

export const app = graph.compile(); 