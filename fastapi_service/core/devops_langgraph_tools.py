from typing import List, Dict, Any, Optional
import logging
# from sqlalchemy.ext.asyncio import AsyncSession # Not using SQLAlchemy for this tool's DB access
import asyncpg # For type hinting the connection

# Import the repository from the database module
from ..database import AIToolsRepository, get_db_connection # get_db_connection might not be used directly here if conn is passed

logger = logging.getLogger(__name__)

# --- Tool Definitions for LangGraph Agent ---

async def search_devops_ai_tools(
    # This tool will be called by the LangGraph agent.
    # The agent framework (e.g., via FastAPI endpoint that invokes the agent)
    # will need to make a database connection available to this tool when it's executed.
    # One way is to pass the connection or a connection-getter function when defining the tool
    # or by having the tool acquire it from a global/contextvar if the framework supports that.
    # For this MVP, we assume the calling context (e.g., FastAPI route handler for the agent)
    # will provide the `db_connection`.
    db_connection: asyncpg.Connection, # Expecting an active asyncpg connection
    query: str,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Searches a curated database for AI tools relevant to DevOps/SRE tasks.
    Can filter by query (name/description), category (e.g., "iac", "ci_cd", "monitoring"), 
    and tags (e.g., ["terraform", "kubernetes"]).
    This tool requires an active `asyncpg.Connection` to be passed as `db_connection`.
    """
    logger.info(f"Searching DevOps AI tools via DB: query='{query}', category='{category}', tags='{tags}'")
    
    if not db_connection:
        logger.error("Database connection not provided to search_devops_ai_tools.")
        return [{
            "error": "Database connection unavailable for tool search.", 
            "tool_name": query, # Echo back some input
            "status": "Tool execution failed"
        }]

    try:
        ai_tools_repo = AIToolsRepository(db_connection)
        
        # Use the new specialized search method
        tools = await ai_tools_repo.search_devops_tools(
            query_term=query,
            category=category,
            tags=tags,
            limit=5 # Return top 5 matches for agent context
        )
        
        if not tools:
            logger.info(f"No DevOps tools found for query='{query}', category='{category}', tags='{tags}'")
            return [{ "message": f"No specific AI tools found for: '{query}' with category '{category}' and tags '{tags}'. Try a broader search?"}]

        # Format for the agent (ensure it matches what agent/frontend expects)
        # The mock data had fields like confidence_score, impact_score, reasoning etc.
        # The database schema for ai_tools might not have these directly.
        # For MVP, return core tool data. The agent can synthesize reasoning if needed.
        formatted_tools = []
        for tool in tools:
            # Convert RowProxy to dict if not already, or select specific fields
            # `search_devops_tools` already returns List[Dict[str, Any]]
            formatted_tools.append({
                "id": str(tool.get("id")), # Ensure ID is string if UUID or similar
                "name": tool.get("name"),
                "description": tool.get("description"),
                "category": tool.get("category"),
                "tags": tool.get("tags", []), # Ensure tags is a list
                "url": tool.get("url"),
                "rating": tool.get("rating"),
                # Add other fields from ai_tools table if useful for the agent
                # "reasoning": "This tool matches your query based on its category and tags.", # Agent can add this if needed
            })
            
        logger.info(f"Found {len(formatted_tools)} DevOps tools from DB for query='{query}'")
        return formatted_tools

    except Exception as e:
        logger.exception(f"Error during database search for DevOps tools: {e}")
        return [{
            "error": f"Failed to search tools in database: {str(e)}", 
            "query": query,
            "category": category,
            "tags": tags
        }]

async def suggest_iac_optimization(
    db_connection: asyncpg.Connection, # Added db_connection requirement
    iac_tool_name: str, 
    code_snippet: Optional[str] = None,
    task_description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Suggests optimizations or AI tools for Infrastructure as Code (IaC) tasks.
    This would ideally use a Gemini model for analysis if a code snippet or detailed task is provided.
    For the MVP, it might return predefined suggestions or point to relevant tools found via `search_devops_ai_tools`.
    Requires `db_connection` for its call to `search_devops_ai_tools`.
    """
    logger.info(f"Suggesting IaC optimization for tool: {iac_tool_name}, task: '{task_description}'")
    
    # In a real scenario, this would involve:
    # 1. Formatting a prompt for Gemini with the iac_tool_name, code_snippet, and task_description.
    # 2. Calling the Gemini model.
    # 3. Parsing the response to extract suggestions, relevant AI tools, or code improvements.
    
    # Call the DB-backed search tool
    relevant_tools_from_db = await search_devops_ai_tools(
        db_connection=db_connection, 
        query=iac_tool_name, 
        category="iac"
    )

    suggestions = {
        "tool_name": iac_tool_name,
        "optimization_type": "General Best Practices & Tooling",
        "suggested_actions": [
            f"Consider using an AI-powered linter or code assistant specialized for {iac_tool_name} to catch common errors and enforce best practices.",
            f"Explore AI tools that can help generate boilerplate code for {iac_tool_name} modules or configurations (see relevant tools found).",
            "If managing complex state, look into AI-driven state analysis tools to prevent drift and ensure consistency.",
            "For security, use AI tools that scan IaC for vulnerabilities (e.g., Aqua Security Trivy, Checkov with AI enhancements)."
        ],
        "relevant_ai_tools_found": relevant_tools_from_db, # Now uses DB result
        "example_improvement": f"# Example: For {iac_tool_name}, ensure you are using version pinning for providers and modules.\n# An AI tool could automatically check and suggest this." if not code_snippet else "AI analysis of the provided code snippet would yield more specific suggestions here."
    }
    
    if "terraform" in iac_tool_name.lower() and code_snippet:
        if "aws_s3_bucket" in code_snippet and "versioning" not in code_snippet:
            suggestions["specific_feedback"] = "Terraform S3 Bucket: Consider enabling versioning for data protection. An AI tool could identify this."
            suggestions["suggested_actions"].append("Enable versioning on S3 buckets defined in your Terraform code.")

    logger.info(f"Generated IaC optimization suggestion for {iac_tool_name}")
    return suggestions

async def analyze_cli_usage_patterns(
    db_connection: asyncpg.Connection, # Added db_connection requirement
    cli_history: List[str], 
    target_tool_name: Optional[str] = None 
) -> Dict[str, Any]:
    """
    Analyzes CLI command history for common patterns and suggests AI tools, aliases, or optimizations.
    This tool is highly contextual and would benefit from an LLM's pattern recognition.
    Requires `db_connection` for its call to `search_devops_ai_tools`.
    """
    logger.info(f"Analyzing CLI usage patterns. Target tool: {target_tool_name}. History items: {len(cli_history)}")
    
    if not cli_history:
        return {"message": "No CLI history provided for analysis.", "suggestions": []}

    insights = {
        "dominant_tool": None,
        "common_commands": {},
        "potential_aliases": [],
        "ai_tool_suggestions": []
    }
    command_counts = {}
    tool_counts = {}

    for command_str in cli_history:
        parts = command_str.split(" ")
        tool = parts[0]
        tool_counts[tool] = tool_counts.get(tool, 0) + 1
        
        if len(parts) > 1:
            base_command = f"{tool} {parts[1]}"
            command_counts[base_command] = command_counts.get(base_command, 0) + 1
        else:
            command_counts[tool] = command_counts.get(tool, 0) + 1
            
    if tool_counts:
        insights["dominant_tool"] = max(tool_counts, key=tool_counts.get)

    sorted_commands = sorted(command_counts.items(), key=lambda item: item[1], reverse=True)
    insights["common_commands"] = dict(sorted_commands[:3])

    for cmd, count in insights["common_commands"].items():
        if count > 1 and len(cmd.split(" ")) > 1 : # Adjusted threshold
             alias_suggestion = f"Consider creating an alias for '{cmd}', e.g., alias {cmd.split(' ')[1][:2]}{cmd.split(' ')[0][:1]}='{cmd}'"
             insights["potential_aliases"].append(alias_suggestion)
    
    if insights["dominant_tool"]:
        tool_search_query = insights["dominant_tool"]
        category_hint = None
        if insights["dominant_tool"] == "kubectl":
            tool_search_query = "kubernetes"
            category_hint = "containers_orchestration"
        elif insights["dominant_tool"] == "docker":
            tool_search_query = "docker"
            category_hint = "containers_orchestration"
        elif insights["dominant_tool"] == "terraform":
            category_hint = "iac"
        
        ai_tools = await search_devops_ai_tools(db_connection=db_connection, query=tool_search_query, category=category_hint)
        # Check if ai_tools is not empty and the first item is a valid tool (not an error/message dict)
        if ai_tools and isinstance(ai_tools[0], dict) and not ai_tools[0].get("error") and not ai_tools[0].get("message"):
            insights["ai_tool_suggestions"] = [
                {
                    "tool_name": tool.get("name"), 
                    "reason": f"Relevant for your frequent use of '{insights['dominant_tool']}'. Description: {tool.get('description')[:100]}...",
                    "details_url": tool.get("url")
                } for tool in ai_tools[:2]
            ]
            
    if not insights["ai_tool_suggestions"] and "terraform" in " ".join(cli_history):
         tf_tools = await search_devops_ai_tools(db_connection=db_connection, query="terraform", category="iac")
         # Check if tf_tools is not empty and the first item is a valid tool
         if tf_tools and isinstance(tf_tools[0], dict) and not tf_tools[0].get("error") and not tf_tools[0].get("message"):
            insights["ai_tool_suggestions"].append({
                 "tool_name": tf_tools[0].get("name"), 
                 "reason": f"Terraform usage detected. Consider: {tf_tools[0].get('description')[:100]}...",
                 "details_url": tf_tools[0].get("url")
            })

    logger.info(f"CLI usage analysis complete. Dominant tool: {insights['dominant_tool']}")
    return insights


# Update DEVOPS_TOOLS_LIST to reflect that these tools now require db_connection if called directly.
# The LangGraph agent framework will handle injecting this when it executes a tool.
# The functions themselves are what's listed.
DEVOPS_TOOLS_LIST = [
    search_devops_ai_tools,
    suggest_iac_optimization,
    analyze_cli_usage_patterns,
]

async def test_tools(db_conn_for_test: asyncpg.Connection):
    """Function to manually test the tools, requires a live DB connection"""
    if not db_conn_for_test:
        print("DB connection not provided to test_tools, skipping DB tests.")
        return

    print("--- Testing search_devops_ai_tools (DB backed) ---")
    results_k8s = await search_devops_ai_tools(db_connection=db_conn_for_test, query="kubernetes", category="containers_orchestration")
    print(f"Search results for 'kubernetes': {results_k8s}")
    results_tf_general = await search_devops_ai_tools(db_connection=db_conn_for_test, query="terraform")
    print(f"Search results for 'terraform' (general): {results_tf_general}")
    results_monitoring_tagged = await search_devops_ai_tools(db_connection=db_conn_for_test, query="metrics", category="monitoring", tags=["prometheus"])
    print(f"Search results for 'monitoring' (metrics, prometheus tag): {results_monitoring_tagged}")

    print("\n--- Testing suggest_iac_optimization (DB backed) ---")
    tf_code = """
    resource "aws_s3_bucket" "my_bucket" {
      bucket = "my-tf-test-bucket-12345"
    }
    """ # Ensure no stray characters after this closing triple quote
    iac_suggestions_tf = await suggest_iac_optimization(
        db_connection=db_conn_for_test, 
        iac_tool_name="terraform", 
        code_snippet=tf_code, 
        task_description="Manage S3 bucket for static website"
    )
    print(f"IaC suggestions for Terraform S3: {iac_suggestions_tf}")
    
    ansible_suggestions = await suggest_iac_optimization(db_connection=db_conn_for_test, iac_tool_name="ansible", task_description="Automate server configuration")
    print(f"IaC suggestions for Ansible: {ansible_suggestions}")

    print("\n--- Testing analyze_cli_usage_patterns (DB backed) ---")
    cli_history_sample = [
        "kubectl get pods -n my-namespace",
        "docker build -t my-app:latest .",
        "terraform apply -auto-approve",
        "kubectl get pods -n my-namespace" 
    ]
    cli_analysis_k8s = await analyze_cli_usage_patterns(db_connection=db_conn_for_test, cli_history=cli_history_sample, target_tool_name="kubectl")
    print(f"CLI analysis for kubectl: {cli_analysis_k8s}")
    
    cli_analysis_tf = await analyze_cli_usage_patterns(db_connection=db_conn_for_test, cli_history=["terraform init", "terraform plan", "terraform apply"], target_tool_name="terraform")
    print(f"CLI analysis for terraform: {cli_analysis_tf}")


if __name__ == "__main__":
    import asyncio
    import logging # Ensure logging is imported here if not already at top level for this block
    from ..database import db_manager

    async def main_test_runner_for_tools(): # Renamed to avoid potential conflict if other main_test_runner exists
        # Configure logging for the test run
        logging.basicConfig(level=logging.DEBUG,
                            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        logger.info("Initializing DB manager for tools test...")
        await db_manager.initialize()
        try:
            logger.info("Getting DB connection for tools test...")
            async with db_manager.get_connection() as test_conn:
                logger.info("DB connection acquired. Running test_tools...")
                # Example: Add a dummy tool to ensure search has something to find
                # try:
                #     repo = AIToolsRepository(test_conn)
                #     await repo.create_tool({
                #         "name": "Test K8s AI Helper", "description": "Helps with k8s pods", 
                #         "category": "containers_orchestration", "tags": ["kubernetes", "pods"],
                #         "url": "http://example.com/k8shelper", "rating": 4.5
                #     })
                #     logger.info("Dummy tool inserted for test.")
                # except Exception as e:
                #     logger.warning(f"Could not insert dummy tool for test (may already exist or DB issue): {e}")
                await test_tools(test_conn)
                logger.info("test_tools finished.")
        except Exception as e:
            logger.exception(f"Exception in main_test_runner_for_tools: {e}")
        finally:
            logger.info("Closing DB manager after tools test...")
            await db_manager.close()

    asyncio.run(main_test_runner_for_tools()) 