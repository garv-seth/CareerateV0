import logging
from typing import List, Dict, Any, Optional

from vertexai import agent_engines # type: ignore
from langchain_google_vertexai import HarmBlockThreshold, HarmCategory # type: ignore
from vertexai.preview.generative_models import ToolConfig # type: ignore

from .config import settings # Assuming your AzureKeyVault settings are loaded here
from .devops_langgraph_tools import DEVOPS_TOOLS_LIST, search_devops_ai_tools, suggest_iac_optimization, analyze_cli_usage_patterns
# from ..database import get_async_session, async_checkpointer_builder # For PostgreSQL checkpointer

logger = logging.getLogger(__name__)

# 1. Define and configure a model
MODEL_NAME = settings.GEMINI_MODEL_NAME # e.g., "gemini-1.5-flash-001" or "gemini-1.5-pro-001"

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_UNSPECIFIED: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

MODEL_KWARGS = {
    "temperature": 0.3,
    "max_output_tokens": 3072, # Increased token limit for potentially complex DevOps outputs
    "top_p": 0.95,
    "top_k": 40, # Common practice for Gemini
    # "safety_settings": SAFETY_SETTINGS, # Safety settings are often applied at client/project level in Vertex
    "candidate_count": 1,
}

# 2. Define DevOps-specific tools (imported from devops_langgraph_tools.py)
# DEVOPS_TOOLS_LIST already contains the functions: 
# [search_devops_ai_tools, suggest_iac_optimization, analyze_cli_usage_patterns]

# 3. (Optional) Store checkpoints (using PostgreSQL via LangGraph checkpointer)
# CHECKPOINTER_KWARGS = {
#     "db_url": settings.DATABASE_URL_ASYNC, # Your async PostgreSQL connection string
#     "table_name": "langgraph_checkpoints",
#     "get_session_func": get_async_session, # Function to get an SQLAlchemy async session
# }
# checkpointer_builder = async_checkpointer_builder # Custom builder if needed

# 4. Customize the prompt template
DEVOPS_SYSTEM_INSTRUCTION = (
    "You are a specialized AI assistant for DevOps Engineers and Site Reliability Engineers (SREs). "
    "Your primary goal is to enhance their productivity and efficiency by providing insightful, actionable, and context-aware assistance. "
    "Focus on the following areas:\n"
    "1.  **AI Tool Recommendation**: Based on the user's current task, described problem, or observed workflow patterns (e.g., CLI usage, config file types), recommend specific AI-powered tools or traditional DevOps tools with AI capabilities. Prioritize tools relevant to IaC (Terraform, Ansible, Pulumi), CI/CD (GitHub Actions, Jenkins, GitLab CI), containerization (Docker, Kubernetes), monitoring/observability (Prometheus, Grafana, Datadog, ELK), cloud platforms (Azure, AWS, GCP), and DevSecOps.\n"
    "2.  **Workflow Optimization**: Analyze provided information (e.g., code snippets, CLI history, task descriptions) to suggest optimizations, best practices, automation opportunities, or AI-driven approaches for common DevOps tasks.\n"
    "3.  **Troubleshooting Assistance**: Help diagnose issues related to DevOps tools and processes. If logs or error messages are provided, try to identify root causes and suggest solutions or relevant diagnostic tools.\n"
    "4.  **Learning & Guidance**: Provide explanations or point to resources for learning about new DevOps tools, AI applications in DevOps, or specific techniques.\n"
    "When interacting, be concise yet thorough. Ask clarifying questions if the user's query is ambiguous. "
    "Always prioritize security, reliability, and automation in your recommendations. "
    "Indicate if a suggested tool requires specific cloud provider integration or has notable prerequisites. "
    "If you use a tool to find information (like `search_devops_ai_tools`), clearly state what the tool found and how it relates to the user's query."
)

# 5. Create the LangGraph agent instance
try:
    logger.info(f"Initializing LanggraphAgent with model: {MODEL_NAME}")
    logger.info(f"Available tools for agent: {[tool.__name__ for tool in DEVOPS_TOOLS_LIST]}")

    # Configure how the model calls tools
    # Forcing specific tools or using ANY mode.
    # ANY mode lets the model decide, which is generally preferred for flexibility.
    tool_config_any = ToolConfig(
        function_calling_config=ToolConfig.FunctionCallingConfig(
            mode=ToolConfig.FunctionCallingConfig.Mode.ANY,
            # allowed_function_names=None # Let the model choose from the provided tools
        )
    )
    
    # If you want to force a specific tool for certain types of queries, it's more complex
    # and often handled by multiple agent instances or routing logic *before* this agent.
    # For this MVP, a single agent with flexible tool use is simpler.

    devops_agent_engine = agent_engines.LanggraphAgent(
        model=MODEL_NAME,
        model_kwargs=MODEL_KWARGS,
        tools=DEVOPS_TOOLS_LIST, # Pass the actual function objects
        system_instruction=DEVOPS_SYSTEM_INSTRUCTION,
        project_id=settings.GOOGLE_CLOUD_PROJECT, # Required for Vertex AI
        location=settings.GOOGLE_CLOUD_LOCATION, # e.g., "us-central1"
        # checkpointer_kwargs=CHECKPOINTER_KWARGS, # Enable if PostgreSQL checkpointer is set up
        # checkpointer_builder=checkpointer_builder, # Enable if custom builder for checkpointer
        model_tool_kwargs={"tool_config": tool_config_any} # Using the ANY mode tool config
    )
    logger.info("DevOps LangGraph Agent initialized successfully.")

except Exception as e:
    logger.exception(f"Failed to initialize DevOps LangGraph Agent: {e}")
    devops_agent_engine = None # Ensure it's None if initialization fails

async def invoke_devops_agent(
    user_query: str, 
    session_id: Optional[str] = None, # For conversational history with checkpointer
    # Pass other contextual info as needed, e.g., from Chrome extension
    cli_history: Optional[List[str]] = None, 
    current_file_context: Optional[Dict[str, Any]] = None
) -> Any:
    """
    Invokes the DevOps LangGraph agent with a user query and optional context.
    `current_file_context` could be e.g. {"file_type": "terraform", "file_content_snippet": "..."}
    """
    if not devops_agent_engine:
        logger.error("DevOps agent is not initialized. Cannot process query.")
        return {"error": "AI Agent is currently unavailable. Please try again later."}

    try:
        # Construct a more detailed input for the agent if context is available
        # LangGraph agents typically take a dictionary or a list of messages as input.
        # For a simple invocation, a string query might be enough, but providing context helps.
        
        # Example of structuring input for the agent:
        # The system prompt is already set. The user query becomes the human message.
        # If the agent is conversational and uses a checkpointer, `session_id` is key.
        
        # For non-conversational, or first turn:
        agent_input = {"input": user_query}
        
        # To provide more context (LangGraph allows passing rich input to the graph start)
        # This might need to be structured according to how your LangGraph graph is defined
        # (e.g. if it expects specific keys like `cli_history`)
        # For now, we'll assume the agent can parse this from the main `user_query` or that
        # the tools are designed to be called with this info if the agent decides to.
        # A more advanced setup might involve a pre-processing step to format the input.
        
        # Let's augment the user_query with available context for now
        # The LLM in the agent should be smart enough to use this context when calling tools.
        full_query = user_query
        if cli_history:
            full_query += f"\n\nRelevant CLI History:\n" + "\n".join(cli_history[-5:]) # Last 5 commands
        if current_file_context:
            full_query += f"\n\nCurrently observed file context:\n" + str(current_file_context)
            
        logger.info(f"Invoking DevOps agent. Session ID: {session_id}. Query: '{full_query[:200]}...'") # Log snippet
        
        # The `invoke` method takes the input for the graph and a config (which includes thread_id for checkpointer)
        # `thread_id` is LangGraph's term for session_id / conversation_id
        agent_config = {"configurable": {"thread_id": session_id}} if session_id else None

        # Note: `devops_agent_engine.invoke()` might return a complex object or stream.
        # Adjust based on LangGraph documentation for `LanggraphAgent`.
        # Typically, for a request-response, it's the final output of the graph.
        response = await devops_agent_engine.ainvoke(input={"messages": [("human", full_query)]}, config=agent_config)
        
        # The response structure from LanggraphAgent.ainvoke usually is a dictionary
        # with the output of the last node in the graph, often under a key like "output" or "messages".
        # Example: {"messages": [("ai", "Here is your answer...")]}
        # We need to extract the actual AI response content.
        
        logger.info(f"Agent response received: {str(response)[:200]}...")

        if isinstance(response, dict) and "messages" in response and isinstance(response["messages"], list):
            ai_messages = [msg for msg_type, msg_content in response["messages"] if msg_type == "ai"]
            if ai_messages:
                # Concatenate content from multiple AI messages if any, or take the last one.
                # Langchain `AIMessage` objects have a `content` attribute.
                # Assuming the agent_engines.LanggraphAgent returns a similar structure or plain strings.
                # If `msg_content` is an AIMessage object: `msg_content.content`
                # If `msg_content` is a string: `msg_content`
                # Let's be safe and check type
                final_response_content = []
                for msg_content in ai_messages:
                    if hasattr(msg_content, 'content'):
                        final_response_content.append(msg_content.content)
                    elif isinstance(msg_content, str):
                        final_response_content.append(msg_content)
                    else: # Fallback for unknown structure, convert to string
                        final_response_content.append(str(msg_content))
                return {"reply": "\n".join(final_response_content), "raw_response": response}
            else:
                logger.warning("No AI messages found in agent response.")
                return {"reply": "The agent processed your request but did not return a direct message.", "raw_response": response}
        else:
            # Fallback if the response is not in the expected dictionary format
            logger.warning(f"Unexpected agent response format: {type(response)}. Returning as is.")
            return {"reply": str(response), "raw_response": response}

    except Exception as e:
        logger.exception(f"Error invoking DevOps agent: {e}")
        return {"error": f"An error occurred while communicating with the AI Agent: {str(e)}"}

async def test_agent_invocation():
    """A simple test function for the agent invocation"""
    if not devops_agent_engine:
        print("Agent not initialized, skipping test.")
        return

    print("--- Testing DevOps Agent Invocation ---")
    
    queries = [
        "What AI tools can help me with Terraform code generation?",
        "I'm having trouble with my Kubernetes deployment. It says 'ImagePullBackOff'. What should I check?",
        "Suggest some ways to optimize my GitHub Actions CI pipeline for a Python project.",
        "analyze this cli history: kubectl get pods, docker ps, terraform plan"
    ]
    
    sample_cli_history = [
        "kubectl get pods --namespace production",
        "docker build -t my-api:latest .",
        "terraform apply -var-file=prod.tfvars",
        "helm list -n monitoring",
        "git status"
    ]
    
    sample_file_context = {
        "file_type": "dockerfile",
        "file_name": "Dockerfile",
        "lines_of_code": 50,
        "detected_base_image": "python:3.9-slim"
    }

    for i, query in enumerate(queries):
        print(f"\n--- Query {i+1}: {query} ---")
        session_id_test = f"test_session_{i}" # Use different session IDs for testing context persistence if checkpointer is on
        
        response = None
        if i == 0: # Test simple query
            response = await invoke_devops_agent(user_query=query, session_id=session_id_test)
        elif i == 1: # Test query with context
             response = await invoke_devops_agent(
                 user_query=query, 
                 session_id=session_id_test, 
                 cli_history=sample_cli_history
             )
        elif i == 2:
            response = await invoke_devops_agent(
                user_query=query, 
                session_id=session_id_test,
                current_file_context=sample_file_context
            )
        else: # Query with inline context for CLI
            response = await invoke_devops_agent(user_query=query, session_id=session_id_test) 

        if response and "error" in response:
            print(f"Agent Error: {response['error']}")
        elif response and "reply" in response:
            print(f"Agent Reply: {response['reply']}")
        else:
            print(f"Unexpected response structure: {response}")

# To run this test (ensure GOOGLE_APPLICATION_CREDENTIALS and other configs are set):
if __name__ == "__main__":
    import asyncio
    import os
    # This assumes you have GOOGLE_APPLICATION_CREDENTIALS set in your environment
    # and that `settings` loads GCP project and location.
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Check for essential settings for the test to run
    if not settings.GOOGLE_CLOUD_PROJECT or not settings.GOOGLE_CLOUD_LOCATION or not settings.GEMINI_MODEL_NAME:
        logger.error("Missing GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, or GEMINI_MODEL_NAME in settings.")
        logger.error("Please ensure these are configured in .env or Azure Key Vault and loaded via config.py")
    elif not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        logger.error("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.")
        logger.error("Agent initialization and invocation will likely fail.")
    else:
        asyncio.run(test_agent_invocation()) 