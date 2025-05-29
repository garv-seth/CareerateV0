from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Careerate V1 API",
    description="API for Careerate V1 - The AI for AI.",
    version="0.1.0"
)

# CORS (Cross-Origin Resource Sharing) middleware
origins = [
    os.getenv("CLIENT_URL", "http://localhost:5173"), # Frontend URL
    # Add other allowed origins if necessary
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder for database connection setup
# async def get_db():
#     # Replace with actual Drizzle ORM setup and session management
#     # For now, this is a placeholder
#     # from .database import SessionLocal # Example
#     # db = SessionLocal()
#     # try:
#     #     yield db
#     # finally:
#     #     db.close()
#     pass

@app.get("/", tags=["Root"], summary="Root endpoint to check API status")
async def read_root():
    """
    Root endpoint that returns a welcome message and API status.
    """
    return {"message": "Welcome to Careerate V1 API. We are operational!"}

# Placeholder for recommendation routes
from .routers import recommendations
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])

from .routers import activity
app.include_router(activity.router, prefix="/api/v1/activity", tags=["Activity Tracking"])

# Placeholder for user/auth routes (will integrate with Azure AD B2C)
# from .routers import auth_router # Example
# app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000))) 