import { StateGraph, END } from "@langchain/langgraph";
import { AgentResponse, CollaborationStep, Agent } from "@careerate/types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { terraAgent, kubeAgent, cloudAgent, rapidAgent } from "./agents";
import { agents as agentDefinitions } from "@careerate/agents";
import { model } from "./llm";

// A map of agent runners
const agentRunners = {
  terra: terraAgent,
  kube: kubeAgent,
  cloud: cloudAgent,
  rapid: rapidAgent,
};

// Define the state for the graph
interface AgentState {
  user_query: string;
  context: any;
  assigned_agents: string[];
  responses: AgentResponse[];
  final_solution: string;
  collaboration_history: CollaborationStep[];
}

// Helper function to determine which agents are relevant using an LLM
const determineRelevantAgents = async (query: string): Promise<string[]> => {
  const agentList = agentDefinitions.map(a => `- ${a.id} (${a.name}): ${a.specialty} - ${a.personality.description}`).join("\n");
  const prompt = new SystemMessage(
    `You are an expert dispatcher. Your job is to determine which of the following agents are relevant to a user's query.
    You must respond with a comma-separated list of agent IDs. Do not provide any other text or explanation.

    Available Agents:
    ${agentList}
    
    User Query: "${query}"`
  );

  const response = await model.invoke([prompt]);
  const relevantAgents = response.content.toString().split(',').map(id => id.trim()).filter((id: string) => id in agentRunners);
  
  // If no specific keywords, assign a general agent as a fallback
  if (relevantAgents.length === 0) {
    console.log("No relevant agents found by LLM, defaulting to 'cloud'.");
    return ['cloud'];
  }
  
  console.log("LLM assigned agents:", relevantAgents);
  return relevantAgents;
};

// Helper function to synthesize a final response using an LLM
const synthesizeResponses = async (responses: AgentResponse[], query: string): Promise<string> => {
    if (responses.length === 0) {
        return "I'm sorry, no agents were able to provide a response for your request.";
    }
    const formattedResponses = responses.map(r => `**${r.agentId}**: ${r.content}`).join('\n\n');
    const prompt = new SystemMessage(
      `You are a senior project manager. Your job is to synthesize the responses from multiple AI agents into a single, coherent, and actionable solution for the user.
      
      Original User Query: "${query}"

      Agent Responses:
      ${formattedResponses}

      Synthesize these responses into a final, user-friendly solution.`
    );
    
    const response = await model.invoke([prompt]);
    return response.content.toString();
};

const initialState: AgentState = {
    user_query: "",
    context: {},
    assigned_agents: [],
    responses: [],
    final_solution: "",
    collaboration_history: []
};

// This is how we define the graph state.
// `(x, y) => x.concat(y)` means that whenever a node returns a value for `responses`, it will be appended to the existing list.
const graphState = {
  user_query: { value: null },
  context: { value: null },
  assigned_agents: { value: null },
  responses: { value: (x: AgentResponse[], y: AgentResponse[]) => x.concat(y), default: () => [] },
  final_solution: { value: null },
  collaboration_history: { value: (x: CollaborationStep[], y: CollaborationStep[]) => x.concat(y), default: () => [] },
};

const workflow = new StateGraph<AgentState>({
  channels: graphState,
});

// 1. Agent assignment node
workflow.addNode("assign_agents", async (state: AgentState) => {
  const relevantAgents = await determineRelevantAgents(state.user_query);
  return { assigned_agents: relevantAgents };
});

// 2. A function that will run all assigned agents in parallel
async function runAllAssignedAgents(state: AgentState) {
  const agentPromises = state.assigned_agents.map(agentId => {
    const runner = agentRunners[agentId as keyof typeof agentRunners];
    if (runner) {
      return runner.process(state.user_query, state.context);
    }
    return Promise.resolve(null);
  });
  
  const responses = (await Promise.all(agentPromises)).filter(r => r !== null) as AgentResponse[];
  return { responses };
}
workflow.addNode("run_agents", runAllAssignedAgents);


// 3. Collaboration synthesis node
workflow.addNode("synthesize_response", async (state: AgentState) => {
  const finalSolution = await synthesizeResponses(state.responses, state.user_query);
  return { final_solution: finalSolution };
});

// 4. Define the workflow edges
workflow.setEntryPoint("assign_agents");
workflow.addEdge("assign_agents", "run_agents");
workflow.addEdge("run_agents", "synthesize_response");
workflow.addEdge("synthesize_response", END);

export const app = workflow.compile(); 