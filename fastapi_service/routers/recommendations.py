"""
Enhanced Recommendations Router with AI Agent Integration
Provides real-time, personalized AI tool recommendations
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime

from ..core.ai_agents import (
    AIAgentOrchestrator, 
    UserContext, 
    create_ai_orchestrator
)
from ..core.config import get_settings
from ..database import get_db_connection

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
class UserActivityData(BaseModel):
    user_id: str
    activity_patterns: Dict[str, Any]
    skill_level: str = Field(default="intermediate", description="beginner, intermediate, or advanced")
    preferences: Dict[str, Any] = Field(default_factory=dict)
    goals: List[str] = Field(default_factory=list)
    work_domain: str = Field(default="general")
    tools_used: List[str] = Field(default_factory=list)
    productivity_score: float = Field(default=0.5, ge=0.0, le=1.0)

class RecommendationRequest(BaseModel):
    user_data: UserActivityData
    include_learning_paths: bool = Field(default=True)
    include_implementation_guides: bool = Field(default=True)
    max_recommendations: int = Field(default=10, ge=1, le=20)
    real_time: bool = Field(default=False, description="Stream recommendations in real-time")

class RecommendationResponse(BaseModel):
    user_id: str
    analysis_timestamp: str
    recommendations: List[Dict[str, Any]]
    learning_paths: Optional[List[Dict[str, Any]]] = None
    implementation_guides: Optional[List[Dict[str, Any]]] = None
    pattern_insights: Dict[str, Any]
    metadata: Dict[str, Any]

class FeedbackRequest(BaseModel):
    user_id: str
    recommendation_id: str
    feedback_type: str  # "like", "dislike", "implemented", "not_relevant"
    feedback_text: Optional[str] = None
    implementation_success: Optional[bool] = None

# Dependency to get AI orchestrator
async def get_ai_orchestrator() -> AIAgentOrchestrator:
    settings = get_settings()
    config = {
        "openai_api_key": settings.openai_api_key,
        "anthropic_api_key": settings.anthropic_api_key,
        "azure_search_endpoint": settings.azure_search_endpoint,
        "azure_search_key": settings.azure_search_key
    }
    return await create_ai_orchestrator(config)

@router.post(
    "/analyze-and-recommend",
    response_model=RecommendationResponse,
    summary="Get personalized AI tool recommendations",
    description="Analyze user workflow patterns and provide personalized AI tool recommendations with learning paths"
)
async def get_recommendations(
    request: RecommendationRequest,
    background_tasks: BackgroundTasks,
    orchestrator: AIAgentOrchestrator = Depends(get_ai_orchestrator),
    db = Depends(get_db_connection)
):
    """
    Generate personalized AI tool recommendations based on user context and workflow patterns.
    
    This endpoint uses multiple AI agents to:
    1. Analyze user workflow patterns
    2. Discover relevant AI tools
    3. Generate personalized recommendations
    4. Create learning paths (optional)
    5. Provide implementation guides (optional)
    """
    try:
        # Convert request to UserContext
        user_context = UserContext(
            user_id=request.user_data.user_id,
            activity_patterns=request.user_data.activity_patterns,
            skill_level=request.user_data.skill_level,
            preferences=request.user_data.preferences,
            goals=request.user_data.goals,
            work_domain=request.user_data.work_domain,
            tools_used=request.user_data.tools_used,
            productivity_score=request.user_data.productivity_score
        )
        
        # Get comprehensive analysis and recommendations
        analysis_result = await orchestrator.analyze_user_and_recommend(user_context)
        
        # Store recommendations in database for future reference
        background_tasks.add_task(
            store_recommendations,
            db,
            request.user_data.user_id,
            analysis_result
        )
        
        # Prepare response
        response = RecommendationResponse(
            user_id=analysis_result["user_id"],
            analysis_timestamp=analysis_result["analysis_timestamp"],
            recommendations=analysis_result["recommendations"],
            pattern_insights=analysis_result["pattern_insights"],
            metadata={
                "total_recommendations": len(analysis_result["recommendations"]),
                "privacy_compliant": analysis_result["privacy_compliance"],
                "analysis_version": "v2.0"
            }
        )
        
        # Add optional components if requested
        if request.include_learning_paths:
            response.learning_paths = analysis_result.get("learning_paths", [])
        
        if request.include_implementation_guides:
            response.implementation_guides = analysis_result.get("implementation_guides", [])
        
        logger.info(f"Generated {len(analysis_result['recommendations'])} recommendations for user {request.user_data.user_id}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@router.post(
    "/stream-recommendations",
    summary="Stream real-time recommendations",
    description="Get recommendations streamed in real-time as they are generated"
)
async def stream_recommendations(
    request: RecommendationRequest,
    orchestrator: AIAgentOrchestrator = Depends(get_ai_orchestrator)
):
    """
    Stream recommendations in real-time as they are generated by the AI agents.
    Useful for providing immediate feedback to users while analysis is ongoing.
    """
    if not request.real_time:
        raise HTTPException(status_code=400, detail="Real-time flag must be set to true for streaming")
    
    async def generate_stream():
        try:
            user_context = UserContext(
                user_id=request.user_data.user_id,
                activity_patterns=request.user_data.activity_patterns,
                skill_level=request.user_data.skill_level,
                preferences=request.user_data.preferences,
                goals=request.user_data.goals,
                work_domain=request.user_data.work_domain,
                tools_used=request.user_data.tools_used,
                productivity_score=request.user_data.productivity_score
            )
            
            # Stream initial status
            yield f"data: {json.dumps({'status': 'starting_analysis', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            
            # Start pattern analysis
            yield f"data: {json.dumps({'status': 'analyzing_patterns', 'stage': 'pattern_analysis'})}\n\n"
            pattern_insights = await orchestrator.pattern_analyzer.analyze_patterns(user_context)
            yield f"data: {json.dumps({'status': 'pattern_analysis_complete', 'insights': pattern_insights})}\n\n"
            
            # Tool discovery
            yield f"data: {json.dumps({'status': 'discovering_tools', 'stage': 'tool_discovery'})}\n\n"
            available_tools = await orchestrator.tool_discovery_agent.discover_relevant_tools(user_context)
            yield f"data: {json.dumps({'status': 'tools_discovered', 'count': len(available_tools)})}\n\n"
            
            # Generate recommendations
            yield f"data: {json.dumps({'status': 'generating_recommendations', 'stage': 'recommendation_engine'})}\n\n"
            recommendations = await orchestrator.recommendation_engine.generate_recommendations(
                user_context, pattern_insights, available_tools
            )
            
            # Stream recommendations as they're generated
            for i, rec in enumerate(recommendations):
                yield f"data: {json.dumps({'status': 'recommendation_ready', 'index': i, 'recommendation': rec.__dict__})}\n\n"
            
            # Complete
            yield f"data: {json.dumps({'status': 'complete', 'total_recommendations': len(recommendations)})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/plain")

@router.get(
    "/user/{user_id}/history",
    summary="Get user's recommendation history",
    description="Retrieve historical recommendations and their performance for a user"
)
async def get_recommendation_history(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    db = Depends(get_db_connection)
):
    """Get historical recommendations for a user with performance metrics"""
    try:
        # Query database for user's recommendation history
        query = """
        SELECT 
            id,
            type,
            title,
            description,
            match_score,
            status,
            tools,
            reasoning,
            created_at,
            updated_at
        FROM recommendations 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT %s OFFSET %s
        """
        
        async with db.cursor() as cursor:
            await cursor.execute(query, (user_id, limit, offset))
            rows = await cursor.fetchall()
            
            recommendations = []
            for row in rows:
                recommendations.append({
                    "id": row[0],
                    "type": row[1],
                    "title": row[2],
                    "description": row[3],
                    "match_score": row[4],
                    "status": row[5],
                    "tools": row[6],
                    "reasoning": row[7],
                    "created_at": row[8].isoformat() if row[8] else None,
                    "updated_at": row[9].isoformat() if row[9] else None
                })
            
            return {
                "user_id": user_id,
                "recommendations": recommendations,
                "total_count": len(recommendations),
                "limit": limit,
                "offset": offset
            }
            
    except Exception as e:
        logger.error(f"Error fetching recommendation history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendation history")

@router.post(
    "/feedback",
    summary="Submit feedback on recommendations",
    description="Submit user feedback to improve future recommendations"
)
async def submit_feedback(
    feedback: FeedbackRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db_connection)
):
    """
    Submit user feedback on recommendations to improve the AI system.
    This feedback is used for reinforcement learning and model improvement.
    """
    try:
        # Store feedback in database
        query = """
        INSERT INTO recommendation_feedback 
        (user_id, recommendation_id, feedback_type, feedback_text, implementation_success, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        """
        
        async with db.cursor() as cursor:
            await cursor.execute(query, (
                feedback.user_id,
                feedback.recommendation_id,
                feedback.feedback_type,
                feedback.feedback_text,
                feedback.implementation_success
            ))
            await db.commit()
        
        # Update recommendation status if implemented
        if feedback.feedback_type == "implemented":
            await update_recommendation_status(db, feedback.recommendation_id, "implemented")
        
        # Queue background task to retrain models with new feedback
        background_tasks.add_task(process_feedback_for_learning, feedback)
        
        logger.info(f"Feedback received for recommendation {feedback.recommendation_id} from user {feedback.user_id}")
        
        return {
            "status": "success",
            "message": "Feedback received and will be used to improve recommendations",
            "feedback_id": feedback.recommendation_id
        }
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")

@router.get(
    "/analytics/performance",
    summary="Get recommendation performance analytics",
    description="Get analytics on recommendation performance and user engagement"
)
async def get_recommendation_analytics(
    days: int = 30,
    user_id: Optional[str] = None,
    db = Depends(get_db_connection)
):
    """Get recommendation performance analytics"""
    try:
        # Base query for recommendation performance
        base_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as total_recommendations,
            COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_count,
            COUNT(CASE WHEN status = 'liked' THEN 1 END) as liked_count,
            AVG(match_score) as avg_match_score
        FROM recommendations 
        WHERE created_at >= NOW() - INTERVAL '%s days'
        """
        
        params = [days]
        
        if user_id:
            base_query += " AND user_id = %s"
            params.append(user_id)
        
        base_query += " GROUP BY DATE(created_at) ORDER BY date DESC"
        
        async with db.cursor() as cursor:
            await cursor.execute(base_query, params)
            daily_stats = await cursor.fetchall()
            
            # Get overall stats
            overall_query = """
            SELECT 
                COUNT(*) as total_recommendations,
                COUNT(CASE WHEN status = 'implemented' THEN 1 END) as total_implemented,
                AVG(match_score) as avg_match_score,
                COUNT(DISTINCT user_id) as unique_users
            FROM recommendations 
            WHERE created_at >= NOW() - INTERVAL '%s days'
            """
            
            overall_params = [days]
            if user_id:
                overall_query += " AND user_id = %s"
                overall_params.append(user_id)
            
            await cursor.execute(overall_query, overall_params)
            overall_stats = await cursor.fetchone()
            
            return {
                "period_days": days,
                "user_id": user_id,
                "daily_stats": [
                    {
                        "date": row[0].isoformat() if row[0] else None,
                        "total_recommendations": row[1],
                        "implemented_count": row[2],
                        "liked_count": row[3],
                        "avg_match_score": float(row[4]) if row[4] else 0
                    }
                    for row in daily_stats
                ],
                "overall_stats": {
                    "total_recommendations": overall_stats[0],
                    "total_implemented": overall_stats[1],
                    "implementation_rate": (overall_stats[1] / overall_stats[0] * 100) if overall_stats[0] > 0 else 0,
                    "avg_match_score": float(overall_stats[2]) if overall_stats[2] else 0,
                    "unique_users": overall_stats[3] if not user_id else 1
                }
            }
            
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")

@router.post(
    "/retrain-models",
    summary="Trigger model retraining",
    description="Manually trigger retraining of recommendation models (admin only)"
)
async def trigger_model_retraining(
    background_tasks: BackgroundTasks,
    force: bool = False
):
    """Trigger retraining of recommendation models with latest feedback data"""
    try:
        # Queue background task for model retraining
        background_tasks.add_task(retrain_recommendation_models, force)
        
        return {
            "status": "success",
            "message": "Model retraining triggered",
            "force_retrain": force
        }
        
    except Exception as e:
        logger.error(f"Error triggering model retraining: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to trigger model retraining")

# Background task functions
async def store_recommendations(db, user_id: str, analysis_result: Dict[str, Any]):
    """Store recommendations in database for future reference"""
    try:
        for rec in analysis_result["recommendations"]:
            query = """
            INSERT INTO recommendations 
            (user_id, type, title, description, match_score, reasoning, tools, metadata, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            async with db.cursor() as cursor:
                await cursor.execute(query, (
                    user_id,
                    "ai_tool",
                    f"Recommended: {rec['tool_id']}",
                    rec.get('reasoning', ''),
                    int(rec['relevance_score'] * 100),
                    rec.get('reasoning', ''),
                    json.dumps([rec['tool_id']]),
                    json.dumps(rec),
                    "pending"
                ))
        
        await db.commit()
        logger.info(f"Stored {len(analysis_result['recommendations'])} recommendations for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error storing recommendations: {str(e)}")

async def update_recommendation_status(db, recommendation_id: str, status: str):
    """Update recommendation status"""
    try:
        query = "UPDATE recommendations SET status = %s, updated_at = NOW() WHERE id = %s"
        async with db.cursor() as cursor:
            await cursor.execute(query, (status, recommendation_id))
            await db.commit()
    except Exception as e:
        logger.error(f"Error updating recommendation status: {str(e)}")

async def process_feedback_for_learning(feedback: FeedbackRequest):
    """Process feedback for machine learning model improvement"""
    try:
        # This would integrate with MLflow or similar for model retraining
        logger.info(f"Processing feedback for ML improvement: {feedback.feedback_type}")
        # Implementation would depend on specific ML ops setup
    except Exception as e:
        logger.error(f"Error processing feedback for learning: {str(e)}")

async def retrain_recommendation_models(force: bool = False):
    """Retrain recommendation models with latest data"""
    try:
        logger.info("Starting model retraining process")
        # Implementation would integrate with Azure ML or similar
        # This is a placeholder for the actual ML ops pipeline
    except Exception as e:
        logger.error(f"Error in model retraining: {str(e)}") 