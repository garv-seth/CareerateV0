"""
Advanced AI Agent System for Careerate Platform
Multi-agent orchestration for personalized AI tool recommendations
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum

import openai
import anthropic
from azure.search.documents.aio import SearchClient
from azure.core.credentials import AzureKeyCredential
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import httpx

logger = logging.getLogger(__name__)

class AgentType(Enum):
    ORCHESTRATOR = "orchestrator"
    PATTERN_ANALYZER = "pattern_analyzer"
    TOOL_DISCOVERY = "tool_discovery"
    RECOMMENDATION_ENGINE = "recommendation_engine"
    LEARNING_PATH_GENERATOR = "learning_path_generator"
    IMPLEMENTATION_GUIDE = "implementation_guide"
    PRIVACY_GUARDIAN = "privacy_guardian"

@dataclass
class UserContext:
    user_id: str
    activity_patterns: Dict[str, Any]
    skill_level: str
    preferences: Dict[str, Any]
    goals: List[str]
    work_domain: str
    tools_used: List[str]
    productivity_score: float

@dataclass
class AITool:
    id: str
    name: str
    category: str
    description: str
    capabilities: List[str]
    pricing_model: str
    difficulty_level: str
    integration_complexity: int
    user_rating: float
    use_cases: List[str]

@dataclass
class Recommendation:
    tool_id: str
    relevance_score: float
    confidence: float
    reasoning: str
    implementation_complexity: int
    expected_impact: str
    learning_time_hours: int

class AIAgentOrchestrator:
    """Main orchestrator for all AI agents"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.openai_client = openai.AsyncOpenAI(api_key=config.get("openai_api_key"))
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=config.get("anthropic_api_key"))
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize specialized agents
        self.pattern_analyzer = PatternAnalysisAgent(self.openai_client)
        self.tool_discovery_agent = ToolDiscoveryAgent(self.openai_client)
        self.recommendation_engine = RecommendationEngine(self.anthropic_client, self.embedding_model)
        self.learning_path_generator = LearningPathGenerator(self.anthropic_client)
        self.implementation_guide_agent = ImplementationGuideAgent(self.openai_client)
        self.privacy_guardian = PrivacyGuardianAgent()
        
        logger.info("AI Agent Orchestrator initialized successfully")
    
    async def analyze_user_and_recommend(self, user_context: UserContext) -> Dict[str, Any]:
        """Main entry point for comprehensive user analysis and recommendations"""
        try:
            # Privacy check first
            sanitized_context = await self.privacy_guardian.sanitize_user_data(user_context)
            
            # Parallel execution of analysis tasks
            pattern_analysis_task = self.pattern_analyzer.analyze_patterns(sanitized_context)
            tool_discovery_task = self.tool_discovery_agent.discover_relevant_tools(sanitized_context)
            
            pattern_insights, available_tools = await asyncio.gather(
                pattern_analysis_task, tool_discovery_task
            )
            
            # Generate recommendations based on analysis
            recommendations = await self.recommendation_engine.generate_recommendations(
                sanitized_context, pattern_insights, available_tools
            )
            
            # Create learning paths for top recommendations
            top_tools = [rec.tool_id for rec in recommendations[:5]]
            learning_paths = await self.learning_path_generator.create_learning_paths(
                sanitized_context, top_tools
            )
            
            # Generate implementation guides
            implementation_guides = await self.implementation_guide_agent.generate_guides(
                sanitized_context, recommendations[:3]
            )
            
            return {
                "user_id": user_context.user_id,
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "pattern_insights": pattern_insights,
                "recommendations": [asdict(rec) for rec in recommendations],
                "learning_paths": learning_paths,
                "implementation_guides": implementation_guides,
                "privacy_compliance": True
            }
            
        except Exception as e:
            logger.error(f"Error in user analysis: {str(e)}")
            raise

class PatternAnalysisAgent:
    """Analyzes user workflow patterns and identifies optimization opportunities"""
    
    def __init__(self, openai_client):
        self.client = openai_client
    
    async def analyze_patterns(self, user_context: UserContext) -> Dict[str, Any]:
        """Analyze user activity patterns and identify bottlenecks"""
        try:
            prompt = f"""
            Analyze the following user workflow patterns and identify optimization opportunities:
            
            User Context:
            - Skill Level: {user_context.skill_level}
            - Work Domain: {user_context.work_domain}
            - Current Tools: {', '.join(user_context.tools_used)}
            - Productivity Score: {user_context.productivity_score}
            - Activity Patterns: {json.dumps(user_context.activity_patterns, indent=2)}
            
            Please provide:
            1. Key workflow bottlenecks
            2. Productivity improvement opportunities
            3. Tool usage inefficiencies
            4. Recommended workflow optimizations
            5. Skill gaps that could be addressed with AI tools
            
            Format response as JSON with the structure:
            {{
                "bottlenecks": [],
                "opportunities": [],
                "inefficiencies": [],
                "optimizations": [],
                "skill_gaps": []
            }}
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500
            )
            
            analysis = json.loads(response.choices[0].message.content)
            return analysis
            
        except Exception as e:
            logger.error(f"Error in pattern analysis: {str(e)}")
            return {"error": str(e)}

class ToolDiscoveryAgent:
    """Discovers and maintains database of AI tools with their capabilities"""
    
    def __init__(self, openai_client):
        self.client = openai_client
        self.tools_cache = {}
    
    async def discover_relevant_tools(self, user_context: UserContext) -> List[AITool]:
        """Discover AI tools relevant to user's context and needs"""
        try:
            # Get tools from multiple sources
            curated_tools = await self._get_curated_tools(user_context.work_domain)
            trending_tools = await self._discover_trending_tools()
            
            # Filter and rank tools based on user context
            relevant_tools = await self._rank_tools_by_relevance(
                curated_tools + trending_tools, user_context
            )
            
            return relevant_tools[:20]  # Return top 20 relevant tools
            
        except Exception as e:
            logger.error(f"Error in tool discovery: {str(e)}")
            return []
    
    async def _get_curated_tools(self, work_domain: str) -> List[AITool]:
        """Get curated tools for specific work domain"""
        # This would typically connect to your tools database
        # For now, returning sample tools
        return [
            AITool(
                id="gpt4",
                name="GPT-4",
                category="writing",
                description="Advanced language model for content creation",
                capabilities=["text_generation", "editing", "summarization"],
                pricing_model="usage_based",
                difficulty_level="beginner",
                integration_complexity=2,
                user_rating=4.8,
                use_cases=["writing", "brainstorming", "analysis"]
            ),
            AITool(
                id="claude3",
                name="Claude 3",
                category="analysis",
                description="Advanced AI for complex reasoning and analysis",
                capabilities=["reasoning", "analysis", "code_review"],
                pricing_model="usage_based",
                difficulty_level="intermediate",
                integration_complexity=3,
                user_rating=4.7,
                use_cases=["research", "code_review", "strategic_planning"]
            )
        ]
    
    async def _discover_trending_tools(self) -> List[AITool]:
        """Discover trending AI tools from various sources"""
        # Implementation for scraping/API calls to discover new tools
        return []
    
    async def _rank_tools_by_relevance(self, tools: List[AITool], user_context: UserContext) -> List[AITool]:
        """Rank tools by relevance to user context using AI"""
        # Use embeddings and similarity scoring
        return tools  # Simplified for now

class RecommendationEngine:
    """Advanced recommendation engine using multiple ML approaches"""
    
    def __init__(self, anthropic_client, embedding_model):
        self.client = anthropic_client
        self.embedding_model = embedding_model
    
    async def generate_recommendations(
        self, 
        user_context: UserContext, 
        pattern_insights: Dict[str, Any], 
        available_tools: List[AITool]
    ) -> List[Recommendation]:
        """Generate personalized tool recommendations"""
        try:
            # Create user profile embedding
            user_profile = self._create_user_profile(user_context, pattern_insights)
            user_embedding = self.embedding_model.encode(user_profile)
            
            recommendations = []
            
            for tool in available_tools:
                # Calculate relevance score using multiple factors
                relevance_score = await self._calculate_relevance_score(
                    tool, user_context, pattern_insights, user_embedding
                )
                
                # Generate reasoning using Claude
                reasoning = await self._generate_reasoning(tool, user_context, relevance_score)
                
                # Calculate implementation complexity and impact
                complexity = self._calculate_implementation_complexity(tool, user_context)
                impact = await self._predict_impact(tool, user_context)
                learning_time = self._estimate_learning_time(tool, user_context)
                
                recommendation = Recommendation(
                    tool_id=tool.id,
                    relevance_score=relevance_score,
                    confidence=min(relevance_score * 1.2, 1.0),
                    reasoning=reasoning,
                    implementation_complexity=complexity,
                    expected_impact=impact,
                    learning_time_hours=learning_time
                )
                
                recommendations.append(recommendation)
            
            # Sort by relevance score and return top recommendations
            recommendations.sort(key=lambda x: x.relevance_score, reverse=True)
            return recommendations[:10]
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []
    
    def _create_user_profile(self, user_context: UserContext, pattern_insights: Dict[str, Any]) -> str:
        """Create a text profile for embedding generation"""
        profile_parts = [
            f"User skill level: {user_context.skill_level}",
            f"Work domain: {user_context.work_domain}",
            f"Current tools: {', '.join(user_context.tools_used)}",
            f"Goals: {', '.join(user_context.goals)}",
            f"Productivity score: {user_context.productivity_score}"
        ]
        
        if pattern_insights.get('skill_gaps'):
            profile_parts.append(f"Skill gaps: {', '.join(pattern_insights['skill_gaps'])}")
        
        return " ".join(profile_parts)
    
    async def _calculate_relevance_score(
        self, 
        tool: AITool, 
        user_context: UserContext, 
        pattern_insights: Dict[str, Any],
        user_embedding: np.ndarray
    ) -> float:
        """Calculate relevance score using multiple factors"""
        # Tool embedding
        tool_profile = f"{tool.name} {tool.description} {' '.join(tool.capabilities)} {' '.join(tool.use_cases)}"
        tool_embedding = self.embedding_model.encode(tool_profile)
        
        # Semantic similarity
        semantic_similarity = cosine_similarity([user_embedding], [tool_embedding])[0][0]
        
        # Skill level matching
        skill_match = self._calculate_skill_match(tool, user_context)
        
        # Domain relevance
        domain_relevance = self._calculate_domain_relevance(tool, user_context)
        
        # Current tools compatibility
        tool_compatibility = self._calculate_tool_compatibility(tool, user_context)
        
        # Weighted combination
        relevance_score = (
            semantic_similarity * 0.3 +
            skill_match * 0.25 +
            domain_relevance * 0.25 +
            tool_compatibility * 0.2
        )
        
        return min(relevance_score, 1.0)
    
    def _calculate_skill_match(self, tool: AITool, user_context: UserContext) -> float:
        """Calculate how well tool difficulty matches user skill level"""
        skill_levels = {"beginner": 1, "intermediate": 2, "advanced": 3}
        user_level = skill_levels.get(user_context.skill_level, 1)
        tool_level = skill_levels.get(tool.difficulty_level, 2)
        
        # Prefer tools slightly above user level for growth
        if tool_level == user_level + 1:
            return 1.0
        elif tool_level == user_level:
            return 0.8
        elif tool_level == user_level - 1:
            return 0.6
        else:
            return 0.3
    
    def _calculate_domain_relevance(self, tool: AITool, user_context: UserContext) -> float:
        """Calculate domain-specific relevance"""
        # Simple keyword matching for now
        domain_keywords = user_context.work_domain.lower().split()
        tool_text = f"{tool.category} {' '.join(tool.use_cases)}".lower()
        
        matches = sum(1 for keyword in domain_keywords if keyword in tool_text)
        return min(matches / len(domain_keywords), 1.0) if domain_keywords else 0.5
    
    def _calculate_tool_compatibility(self, tool: AITool, user_context: UserContext) -> float:
        """Calculate compatibility with existing tools"""
        # Check if tool complements existing tools
        existing_categories = set()
        for existing_tool in user_context.tools_used:
            # This would look up categories from tool database
            pass
        
        # For now, return moderate compatibility
        return 0.7
    
    async def _generate_reasoning(self, tool: AITool, user_context: UserContext, relevance_score: float) -> str:
        """Generate explanation for why this tool is recommended"""
        try:
            prompt = f"""
            Explain why {tool.name} is recommended for this user in 2-3 sentences:
            
            Tool: {tool.name}
            Description: {tool.description}
            Capabilities: {', '.join(tool.capabilities)}
            
            User Context:
            - Skill Level: {user_context.skill_level}
            - Work Domain: {user_context.work_domain}
            - Goals: {', '.join(user_context.goals)}
            - Current Tools: {', '.join(user_context.tools_used)}
            
            Relevance Score: {relevance_score:.2f}
            
            Provide a clear, actionable explanation.
            """
            
            response = await self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return response.content[0].text.strip()
            
        except Exception as e:
            logger.error(f"Error generating reasoning: {str(e)}")
            return f"Recommended based on relevance to your {user_context.work_domain} work and {user_context.skill_level} skill level."
    
    def _calculate_implementation_complexity(self, tool: AITool, user_context: UserContext) -> int:
        """Calculate implementation complexity (1-5 scale)"""
        base_complexity = tool.integration_complexity
        
        # Adjust based on user skill level
        skill_adjustment = {
            "beginner": 1,
            "intermediate": 0,
            "advanced": -1
        }
        
        adjusted_complexity = base_complexity + skill_adjustment.get(user_context.skill_level, 0)
        return max(1, min(5, adjusted_complexity))
    
    async def _predict_impact(self, tool: AITool, user_context: UserContext) -> str:
        """Predict expected impact of using this tool"""
        impact_levels = ["Low", "Medium", "High", "Very High"]
        
        # Simple heuristic based on relevance and user needs
        if user_context.productivity_score < 0.6 and tool.user_rating > 4.5:
            return "High"
        elif user_context.productivity_score < 0.8:
            return "Medium"
        else:
            return "Low"
    
    def _estimate_learning_time(self, tool: AITool, user_context: UserContext) -> int:
        """Estimate learning time in hours"""
        base_time = {
            "beginner": 8,
            "intermediate": 4,
            "advanced": 2
        }
        
        difficulty_multiplier = {
            "beginner": 1.0,
            "intermediate": 1.5,
            "advanced": 2.0
        }
        
        base = base_time.get(user_context.skill_level, 6)
        multiplier = difficulty_multiplier.get(tool.difficulty_level, 1.5)
        
        return int(base * multiplier)

class LearningPathGenerator:
    """Generates personalized learning paths for AI tool mastery"""
    
    def __init__(self, anthropic_client):
        self.client = anthropic_client
    
    async def create_learning_paths(
        self, 
        user_context: UserContext, 
        recommended_tools: List[str]
    ) -> List[Dict[str, Any]]:
        """Create step-by-step learning paths for recommended tools"""
        try:
            learning_paths = []
            
            for tool_id in recommended_tools:
                path = await self._create_single_learning_path(user_context, tool_id)
                learning_paths.append(path)
            
            return learning_paths
            
        except Exception as e:
            logger.error(f"Error creating learning paths: {str(e)}")
            return []
    
    async def _create_single_learning_path(
        self, 
        user_context: UserContext, 
        tool_id: str
    ) -> Dict[str, Any]:
        """Create learning path for a single tool"""
        prompt = f"""
        Create a detailed learning path for mastering this AI tool:
        
        Tool ID: {tool_id}
        User Skill Level: {user_context.skill_level}
        Work Domain: {user_context.work_domain}
        Goals: {', '.join(user_context.goals)}
        
        Please provide a structured learning path with:
        1. Learning objectives
        2. Prerequisites
        3. Step-by-step modules (5-7 steps)
        4. Estimated time for each step
        5. Practical exercises
        6. Success metrics
        
        Format as JSON:
        {{
            "tool_id": "{tool_id}",
            "title": "Learning Path Title",
            "objectives": [],
            "prerequisites": [],
            "modules": [
                {{
                    "step": 1,
                    "title": "Module Title",
                    "description": "Module description",
                    "estimated_hours": 2,
                    "exercises": [],
                    "resources": []
                }}
            ],
            "success_metrics": [],
            "total_duration_hours": 20
        }}
        """
        
        try:
            response = await self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            path_data = json.loads(response.content[0].text)
            return path_data
            
        except Exception as e:
            logger.error(f"Error creating learning path for {tool_id}: {str(e)}")
            return {
                "tool_id": tool_id,
                "title": f"Learning Path for {tool_id}",
                "error": str(e)
            }

class ImplementationGuideAgent:
    """Generates step-by-step implementation guides"""
    
    def __init__(self, openai_client):
        self.client = openai_client
    
    async def generate_guides(
        self, 
        user_context: UserContext, 
        recommendations: List[Recommendation]
    ) -> List[Dict[str, Any]]:
        """Generate implementation guides for top recommendations"""
        guides = []
        
        for recommendation in recommendations:
            guide = await self._create_implementation_guide(user_context, recommendation)
            guides.append(guide)
        
        return guides
    
    async def _create_implementation_guide(
        self, 
        user_context: UserContext, 
        recommendation: Recommendation
    ) -> Dict[str, Any]:
        """Create detailed implementation guide"""
        prompt = f"""
        Create a detailed implementation guide for integrating this AI tool:
        
        Tool ID: {recommendation.tool_id}
        User Context: {user_context.work_domain}, {user_context.skill_level}
        Implementation Complexity: {recommendation.implementation_complexity}/5
        
        Provide:
        1. Getting started checklist
        2. Step-by-step setup instructions
        3. Integration examples
        4. Common pitfalls and solutions
        5. Success metrics
        6. Next steps for optimization
        
        Format as practical, actionable guide.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,
                temperature=0.3
            )
            
            return {
                "tool_id": recommendation.tool_id,
                "title": f"Implementation Guide for {recommendation.tool_id}",
                "content": response.choices[0].message.content,
                "complexity": recommendation.implementation_complexity,
                "estimated_setup_time": f"{recommendation.learning_time_hours // 4} hours"
            }
            
        except Exception as e:
            logger.error(f"Error creating implementation guide: {str(e)}")
            return {
                "tool_id": recommendation.tool_id,
                "error": str(e)
            }

class PrivacyGuardianAgent:
    """Ensures data privacy and compliance"""
    
    async def sanitize_user_data(self, user_context: UserContext) -> UserContext:
        """Remove or anonymize sensitive information"""
        # Create a copy to avoid modifying original
        sanitized = UserContext(
            user_id=self._anonymize_user_id(user_context.user_id),
            activity_patterns=self._sanitize_activity_patterns(user_context.activity_patterns),
            skill_level=user_context.skill_level,
            preferences=self._sanitize_preferences(user_context.preferences),
            goals=self._sanitize_goals(user_context.goals),
            work_domain=user_context.work_domain,
            tools_used=user_context.tools_used,
            productivity_score=user_context.productivity_score
        )
        
        return sanitized
    
    def _anonymize_user_id(self, user_id: str) -> str:
        """Anonymize user ID for AI processing"""
        import hashlib
        return hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    def _sanitize_activity_patterns(self, patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from activity patterns"""
        # Remove any potential PII or sensitive content
        sanitized = {}
        for key, value in patterns.items():
            if key not in ['personal_info', 'sensitive_data', 'private_urls']:
                sanitized[key] = value
        return sanitized
    
    def _sanitize_preferences(self, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize user preferences"""
        # Keep only non-sensitive preferences
        safe_keys = ['theme', 'notifications', 'learning_style', 'difficulty_preference']
        return {k: v for k, v in preferences.items() if k in safe_keys}
    
    def _sanitize_goals(self, goals: List[str]) -> List[str]:
        """Remove potentially sensitive goal information"""
        # Filter out goals that might contain sensitive information
        sanitized_goals = []
        for goal in goals:
            # Simple keyword filtering (would be more sophisticated in production)
            sensitive_keywords = ['salary', 'personal', 'confidential', 'private']
            if not any(keyword in goal.lower() for keyword in sensitive_keywords):
                sanitized_goals.append(goal)
        return sanitized_goals

# Factory function for creating orchestrator
async def create_ai_orchestrator(config: Dict[str, Any]) -> AIAgentOrchestrator:
    """Factory function to create and initialize AI orchestrator"""
    orchestrator = AIAgentOrchestrator(config)
    return orchestrator 