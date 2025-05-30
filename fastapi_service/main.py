from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Import core settings to ensure they are loaded and validated on startup
from .core.config import settings, validate_required_settings # Validate settings on import

app = FastAPI(
    title="Careerate - DevOps MVP AI Agent Service",
    description="API for the Careerate DevOps-focused AI Agent, powered by LangGraph and Gemini.",
    version="1.0.0-mvp"
)

# CORS (Cross-Origin Resource Sharing) middleware
# origins = [
#     os.getenv("CLIENT_URL", "http://localhost:5173"), # Frontend URL
#     # Add other allowed origins if necessary
# ]
# Using origins from settings.CORS_ORIGINS which can be loaded from .env or Key Vault

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS, # Use centralized CORS origins from config
    allow_credentials=True,
    allow_methods=["*"], # Allows all standard methods
    allow_headers=["*"], # Allows all headers
)

# Database tables reminder:
# The new DevOps agent router uses tables: `agent_interactions` and `agent_feedback`.
# Ensure these tables are created in your PostgreSQL database.
# Example DDL (adjust types and constraints as needed for your DB):
# CREATE TABLE agent_interactions (
#     id UUID PRIMARY KEY,
#     user_id VARCHAR(255) NOT NULL,
#     session_id VARCHAR(255) NOT NULL,
#     interaction_type VARCHAR(50),
#     query_text TEXT,
#     cli_history JSONB,
#     file_context JSONB,
#     agent_reply TEXT,
#     tool_calls_json JSONB,
#     raw_response_json JSONB,
#     error_message TEXT,
#     request_timestamp TIMESTAMPTZ NOT NULL,
#     response_timestamp TIMESTAMPTZ NOT NULL,
#     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
# );
# CREATE INDEX idx_agent_interactions_user_session ON agent_interactions (user_id, session_id);
#
# CREATE TABLE agent_feedback (
#     id UUID PRIMARY KEY,
#     user_id VARCHAR(255) NOT NULL,
#     session_id VARCHAR(255) NOT NULL,
#     recommendation_interaction_id UUID, -- Can link to a specific interaction if needed
#     feedback_type VARCHAR(100) NOT NULL,
#     feedback_text TEXT,
#     rating INT, -- e.g., 1-5
#     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
#     FOREIGN KEY (recommendation_interaction_id) REFERENCES agent_interactions(id) ON DELETE SET NULL
# );
# CREATE INDEX idx_agent_feedback_user_session ON agent_feedback (user_id, session_id);


@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI application startup...")
    # Perform initial settings validation (already called at core.config import, but good to be explicit)
    validate_required_settings()
    logger.info(f"Running in environment: {settings.environment}, Debug mode: {settings.debug}")
    logger.info(f"CORS origins allowed: {settings.CORS_ORIGINS}")
    # Initialize database connection pool if it's not managed by Depends context
    # from .database import create_db_pool, close_db_pool # Example
    # await create_db_pool()
    # Initialize LangGraph Agent (it's initialized on import, but can add a check here)
    from .core.devops_langgraph_agent import devops_agent_engine
    if devops_agent_engine:
        logger.info("DevOps LangGraph Agent is initialized and ready.")
    else:
        logger.error("CRITICAL: DevOps LangGraph Agent failed to initialize. API may not function correctly.")
    logger.info("Startup complete.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("FastAPI application shutting down...")
    # Clean up resources, e.g., database connection pool
    # from .database import close_db_pool # Example
    # await close_db_pool()
    logger.info("Shutdown complete.")

@app.get("/", tags=["Root"], summary="Root endpoint to check API status")
async def read_root():
    """
    Root endpoint that returns a welcome message and API status.
    """
    return {"message": f"Welcome to {settings.PROJECT_NAME}. We are operational!", "version": settings.app_version}

# Import the refactored recommendations router (now DevOps Agent Router)
from .routers import recommendations as devops_agent_router # Alias for clarity
app.include_router(
    devops_agent_router.router, 
    prefix=f"{settings.API_V1_STR}/devops-agent", # Use prefix from settings
    tags=["DevOps Agent"]
)

# Activity tracking router (assuming it's still relevant for context gathering)
from .routers import activity
app.include_router(
    activity.router, 
    prefix=f"{settings.API_V1_STR}/activity", 
    tags=["Activity Tracking"]
)

# Placeholder for user/auth routes (if FastAPI service needs direct auth)
# For MVP, assuming auth is handled by Node.js backend primarily.
# from .routers import auth_router # Example
# app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])

# Logging setup (basic, can be expanded with structured logging)
import logging
logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__) # Get logger for main module

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting Uvicorn server for {settings.PROJECT_NAME}...")
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8002)), # Changed default port to 8002 to avoid conflict with Node API
        reload=settings.DEBUG, # Enable reload in debug mode
        log_level=settings.LOG_LEVEL.lower()
    ) 