import { StateGraph, END } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { agentRunners } from "./agents";
import { agents as agentDefinitions } from "@careerate/agents";
import { model } from "./llm";
import { tools } from "../tools";

// Helper function to determine which agents should collaborate
const determineAgentTeam = async (query: string): Promise<string[]> => {
    const agentList = agentDefinitions.map((a: any) => `- ${a.id} (${a.name}): ${a.specialty} - ${a.personality.description}`).join("\n");
    const prompt = new SystemMessage(
      `You are an expert dispatcher. Analyze the user's query and determine which agents should collaborate.
      
      IMPORTANT: 
      - For simple queries, select ONE primary agent
      - For complex tasks requiring multiple expertise areas, select 2-3 agents
      - Never select more than 3 agents
      - Return ONLY agent IDs separated by commas (e.g., "terra,kube" or just "cloud")
      
      Available Agents:
      ${agentList}
      
      User Query: "${query}"`
    );
  
    const response = await model.invoke([prompt]);
    const agentIds = response.content.toString().trim().split(',').map(id => id.trim());
    
    const validAgents = agentIds.filter(id => id in agentRunners);
    
    if (validAgents.length === 0) {
        console.log("No valid agents determined, defaulting to 'cloud'.");
        return ['cloud'];
    }
    
    console.log(`Agent team selected: ${validAgents.join(', ')}`);
    return validAgents;
};

interface AgentState {
    messages: BaseMessage[];
}

const callModel = async (state: AgentState) => {
    const { messages } = state;
    const query = messages.find(m => m instanceof HumanMessage)?.content as string;
    const agentTeam = await determineAgentTeam(query);
    
    // For now, use the primary agent (first in the team)
    // TODO: Implement true multi-agent collaboration
    const primaryAgentId = agentTeam[0];
    const agentRunner = agentRunners[primaryAgentId as keyof typeof agentRunners];

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
        const response = await (tool as any).invoke(toolCall.args);
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