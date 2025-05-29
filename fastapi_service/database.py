"""
Enhanced Database module for Careerate AI Platform
Provides async PostgreSQL connections with connection pooling
"""

import asyncio
import logging
from typing import Optional, AsyncGenerator, Dict, Any, List
from contextlib import asynccontextmanager
import asyncpg
from asyncpg import Pool, Connection
import json
from datetime import datetime

from .core.config import get_settings, get_database_config

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database manager with connection pooling and health checks"""
    
    def __init__(self):
        self.pool: Optional[Pool] = None
        self.settings = get_settings()
        self.db_config = get_database_config()
    
    async def initialize(self) -> None:
        """Initialize database connection pool"""
        try:
            # Create connection pool
            self.pool = await asyncpg.create_pool(
                self.db_config["url"],
                min_size=2,
                max_size=self.db_config["pool_size"],
                max_inactive_connection_lifetime=self.db_config["pool_recycle"],
                command_timeout=60
            )
            
            # Test connection
            async with self.pool.acquire() as conn:
                await conn.execute("SELECT 1")
            
            logger.info("Database connection pool initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
    
    async def close(self) -> None:
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    @asynccontextmanager
    async def get_connection(self) -> AsyncGenerator[Connection, None]:
        """Get database connection from pool"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.pool.acquire() as connection:
            try:
                yield connection
            except Exception as e:
                # Log error but let it propagate
                logger.error(f"Database operation error: {e}")
                raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform database health check"""
        try:
            async with self.get_connection() as conn:
                start_time = asyncio.get_event_loop().time()
                await conn.execute("SELECT 1")
                response_time = (asyncio.get_event_loop().time() - start_time) * 1000
                
                # Get pool stats
                pool_stats = {
                    "size": self.pool.get_size(),
                    "idle": self.pool.get_idle_size(),
                    "max_size": self.pool.get_max_size()
                }
                
                return {
                    "status": "healthy",
                    "response_time_ms": round(response_time, 2),
                    "pool_stats": pool_stats
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

# Global database manager instance
db_manager = DatabaseManager()

# Dependency for FastAPI
async def get_db_connection() -> AsyncGenerator[Connection, None]:
    """FastAPI dependency to get database connection"""
    async with db_manager.get_connection() as conn:
        yield conn

# Database operations for AI tools and recommendations
class AIToolsRepository:
    """Repository for AI tools data operations"""
    
    def __init__(self, connection: Connection):
        self.conn = connection
    
    async def get_all_tools(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all AI tools with pagination"""
        query = """
        SELECT id, name, description, category, url, icon, pricing, 
               difficulty, tags, rating, use_cases, integrations, created_at
        FROM ai_tools 
        ORDER BY rating DESC, created_at DESC
        LIMIT $1 OFFSET $2
        """
        
        rows = await self.conn.fetch(query, limit, offset)
        return [dict(row) for row in rows]
    
    async def get_tools_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get AI tools by category"""
        query = """
        SELECT id, name, description, category, url, icon, pricing, 
               difficulty, tags, rating, use_cases, integrations, created_at
        FROM ai_tools 
        WHERE category = $1
        ORDER BY rating DESC
        """
        
        rows = await self.conn.fetch(query, category)
        return [dict(row) for row in rows]
    
    async def search_tools(self, search_term: str) -> List[Dict[str, Any]]:
        """Search AI tools by name, description, or tags"""
        query = """
        SELECT id, name, description, category, url, icon, pricing, 
               difficulty, tags, rating, use_cases, integrations, created_at
        FROM ai_tools 
        WHERE name ILIKE $1 
           OR description ILIKE $1 
           OR $2 = ANY(tags)
           OR $2 = ANY(use_cases)
        ORDER BY rating DESC
        """
        
        search_pattern = f"%{search_term}%"
        rows = await self.conn.fetch(query, search_pattern, search_term)
        return [dict(row) for row in rows]
    
    async def create_tool(self, tool_data: Dict[str, Any]) -> int:
        """Create a new AI tool"""
        query = """
        INSERT INTO ai_tools 
        (name, description, category, url, icon, pricing, difficulty, tags, rating, use_cases, integrations)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        """
        
        tool_id = await self.conn.fetchval(
            query,
            tool_data.get("name"),
            tool_data.get("description"),
            tool_data.get("category"),
            tool_data.get("url"),
            tool_data.get("icon"),
            tool_data.get("pricing"),
            tool_data.get("difficulty"),
            tool_data.get("tags", []),
            tool_data.get("rating", 0.0),
            tool_data.get("use_cases", []),
            tool_data.get("integrations", [])
        )
        
        return tool_id
    
    async def update_tool_rating(self, tool_id: int, new_rating: float) -> None:
        """Update tool rating"""
        query = "UPDATE ai_tools SET rating = $1 WHERE id = $2"
        await self.conn.execute(query, new_rating, tool_id)

class RecommendationsRepository:
    """Repository for recommendations data operations"""
    
    def __init__(self, connection: Connection):
        self.conn = connection
    
    async def create_recommendation(self, rec_data: Dict[str, Any]) -> int:
        """Create a new recommendation"""
        query = """
        INSERT INTO recommendations 
        (user_id, type, title, description, priority, match_score, reasoning, metadata, status, tools, learning_path_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        """
        
        rec_id = await self.conn.fetchval(
            query,
            rec_data.get("user_id"),
            rec_data.get("type", "ai_tool"),
            rec_data.get("title"),
            rec_data.get("description"),
            rec_data.get("priority", "medium"),
            rec_data.get("match_score", 0),
            rec_data.get("reasoning"),
            json.dumps(rec_data.get("metadata", {})),
            rec_data.get("status", "pending"),
            json.dumps(rec_data.get("tools", [])),
            rec_data.get("learning_path_id")
        )
        
        return rec_id
    
    async def get_user_recommendations(
        self, 
        user_id: str, 
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get recommendations for a user"""
        base_query = """
        SELECT id, user_id, type, title, description, priority, match_score, 
               reasoning, metadata, status, tools, learning_path_id, created_at, updated_at
        FROM recommendations 
        WHERE user_id = $1
        """
        
        params = [user_id]
        
        if status:
            base_query += " AND status = $2"
            params.append(status)
            base_query += " ORDER BY created_at DESC LIMIT $3 OFFSET $4"
            params.extend([limit, offset])
        else:
            base_query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3"
            params.extend([limit, offset])
        
        rows = await self.conn.fetch(base_query, *params)
        return [dict(row) for row in rows]
    
    async def update_recommendation_status(self, rec_id: int, status: str) -> None:
        """Update recommendation status"""
        query = """
        UPDATE recommendations 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
        """
        await self.conn.execute(query, status, rec_id)
    
    async def get_recommendation_analytics(
        self, 
        user_id: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get recommendation analytics"""
        base_query = """
        SELECT 
            COUNT(*) as total_recommendations,
            COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_count,
            COUNT(CASE WHEN status = 'liked' THEN 1 END) as liked_count,
            COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_count,
            AVG(match_score) as avg_match_score
        FROM recommendations 
        WHERE created_at >= NOW() - INTERVAL '{} days'
        """.format(days)
        
        params = []
        if user_id:
            base_query += " AND user_id = $1"
            params.append(user_id)
        
        row = await self.conn.fetchrow(base_query, *params)
        
        analytics = dict(row) if row else {}
        
        # Calculate rates
        total = analytics.get("total_recommendations", 0)
        if total > 0:
            analytics["implementation_rate"] = (analytics.get("implemented_count", 0) / total) * 100
            analytics["like_rate"] = (analytics.get("liked_count", 0) / total) * 100
            analytics["dismissal_rate"] = (analytics.get("dismissed_count", 0) / total) * 100
        else:
            analytics["implementation_rate"] = 0
            analytics["like_rate"] = 0
            analytics["dismissal_rate"] = 0
        
        return analytics

class UserProgressRepository:
    """Repository for user progress data operations"""
    
    def __init__(self, connection: Connection):
        self.conn = connection
    
    async def track_progress(self, progress_data: Dict[str, Any]) -> int:
        """Track user progress"""
        query = """
        INSERT INTO user_progress 
        (user_id, tool_id, skill_name, progress_type, status, progress_percentage, 
         hours_spent, achievements, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        """
        
        progress_id = await self.conn.fetchval(
            query,
            progress_data.get("user_id"),
            progress_data.get("tool_id"),
            progress_data.get("skill_name"),
            progress_data.get("progress_type"),
            progress_data.get("status"),
            progress_data.get("progress_percentage", 0),
            progress_data.get("hours_spent", 0),
            json.dumps(progress_data.get("achievements", [])),
            json.dumps(progress_data.get("metadata", {}))
        )
        
        return progress_id
    
    async def get_user_progress(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's learning progress"""
        query = """
        SELECT up.*, at.name as tool_name, at.category as tool_category
        FROM user_progress up
        LEFT JOIN ai_tools at ON up.tool_id = at.id
        WHERE up.user_id = $1
        ORDER BY up.updated_at DESC
        """
        
        rows = await self.conn.fetch(query, user_id)
        return [dict(row) for row in rows]
    
    async def update_progress(
        self, 
        progress_id: int, 
        progress_percentage: int,
        hours_spent: Optional[int] = None
    ) -> None:
        """Update progress percentage and hours"""
        if hours_spent is not None:
            query = """
            UPDATE user_progress 
            SET progress_percentage = $1, hours_spent = $2, updated_at = NOW()
            WHERE id = $3
            """
            await self.conn.execute(query, progress_percentage, hours_spent, progress_id)
        else:
            query = """
            UPDATE user_progress 
            SET progress_percentage = $1, updated_at = NOW()
            WHERE id = $2
            """
            await self.conn.execute(query, progress_percentage, progress_id)

class UserActivityRepository:
    """Repository for user activity patterns from Chrome extension"""
    
    def __init__(self, connection: Connection):
        self.conn = connection
    
    async def store_activity_pattern(self, activity_data: Dict[str, Any]) -> int:
        """Store user activity pattern"""
        query = """
        INSERT INTO user_activity_patterns 
        (user_id, activity_type, patterns, time_spent, productivity_score)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        """
        
        activity_id = await self.conn.fetchval(
            query,
            activity_data.get("user_id"),
            activity_data.get("activity_type"),
            json.dumps(activity_data.get("patterns", {})),
            activity_data.get("time_spent", 0),
            activity_data.get("productivity_score", 0.5)
        )
        
        return activity_id
    
    async def get_user_activity_patterns(
        self, 
        user_id: str,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get user activity patterns for analysis"""
        query = """
        SELECT activity_type, patterns, time_spent, productivity_score, recorded_at
        FROM user_activity_patterns 
        WHERE user_id = $1 AND recorded_at >= NOW() - INTERVAL '{} days'
        ORDER BY recorded_at DESC
        """.format(days)
        
        rows = await self.conn.fetch(query, user_id)
        return [dict(row) for row in rows]
    
    async def get_weekly_stats(self, user_id: str) -> Dict[str, Any]:
        """Get weekly activity statistics"""
        query = """
        SELECT 
            COUNT(*) as total_sessions,
            SUM(time_spent) as total_time_spent,
            AVG(productivity_score) as avg_productivity_score,
            array_agg(DISTINCT activity_type) as activity_types
        FROM user_activity_patterns 
        WHERE user_id = $1 AND recorded_at >= NOW() - INTERVAL '7 days'
        """
        
        row = await self.conn.fetchrow(query, user_id)
        return dict(row) if row else {}

# Repository factory functions
async def get_ai_tools_repo(conn: Connection) -> AIToolsRepository:
    """Get AI tools repository"""
    return AIToolsRepository(conn)

async def get_recommendations_repo(conn: Connection) -> RecommendationsRepository:
    """Get recommendations repository"""
    return RecommendationsRepository(conn)

async def get_user_progress_repo(conn: Connection) -> UserProgressRepository:
    """Get user progress repository"""
    return UserProgressRepository(conn)

async def get_user_activity_repo(conn: Connection) -> UserActivityRepository:
    """Get user activity repository"""
    return UserActivityRepository(conn)

# Database initialization and health check functions
async def init_database():
    """Initialize database connection pool"""
    await db_manager.initialize()

async def close_database():
    """Close database connection pool"""
    await db_manager.close()

async def database_health_check() -> Dict[str, Any]:
    """Perform database health check"""
    return await db_manager.health_check()

# Migration helpers (basic)
async def create_tables_if_not_exist():
    """Create tables if they don't exist (basic migration)"""
    # This would typically be handled by a proper migration system
    # like Alembic, but including basic table creation for completeness
    
    create_table_queries = [
        """
        CREATE TABLE IF NOT EXISTS recommendation_feedback (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            recommendation_id VARCHAR NOT NULL,
            feedback_type VARCHAR NOT NULL,
            feedback_text TEXT,
            implementation_success BOOLEAN,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id 
        ON recommendation_feedback(user_id)
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_rec_id 
        ON recommendation_feedback(recommendation_id)
        """
    ]
    
    try:
        async with db_manager.get_connection() as conn:
            for query in create_table_queries:
                await conn.execute(query)
        
        logger.info("Database tables created/verified successfully")
        
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

# Export main components
__all__ = [
    "db_manager",
    "get_db_connection",
    "AIToolsRepository",
    "RecommendationsRepository", 
    "UserProgressRepository",
    "UserActivityRepository",
    "get_ai_tools_repo",
    "get_recommendations_repo",
    "get_user_progress_repo",
    "get_user_activity_repo",
    "init_database",
    "close_database",
    "database_health_check",
    "create_tables_if_not_exist"
] 