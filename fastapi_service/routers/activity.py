"""
Activity Router for Chrome Extension Data Synchronization
Handles user activity patterns and workflow analysis
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime, timedelta

from ..core.config import get_settings
from ..database import get_db_connection, get_user_activity_repo

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for activity data
class ActivityData(BaseModel):
    session_id: str
    tab_id: Optional[int] = None
    url: str
    domain: str
    title: str
    activity_type: str
    ai_tools_detected: List[str] = Field(default_factory=list)
    start_time: int
    end_time: Optional[int] = None
    duration: Optional[int] = None
    productivity_score: float = Field(ge=0.0, le=1.0)
    context: Dict[str, Any] = Field(default_factory=dict)

class SessionMetadata(BaseModel):
    session_id: str
    start_time: int
    user_agent: str
    timezone: str

class ActivitySyncRequest(BaseModel):
    user_id: str
    activities: List[ActivityData]
    current_productivity_score: float = Field(ge=0.0, le=1.0)
    session_metadata: SessionMetadata

class ActivityStatsResponse(BaseModel):
    user_id: str
    total_sessions: int
    total_time_spent: int
    average_productivity_score: float
    activity_distribution: Dict[str, int]
    ai_tools_usage: Dict[str, int]
    peak_hours: List[int]
    focus_sessions_count: int
    period_days: int

class PatternAnalysisResponse(BaseModel):
    user_id: str
    analysis_timestamp: str
    patterns: Dict[str, Any]
    insights: List[str]
    recommendations: List[str]

@router.post(
    "/sync",
    summary="Sync activity data from Chrome extension",
    description="Receive and process activity data from the Chrome extension"
)
async def sync_activities(
    request: ActivitySyncRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db_connection)
):
    """
    Sync activity data from Chrome extension.
    Processes user activities and stores them for analysis.
    """
    try:
        activity_repo = await get_user_activity_repo(db)
        
        # Process each activity
        stored_activities = []
        for activity in request.activities:
            # Prepare activity data for storage
            activity_data = {
                "user_id": request.user_id,
                "activity_type": activity.activity_type,
                "patterns": {
                    "session_id": activity.session_id,
                    "domain": activity.domain,
                    "url": activity.url,
                    "title": activity.title,
                    "ai_tools_detected": activity.ai_tools_detected,
                    "context": activity.context,
                    "start_time": activity.start_time,
                    "end_time": activity.end_time
                },
                "time_spent": activity.duration or 0,
                "productivity_score": activity.productivity_score
            }
            
            # Store activity pattern
            activity_id = await activity_repo.store_activity_pattern(activity_data)
            stored_activities.append(activity_id)
        
        # Update user's current productivity score
        await update_user_productivity_score(
            db, 
            request.user_id, 
            request.current_productivity_score
        )
        
        # Queue background analysis
        background_tasks.add_task(
            analyze_user_patterns_background,
            request.user_id,
            request.session_metadata
        )
        
        logger.info(f"Synced {len(stored_activities)} activities for user {request.user_id}")
        
        return {
            "status": "success",
            "message": f"Synced {len(stored_activities)} activities",
            "activity_ids": stored_activities,
            "sync_timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error syncing activities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to sync activities: {str(e)}")

@router.get(
    "/stats/{user_id}",
    response_model=ActivityStatsResponse,
    summary="Get user activity statistics",
    description="Retrieve comprehensive activity statistics for a user"
)
async def get_activity_stats(
    user_id: str,
    days: int = 7,
    db = Depends(get_db_connection)
):
    """Get comprehensive activity statistics for a user"""
    try:
        activity_repo = await get_user_activity_repo(db)
        
        # Get activity patterns for the specified period
        activities = await activity_repo.get_user_activity_patterns(user_id, days)
        
        if not activities:
            return ActivityStatsResponse(
                user_id=user_id,
                total_sessions=0,
                total_time_spent=0,
                average_productivity_score=0.0,
                activity_distribution={},
                ai_tools_usage={},
                peak_hours=[],
                focus_sessions_count=0,
                period_days=days
            )
        
        # Calculate statistics
        total_sessions = len(activities)
        total_time_spent = sum(activity.get('time_spent', 0) for activity in activities)
        avg_productivity = sum(activity.get('productivity_score', 0) for activity in activities) / total_sessions
        
        # Activity distribution
        activity_distribution = {}
        ai_tools_usage = {}
        hourly_distribution = [0] * 24
        focus_sessions = 0
        
        for activity in activities:
            # Activity type distribution
            activity_type = activity.get('activity_type', 'unknown')
            activity_distribution[activity_type] = activity_distribution.get(activity_type, 0) + 1
            
            # AI tools usage
            patterns = activity.get('patterns', {})
            ai_tools = patterns.get('ai_tools_detected', [])
            for tool in ai_tools:
                ai_tools_usage[tool] = ai_tools_usage.get(tool, 0) + 1
            
            # Peak hours analysis
            if activity.get('recorded_at'):
                hour = activity['recorded_at'].hour
                hourly_distribution[hour] += 1
            
            # Focus sessions (longer than 20 minutes)
            if activity.get('time_spent', 0) > 20 * 60 * 1000:  # 20 minutes in milliseconds
                focus_sessions += 1
        
        # Find peak hours (top 3)
        peak_hours = sorted(range(24), key=lambda h: hourly_distribution[h], reverse=True)[:3]
        
        return ActivityStatsResponse(
            user_id=user_id,
            total_sessions=total_sessions,
            total_time_spent=total_time_spent,
            average_productivity_score=round(avg_productivity, 3),
            activity_distribution=activity_distribution,
            ai_tools_usage=ai_tools_usage,
            peak_hours=peak_hours,
            focus_sessions_count=focus_sessions,
            period_days=days
        )
        
    except Exception as e:
        logger.error(f"Error getting activity stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get activity statistics")

@router.get(
    "/patterns/{user_id}",
    response_model=PatternAnalysisResponse,
    summary="Get user pattern analysis",
    description="Get AI-powered analysis of user work patterns and insights"
)
async def get_pattern_analysis(
    user_id: str,
    days: int = 30,
    db = Depends(get_db_connection)
):
    """Get AI-powered analysis of user work patterns"""
    try:
        activity_repo = await get_user_activity_repo(db)
        
        # Get activity patterns
        activities = await activity_repo.get_user_activity_patterns(user_id, days)
        
        if not activities:
            return PatternAnalysisResponse(
                user_id=user_id,
                analysis_timestamp=datetime.utcnow().isoformat(),
                patterns={},
                insights=["Not enough data for pattern analysis"],
                recommendations=["Continue using the platform to generate insights"]
            )
        
        # Analyze patterns
        patterns = analyze_activity_patterns(activities)
        
        # Generate insights
        insights = generate_pattern_insights(patterns)
        
        # Generate recommendations
        recommendations = generate_pattern_recommendations(patterns)
        
        return PatternAnalysisResponse(
            user_id=user_id,
            analysis_timestamp=datetime.utcnow().isoformat(),
            patterns=patterns,
            insights=insights,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error analyzing patterns: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze patterns")

@router.post(
    "/feedback",
    summary="Submit activity tracking feedback",
    description="Submit feedback about activity tracking accuracy"
)
async def submit_activity_feedback(
    user_id: str,
    feedback_type: str,
    feedback_text: Optional[str] = None,
    activity_session_id: Optional[str] = None,
    db = Depends(get_db_connection)
):
    """Submit feedback about activity tracking"""
    try:
        # Store feedback for improving activity detection
        feedback_data = {
            "user_id": user_id,
            "feedback_type": feedback_type,
            "feedback_text": feedback_text,
            "activity_session_id": activity_session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # This would typically be stored in a feedback table
        logger.info(f"Activity feedback received from user {user_id}: {feedback_type}")
        
        return {
            "status": "success",
            "message": "Feedback received and will be used to improve activity tracking"
        }
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")

@router.delete(
    "/data/{user_id}",
    summary="Delete user activity data",
    description="Delete all activity data for a user (GDPR compliance)"
)
async def delete_user_activity_data(
    user_id: str,
    confirm: bool = False,
    db = Depends(get_db_connection)
):
    """Delete all activity data for a user (GDPR compliance)"""
    if not confirm:
        raise HTTPException(status_code=400, detail="Must confirm deletion with confirm=true")
    
    try:
        # Delete all activity patterns for the user
        query = "DELETE FROM user_activity_patterns WHERE user_id = $1"
        async with db.cursor() as cursor:
            result = await cursor.execute(query, (user_id,))
            deleted_count = result.rowcount if hasattr(result, 'rowcount') else 0
        
        await db.commit()
        
        logger.info(f"Deleted {deleted_count} activity records for user {user_id}")
        
        return {
            "status": "success",
            "message": f"Deleted {deleted_count} activity records",
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Error deleting user data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete user data")

# Helper functions
async def update_user_productivity_score(db, user_id: str, productivity_score: float):
    """Update user's current productivity score"""
    try:
        query = """
        UPDATE users 
        SET preferences = COALESCE(preferences, '{}') || $1
        WHERE id = $2
        """
        
        preferences_update = json.dumps({"current_productivity_score": productivity_score})
        
        async with db.cursor() as cursor:
            await cursor.execute(query, (preferences_update, user_id))
        
        await db.commit()
        
    except Exception as e:
        logger.error(f"Error updating productivity score: {str(e)}")

def analyze_activity_patterns(activities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze activity patterns and extract insights"""
    if not activities:
        return {}
    
    patterns = {
        "total_activities": len(activities),
        "activity_types": {},
        "productivity_trends": [],
        "time_distribution": [0] * 24,
        "ai_tool_adoption": {},
        "focus_patterns": {},
        "domain_usage": {}
    }
    
    total_time = 0
    productivity_scores = []
    
    for activity in activities:
        # Activity type distribution
        activity_type = activity.get('activity_type', 'unknown')
        patterns["activity_types"][activity_type] = patterns["activity_types"].get(activity_type, 0) + 1
        
        # Time and productivity
        time_spent = activity.get('time_spent', 0)
        total_time += time_spent
        productivity_scores.append(activity.get('productivity_score', 0))
        
        # Time distribution
        if activity.get('recorded_at'):
            hour = activity['recorded_at'].hour
            patterns["time_distribution"][hour] += 1
        
        # AI tool usage
        activity_patterns = activity.get('patterns', {})
        ai_tools = activity_patterns.get('ai_tools_detected', [])
        for tool in ai_tools:
            patterns["ai_tool_adoption"][tool] = patterns["ai_tool_adoption"].get(tool, 0) + 1
        
        # Domain usage
        domain = activity_patterns.get('domain', 'unknown')
        patterns["domain_usage"][domain] = patterns["domain_usage"].get(domain, 0) + 1
    
    # Calculate averages and trends
    patterns["average_session_duration"] = total_time / len(activities) if activities else 0
    patterns["average_productivity"] = sum(productivity_scores) / len(productivity_scores) if productivity_scores else 0
    patterns["peak_hours"] = sorted(range(24), key=lambda h: patterns["time_distribution"][h], reverse=True)[:3]
    
    # Focus patterns
    focus_sessions = [a for a in activities if a.get('time_spent', 0) > 20 * 60 * 1000]
    patterns["focus_patterns"] = {
        "count": len(focus_sessions),
        "percentage": (len(focus_sessions) / len(activities)) * 100 if activities else 0,
        "average_duration": sum(a.get('time_spent', 0) for a in focus_sessions) / len(focus_sessions) if focus_sessions else 0
    }
    
    return patterns

def generate_pattern_insights(patterns: Dict[str, Any]) -> List[str]:
    """Generate insights from activity patterns"""
    insights = []
    
    if not patterns:
        return ["Not enough data to generate insights"]
    
    # Productivity insights
    avg_productivity = patterns.get("average_productivity", 0)
    if avg_productivity > 0.8:
        insights.append("You maintain high productivity levels across your work sessions")
    elif avg_productivity < 0.5:
        insights.append("There's room for improvement in your productivity patterns")
    
    # Focus insights
    focus_patterns = patterns.get("focus_patterns", {})
    focus_percentage = focus_patterns.get("percentage", 0)
    if focus_percentage > 30:
        insights.append("You have good focus habits with many deep work sessions")
    elif focus_percentage < 15:
        insights.append("Consider scheduling longer focused work blocks")
    
    # AI tool adoption
    ai_tools = patterns.get("ai_tool_adoption", {})
    if len(ai_tools) > 3:
        insights.append("You're actively exploring multiple AI tools")
    elif len(ai_tools) == 0:
        insights.append("You haven't been using many AI tools - there might be opportunities to enhance your workflow")
    
    # Peak hours
    peak_hours = patterns.get("peak_hours", [])
    if peak_hours:
        peak_hour = peak_hours[0]
        if 9 <= peak_hour <= 11:
            insights.append("You're most active during morning hours - a great time for important tasks")
        elif 13 <= peak_hour <= 15:
            insights.append("Your peak activity is in early afternoon")
        elif peak_hour >= 18:
            insights.append("You tend to be more active in the evening")
    
    return insights

def generate_pattern_recommendations(patterns: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on patterns"""
    recommendations = []
    
    if not patterns:
        return ["Continue using the platform to get personalized recommendations"]
    
    # Activity type recommendations
    activity_types = patterns.get("activity_types", {})
    if "coding" in activity_types and activity_types["coding"] > 5:
        recommendations.append("Consider trying GitHub Copilot or Tabnine for coding assistance")
    
    if "writing" in activity_types and activity_types["writing"] > 3:
        recommendations.append("Grammarly or Jasper AI could help enhance your writing workflow")
    
    if "research" in activity_types and activity_types["research"] > 5:
        recommendations.append("Try Elicit or Semantic Scholar for more efficient research")
    
    # Productivity recommendations
    avg_productivity = patterns.get("average_productivity", 0)
    if avg_productivity < 0.6:
        recommendations.append("Consider using time-blocking techniques and productivity tools like Notion or Todoist")
    
    # Focus recommendations
    focus_patterns = patterns.get("focus_patterns", {})
    if focus_patterns.get("percentage", 0) < 20:
        recommendations.append("Try the Pomodoro Technique or use focus apps to improve deep work sessions")
    
    # AI tool recommendations
    ai_tools = patterns.get("ai_tool_adoption", {})
    if len(ai_tools) < 2:
        recommendations.append("Explore AI tools that match your primary activities to boost productivity")
    
    return recommendations

async def analyze_user_patterns_background(user_id: str, session_metadata: SessionMetadata):
    """Background task to analyze user patterns and trigger recommendations"""
    try:
        # This would trigger the AI recommendation system
        logger.info(f"Background pattern analysis triggered for user {user_id}")
        # Implementation would call the recommendation system
    except Exception as e:
        logger.error(f"Error in background pattern analysis: {str(e)}")

# Export router
__all__ = ["router"] 