"""
Router for DevOps AI Agent Recommendations using LangGraph.
Provides endpoints to interact with the DevOps-focused LangGraph agent.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request as FastAPIRequest
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, AsyncGenerator
import json
import logging
import uuid
from datetime import datetime

# LangGraph Agent Integration
from ..core.devops_langgraph_agent import invoke_devops_agent, devops_agent_engine # devops_agent_engine for streaming if possible
# from ..core.config import get_settings # Settings might be used for other configs if needed
from ..database import get_db_connection # Assuming asyncpg connection pool
# from ..database import RecommendationRepository # If you have a repository pattern

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/devops-agent", # New prefix for clarity
    tags=["DevOps Agent"]      # New tag
)

# --- Pydantic Models for LangGraph Agent Interaction ---

class AgentInvokeRequest(BaseModel):
    user_id: str # For session tracking and history
    session_id: Optional[str] = None # LangGraph thread_id
    query: str = Field(..., description="The user's query or task for the DevOps agent.")
    cli_history: Optional[List[str]] = Field(default=None, description="Recent CLI commands for context.")
    current_file_context: Optional[Dict[str, Any]] = Field(default=None, description="Context of the current file the user is working on, e.g., {'file_type': 'terraform', 'snippet': '...'}")
    # include_tool_details: bool = Field(default=False, description="If true, tries to include details of any tools mentioned in the response")

class AgentToolCall(BaseModel):
    tool_name: str
    tool_input: Dict[str, Any]
    tool_output: Optional[Any] = None # Result of the tool call
    log: Optional[str] = None # Log or error from tool call

class AgentMessage(BaseModel):
    type: str # "human", "ai", "tool"
    content: Any
    tool_calls: Optional[List[AgentToolCall]] = None

class AgentResponse(BaseModel):
    session_id: str
    reply: str # The main textual reply from the agent
    tool_calls: Optional[List[AgentToolCall]] = Field(default=None, description="Details of tools called by the agent during the run.")
    raw_agent_output: Optional[Dict[str, Any]] = Field(default=None, description="The raw output from the LangGraph agent for debugging or extended info.")
    error: Optional[str] = None
    request_timestamp: datetime
    response_timestamp: datetime

class FeedbackRequest(BaseModel):
    user_id: str
    session_id: str # The session_id from the agent interaction
    recommendation_interaction_id: Optional[str] = None # ID of the specific interaction if multiple in a session
    feedback_type: str = Field(..., description="e.g., 'helpful', 'not_helpful', 'implemented', 'issue_with_tool_X'")
    feedback_text: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5, description="Optional rating 1-5 stars")

# --- Helper for Database Interaction (Simplified for MVP) ---

async def store_agent_interaction(
    db,
    user_id: str,
    session_id: str,
    request_data: AgentInvokeRequest,
    response_data: AgentResponse,
    interaction_type: str = "invoke" # "invoke", "stream_chunk"
):
    """Stores the agent interaction details in the database."""
    query = """
    INSERT INTO agent_interactions (
        id, user_id, session_id, interaction_type, query_text, 
        cli_history, file_context, agent_reply, tool_calls_json, 
        raw_response_json, error_message, request_timestamp, response_timestamp
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    interaction_id = str(uuid.uuid4())
    try:
        async with db.cursor() as cursor:
            await cursor.execute(query, (
                interaction_id,
                user_id,
                session_id,
                interaction_type,
                request_data.query,
                json.dumps(request_data.cli_history) if request_data.cli_history else None,
                json.dumps(request_data.current_file_context) if request_data.current_file_context else None,
                response_data.reply,
                json.dumps([tc.model_dump() for tc in response_data.tool_calls]) if response_data.tool_calls else None,
                json.dumps(response_data.raw_agent_output) if response_data.raw_agent_output else None,
                response_data.error,
                response_data.request_timestamp,
                response_data.response_timestamp
            ))
        # await db.commit() # Handled by context manager or FastAPI dependency if using transactions
        logger.info(f"Stored agent interaction {interaction_id} for user {user_id}, session {session_id}")
    except Exception as e:
        logger.error(f"Failed to store agent interaction for session {session_id}: {e}")
        # Decide if this failure should propagate or just be logged

# --- Agent Endpoints ---

@router.post(
    "/invoke",
    response_model=AgentResponse,
    summary="Invoke the DevOps AI Agent",
    description="Sends a query and context to the DevOps LangGraph agent and gets a single response."
)
async def invoke_agent_endpoint(
    agent_request: AgentInvokeRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db_connection) # For logging interaction
):
    request_timestamp = datetime.utcnow()
    session_id = agent_request.session_id or str(uuid.uuid4())

    logger.info(f"Invoking DevOps agent for user {agent_request.user_id}, session {session_id}. Query: '{agent_request.query[:100]}...'")

    raw_response = await invoke_devops_agent(
        user_query=agent_request.query,
        session_id=session_id,
        cli_history=agent_request.cli_history,
        current_file_context=agent_request.current_file_context
    )

    response_timestamp = datetime.utcnow()

    if raw_response.get("error"):
        logger.error(f"Agent invocation error for session {session_id}: {raw_response.get('error')}")
        agent_resp_data = AgentResponse(
            session_id=session_id,
            reply="",
            error=str(raw_response.get("error")),
            request_timestamp=request_timestamp,
            response_timestamp=response_timestamp
        )
        # Still log the failed attempt
        background_tasks.add_task(store_agent_interaction, db, agent_request.user_id, session_id, agent_request, agent_resp_data)
        raise HTTPException(status_code=500, detail=f"Agent error: {raw_response.get('error')}")

    # Parse raw_response to AgentResponse structure
    # This depends on the exact structure of `raw_response` from `invoke_devops_agent`
    # Assuming `raw_response` = {"reply": "...", "raw_response": { ... LangGraph output ... }}
    
    # Extract tool calls if present in the raw LangGraph output
    # This is a simplification; actual tool call data might be nested deeper or structured differently.
    parsed_tool_calls = []
    if raw_response.get("raw_response") and isinstance(raw_response["raw_response"].get("messages"), list):
        for msg_type, msg_content_or_obj in raw_response["raw_response"]["messages"]:
            if msg_type == "tool" and hasattr(msg_content_or_obj, 'tool_calls'): # Langchain ToolMessage
                 for tc in msg_content_or_obj.tool_calls:
                     parsed_tool_calls.append(AgentToolCall(tool_name=tc.get('name', 'unknown_tool'), tool_input=tc.get('args', {}), tool_output=tc.get('result'))) # Simplified
            elif isinstance(msg_content_or_obj, dict) and msg_content_or_obj.get("type") == "tool_calls": # If raw tool calls are logged
                # This path needs more specific parsing based on actual LangGraph output format for tool calls
                pass 

    agent_final_reply = raw_response.get("reply", "No reply generated.")
    
    response = AgentResponse(
        session_id=session_id,
        reply=agent_final_reply,
        tool_calls=parsed_tool_calls if parsed_tool_calls else None,
        raw_agent_output=raw_response.get("raw_response"),
        request_timestamp=request_timestamp,
        response_timestamp=response_timestamp
    )

    background_tasks.add_task(store_agent_interaction, db, agent_request.user_id, session_id, agent_request, response)
    logger.info(f"Agent invocation successful for session {session_id}. Reply length: {len(response.reply)}")
    return response


@router.post(
    "/stream",
    summary="Stream responses from the DevOps AI Agent (experimental)",
    description="Streams events and final response from the DevOps LangGraph agent. Format and content of stream events might evolve."
)
async def stream_agent_endpoint(
    agent_request: AgentInvokeRequest, 
    fastapi_req: FastAPIRequest, # To check if client disconnected
    background_tasks: BackgroundTasks, 
    db = Depends(get_db_connection)
):
    session_id = agent_request.session_id or str(uuid.uuid4())
    request_timestamp = datetime.utcnow()

    logger.info(f"Streaming DevOps agent for user {agent_request.user_id}, session {session_id}. Query: '{agent_request.query[:100]}...'")

    if not devops_agent_engine:
        async def error_gen():
            yield f"event: error\ndata: {json.dumps({'error': 'Agent not initialized'})}\n\n"
        return StreamingResponse(error_gen(), media_type="text/event-stream")

    async def event_generator() -> AsyncGenerator[str, None]:
        full_agent_reply = ""
        all_tool_calls = []
        raw_agent_parts = [] # To store parts of the raw response for logging
        error_message = None
        
        # Construct input for agent streaming
        # The `astream_events` method in LangGraph expects the same input structure as `ainvoke` typically.
        # The graph needs to be designed to yield events for this to be effective.
        # For VertexAI `LanggraphAgent`, this might be `devops_agent_engine.graph.astream_events(...)` if `graph` is exposed
        # or the agent itself might have a streaming method.
        # Assuming `devops_agent_engine.astream_log(...)` or `astream_events` for LangGraph standard.
        # The Vertex AI SDK's `LanggraphAgent` might wrap this differently.
        # Let's try to use `astream_log` which is common in LangGraph for detailed event streaming.

        # Reconstruct the full query with context for the agent
        full_query_for_agent = agent_request.query
        if agent_request.cli_history:
            full_query_for_agent += f"\n\nRelevant CLI History:\n" + "\n".join(agent_request.cli_history[-5:])
        if agent_request.current_file_context:
            full_query_for_agent += f"\n\nCurrently observed file context:\n" + str(agent_request.current_file_context)

        agent_input = {"messages": [("human", full_query_for_agent)]}
        agent_config = {"configurable": {"thread_id": session_id}, "recursion_limit": 25}

        try:
            # Stream initial status
            yield f"event: status\ndata: {json.dumps({'type': 'agent_starting', 'session_id': session_id, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            
            # The structure of events from `astream_log` or `astream_events` varies.
            # We are looking for tool calls, intermediate LLM outputs (chunks), and final response.
            # Example for `astream_log`: It yields `LogEntry` objects.
            async for event in devops_agent_engine.astream_log(input=agent_input, config=agent_config, include_types=["llm", "tool"]):
                if await fastapi_req.is_disconnected():
                    logger.info(f"Client disconnected during stream for session {session_id}")
                    break

                # event is a LogEntry. event.data contains the specifics.
                # event.name is the node name in the graph. event.type is 'llm', 'tool', etc.
                # logger.debug(f"Agent stream event for session {session_id}: {event.name} - {event.type}")
                raw_agent_parts.append(event.model_dump_json()) # Storing raw event for logging

                if event.type == "tool" and event.name.startswith("agent.tools"): # Standard LangGraph tool node name
                    tool_name_from_event = event.data.get("name", "unknown_tool")
                    tool_input_from_event = event.data.get("input", {})
                    tool_output_from_event = event.data.get("output") # This is the tool result after execution
                    
                    # Tool call started
                    if event.data.get("state") == "invoking": # Custom state if tool logs start
                         yield f"event: tool_call_start\ndata: {json.dumps({'tool_name': tool_name_from_event, 'input': tool_input_from_event, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                    
                    # Tool call ended (result available)
                    if tool_output_from_event is not None: # Indicates tool has finished
                        tool_call_obj = AgentToolCall(tool_name=tool_name_from_event, tool_input=tool_input_from_event, tool_output=tool_output_from_event)
                        all_tool_calls.append(tool_call_obj)
                        yield f"event: tool_call_end\ndata: {json.dumps(tool_call_obj.model_dump(), default=str)}\n\n"
                
                elif event.type == "llm" and event.name == "agent:parser": # agent:parser node often holds the final AIMessage in LangGraph
                    # This is where we expect the final AIMessage or chunks of it.
                    # The `event.data.get('output')` for an LLM node might contain a `StreamedOutput` list or a final AIMessage.
                    # If it streams chunks, `event.data.get('chunk')` might be present.
                    llm_output = event.data.get("output")
                    if llm_output:
                        if isinstance(llm_output, list): # StreamedOutput is a list of AIMessageChunk or similar
                            for chunk in llm_output:
                                if hasattr(chunk, 'content'):
                                    content_chunk = chunk.content
                                    full_agent_reply += content_chunk
                                    yield f"event: message_chunk\ndata: {json.dumps({'chunk': content_chunk, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                        elif hasattr(llm_output, 'content'): # A single AIMessage
                            final_content = llm_output.content
                            if final_content not in full_agent_reply: # Avoid duplicating if already streamed as chunks
                                full_agent_reply += final_content # Should be the main reply here
                                # This might be the final message, or an intermediate thought.
                                # Depending on graph structure, could yield this or wait for overall completion.
                        elif isinstance(llm_output, str): # Plain string output from LLM node
                             if llm_output not in full_agent_reply:
                                full_agent_reply += llm_output

            # After the loop, the full_agent_reply should be assembled from chunks or the final message.
            # If not fully assembled (e.g. final response comes from a different event or needs explicit fetch):
            if not full_agent_reply:
                 # Attempt to get the final state if stream didn't yield it directly
                 final_state = await devops_agent_engine.ainvoke(input=agent_input, config=agent_config)
                 if isinstance(final_state, dict) and "messages" in final_state:
                     ai_messages = [m.content for m_type, m in final_state["messages"] if m_type == "ai" and hasattr(m, 'content')]
                     full_agent_reply = "\n".join(ai_messages)
                 elif isinstance(final_state, str):
                     full_agent_reply = final_state
                 else:
                     full_agent_reply = "Agent finished but no textual reply extracted from final state."
            
            yield f"event: final_response\ndata: {json.dumps({'reply': full_agent_reply, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            yield f"event: stream_end\ndata: {json.dumps({'status': 'complete', 'session_id': session_id, 'timestamp': datetime.utcnow().isoformat()})}\n\n"

        except HTTPException: # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Error during agent stream for session {session_id}: {str(e)}", exc_info=True)
            error_message = f"Error during agent stream: {str(e)}"
            yield f"event: error\ndata: {json.dumps({'error': error_message, 'session_id': session_id, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
        finally:
            if await fastapi_req.is_disconnected():
                 logger.info(f"Stream for session {session_id} was terminated by client disconnection.")
            # Log the complete interaction once the stream is finished or errors out
            response_data_for_log = AgentResponse(
                session_id=session_id,
                reply=full_agent_reply or "Stream ended before full reply, or error.",
                tool_calls=all_tool_calls if all_tool_calls else None,
                raw_agent_output={"stream_log": raw_agent_parts} if raw_agent_parts else None, # Log collected stream events
                error=error_message,
                request_timestamp=request_timestamp,
                response_timestamp=datetime.utcnow()
            )
            background_tasks.add_task(store_agent_interaction, db, agent_request.user_id, session_id, agent_request, response_data_for_log, interaction_type="stream_full_log")

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post(
    "/feedback",
    summary="Submit feedback on an agent interaction",
    status_code=202 # Accepted
)
async def submit_agent_feedback(
    feedback: FeedbackRequest,
    db = Depends(get_db_connection)
):
    """Allows users to submit feedback on the agent's responses or tool usage."""
    query = """
    INSERT INTO agent_feedback (
        id, user_id, session_id, recommendation_interaction_id, feedback_type, 
        feedback_text, rating, created_at
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    feedback_id = str(uuid.uuid4())
    try:
        async with db.cursor() as cursor:
            await cursor.execute(query, (
                feedback_id,
                feedback.user_id,
                feedback.session_id,
                feedback.recommendation_interaction_id,
                feedback.feedback_type,
                feedback.feedback_text,
                feedback.rating,
                datetime.utcnow()
            ))
        # await db.commit()
        logger.info(f"Stored agent feedback {feedback_id} for user {feedback.user_id}, session {feedback.session_id}")
        return {"message": "Feedback submitted successfully", "feedback_id": feedback_id}
    except Exception as e:
        logger.error(f"Failed to store agent feedback for session {feedback.session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to record feedback.")


@router.get(
    "/interactions/{user_id}",
    summary="Get user's agent interaction history",
    description="Retrieve historical agent interactions for a user."
    # response_model=List[AgentInteractionHistoryItem] # Define this model if needed
)
async def get_agent_interaction_history(
    user_id: str,
    limit: int = Field(default=20, ge=1, le=100),
    offset: int = Field(default=0, ge=0),
    db = Depends(get_db_connection)
):
    """Retrieves a paginated list of agent interactions for a given user."""
    query = """
    SELECT 
        id, session_id, interaction_type, query_text, agent_reply, 
        tool_calls_json, error_message, request_timestamp, response_timestamp
    FROM agent_interactions 
    WHERE user_id = %s 
    ORDER BY request_timestamp DESC 
    LIMIT %s OFFSET %s
    """
    try:
        async with db.cursor() as cursor:
            await cursor.execute(query, (user_id, limit, offset))
            rows = await cursor.fetchall()
            
            history = []
            for row in rows:
                history.append({
                    "interaction_id": row[0],
                    "session_id": row[1],
                    "interaction_type": row[2],
                    "query": row[3],
                    "reply": row[4],
                    "tool_calls": json.loads(row[5]) if row[5] else None,
                    "error": row[6],
                    "request_timestamp": row[7].isoformat(),
                    "response_timestamp": row[8].isoformat()
                })
            return history
    except Exception as e:
        logger.error(f"Failed to retrieve agent interaction history for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve interaction history.")

# The /retrain-models endpoint from the old router is highly specific to the previous agent 
# and ML model structure. It doesn't directly apply to a LangGraph agent using a pre-trained
# Gemini model. Retraining Gemini is not done via an API call like this.
# Fine-tuning or updating DevOps tools in a database (if used by a LangGraph tool) would be a different process.
# Thus, this endpoint is omitted from the MVP refactor of this router.

# Similarly, /analytics/performance would need to be re-thought. Performance of the LangGraph agent
# would be assessed through feedback, logs, and potentially A/B testing or specific metrics on tool usage success,
# rather than the previous model's performance metrics.

logger.info("DevOps Agent Recommendation router configured.") 