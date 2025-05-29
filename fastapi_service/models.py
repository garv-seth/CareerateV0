from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class RecommendationRequest(BaseModel):
    user_id: str = Field(..., description="Unique identifier for the user")
    # Add other fields relevant for generating recommendations, e.g., user's recent activity, preferences
    current_tools_used: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None

class ToolRecommendation(BaseModel):
    tool_name: str
    description: str
    category: str
    reasoning: Optional[str] = None
    action_url: Optional[str] = None # Link to the tool or more info

class ProductivityHack(BaseModel):
    hack_name: str
    description: str
    category: str # e.g., Time Management, Focus, Collaboration
    reasoning: Optional[str] = None
    action_details: Optional[str] = None # How to implement it

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict[str, Any]] # List of ToolRecommendation or ProductivityHack
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(BaseModel):
    user_id: str
    email: EmailStr
    # Add other profile fields as needed based on V1 scope
    # e.g., work_habits_summary (text), tracked_apps (list)

# Feedback models
class FeedbackBase(BaseModel):
    recommendation_id: str # Could be an ID of a recommendation delivered
    rating: str # e.g., 'thumbs_up', 'thumbs_down', or 1-5 stars
    comment: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    user_id: str

class FeedbackResponse(FeedbackBase):
    feedback_id: str
    user_id: str
    submitted_at: datetime

# Chrome Extension Activity Tracking Models
class SiteActivity(BaseModel):
    totalTimeSeconds: int
    lastAccess: int # Timestamp (milliseconds since epoch)

class ActivityDataPayload(BaseModel):
    userId: str
    timestamp: datetime # ISO format string from client
    data: Dict[str, SiteActivity] # hostname -> SiteActivity

class ActivityTrackResponse(BaseModel):
    status: str
    message: Optional[str] = None
    received_entries: int 