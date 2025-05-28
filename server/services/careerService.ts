import { aiService } from './aiService';
import { searchService } from './searchService';
import type { User, InsertRecommendation, InsertCareerInsight } from '@shared/schema';

class CareerService {
  async generatePersonalizedRecommendations(user: User): Promise<Omit<InsertRecommendation, 'userId'>[]> {
    try {
      // Get market insights for the user's role
      const marketInsights = await searchService.getMarketInsights(user.role || 'software engineer');
      
      // Search for relevant AI tools
      const toolSearchResults = await searchService.searchAITools(user.role || 'software engineer');
      
      // Generate AI-powered recommendations
      const aiRecommendations = await aiService.generateToolRecommendations(
        user, 
        toolSearchResults
      );

      // Convert to database format
      const recommendations: Omit<InsertRecommendation, 'userId'>[] = [];

      // Add AI tool recommendations
      aiRecommendations.forEach(rec => {
        recommendations.push({
          type: 'ai_tool',
          title: rec.title,
          description: rec.description,
          reasoning: rec.reasoning,
          matchScore: rec.matchScore,
          priority: rec.priority,
          status: 'pending',
          tools: [{ id: rec.toolId, name: rec.title }],
          metadata: {
            category: 'ai_tool',
            source: 'ai_analysis'
          }
        });
      });

      // Add skill development recommendations based on market trends
      marketInsights.trendingSkills.slice(0, 3).forEach((skill, index) => {
        recommendations.push({
          type: 'skill_development',
          title: `Master ${skill}`,
          description: `${skill} is trending in your field with high market demand`,
          reasoning: `Based on current market analysis, ${skill} shows strong growth potential for ${user.role} roles`,
          matchScore: 85 - (index * 5), // Decreasing priority
          priority: index === 0 ? 'high' : 'medium',
          status: 'pending',
          metadata: {
            skill: skill,
            marketDemand: marketInsights.demandLevel,
            source: 'market_analysis'
          }
        });
      });

      // Add learning path recommendation
      if (user.currentLevel === 'beginner' || (user.aiReadinessScore || 0) < 50) {
        recommendations.push({
          type: 'learning_path',
          title: 'AI Fundamentals Learning Path',
          description: 'Structured path to build your AI knowledge and skills',
          reasoning: 'Your current AI readiness score suggests you would benefit from foundational AI training',
          matchScore: 90,
          priority: 'high',
          status: 'pending',
          metadata: {
            targetLevel: 'intermediate',
            estimatedHours: 20,
            source: 'skill_assessment'
          }
        });
      }

      return recommendations;
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      
      // Fallback recommendations
      return [
        {
          type: 'ai_tool',
          title: 'GitHub Copilot',
          description: 'AI-powered code completion to boost your productivity',
          reasoning: 'Essential tool for modern developers to increase coding efficiency',
          matchScore: 95,
          priority: 'high',
          status: 'pending',
          metadata: { category: 'development', source: 'fallback' }
        }
      ];
    }
  }

  async generateLearningPath(
    user: User,
    options: {
      targetRole: string;
      currentSkills: string[];
      timeCommitment: number;
    }
  ): Promise<Omit<InsertCareerInsight, 'userId'>> {
    try {
      const learningPathData = await aiService.generateLearningPath(
        user,
        options.targetRole,
        options.currentSkills,
        options.timeCommitment
      );

      return {
        insightType: 'learning_path',
        title: learningPathData.title,
        content: learningPathData.description,
        actionItems: learningPathData.steps.map((step: any) => String(step.title)) as string[],
        relevanceScore: 95,
        sources: ['ai_analysis', 'market_data'] as string[]
      };
    } catch (error) {
      console.error("Error generating learning path:", error);
      throw new Error("Failed to generate learning path");
    }
  }

  async generateCareerInsights(
    user: User,
    marketData: any[]
  ): Promise<Omit<InsertCareerInsight, 'userId'>[]> {
    try {
      const insights: Omit<InsertCareerInsight, 'userId'>[] = [];

      // Market trend insight
      if (marketData.length > 0) {
        const trendingTopics = marketData.slice(0, 3).map(data => data.title).join(', ');
        insights.push({
          insightType: 'market_trend',
          title: 'Latest Market Trends in Your Field',
          content: `Current trending topics include: ${trendingTopics}. These areas show significant growth and opportunity.`,
          actionItems: [
            'Research these trending topics in detail',
            'Consider upskilling in high-demand areas',
            'Update your resume to highlight relevant experience'
          ] as string[],
          relevanceScore: 90,
          sources: marketData.map((data: any) => String(data.url)).slice(0, 3) as string[]
        });
      }

      // Skill gap analysis
      const marketInsights = await searchService.getMarketInsights(user.role || 'software engineer');
      
      insights.push({
        insightType: 'skill_gap',
        title: 'Skill Gap Analysis',
        content: `Based on market analysis, professionals in your role should focus on: ${marketInsights.trendingSkills.join(', ')}. AI adoption in your field is at ${marketInsights.aiAdoptionRate}%.`,
        actionItems: [
          'Assess your current skills against market demands',
          'Prioritize learning high-demand skills',
          'Consider AI tools to enhance your workflow'
        ] as string[],
        relevanceScore: 85,
        sources: ['market_analysis'] as string[]
      });

      // Career opportunity insight
      if ((user.aiReadinessScore || 0) < 70) {
        insights.push({
          insightType: 'opportunity',
          title: 'AI Skills Opportunity',
          content: `Your AI readiness score of ${user.aiReadinessScore || 0} indicates significant room for growth. Professionals with strong AI skills command higher salaries and have more career opportunities.`,
          actionItems: [
            'Take the AI skills assessment',
            'Enroll in an AI fundamentals course',
            'Start using AI tools in your daily work',
            'Build an AI-enhanced project portfolio'
          ] as string[],
          relevanceScore: 95,
          sources: ['skill_assessment', 'market_data'] as string[]
        });
      }

      return insights;
    } catch (error) {
      console.error("Error generating career insights:", error);
      
      // Fallback insights
      return [
        {
          insightType: 'market_trend',
          title: 'AI Skills in High Demand',
          content: 'The job market shows increasing demand for AI skills across all tech roles.',
          actionItems: ['Learn AI fundamentals', 'Practice with AI tools'] as string[],
          relevanceScore: 80,
          sources: ['general_market_data'] as string[]
        }
      ];
    }
  }

  async assessAIReadiness(user: User): Promise<{
    score: number;
    level: string;
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
  }> {
    try {
      // Calculate AI readiness score based on user profile
      let score = 0;
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const recommendations: string[] = [];

      // Experience factor (max 30 points)
      const experienceScore = Math.min(30, (user.yearsExperience || 0) * 5);
      score += experienceScore;
      
      if (experienceScore >= 20) {
        strengths.push('Strong professional experience');
      } else {
        weaknesses.push('Limited professional experience');
        recommendations.push('Gain more hands-on experience with real projects');
      }

      // Current role relevance (max 25 points)
      const techRoles = ['software engineer', 'developer', 'data scientist', 'product manager'];
      const roleScore = techRoles.some(role => 
        (user.role || '').toLowerCase().includes(role)) ? 25 : 10;
      score += roleScore;

      if (roleScore >= 20) {
        strengths.push('Tech-relevant role');
      }

      // Current AI readiness (max 45 points)
      const currentReadiness = user.aiReadinessScore || 0;
      score += Math.round(currentReadiness * 0.45);

      if (currentReadiness < 30) {
        weaknesses.push('Limited AI knowledge');
        recommendations.push('Start with AI fundamentals course');
        recommendations.push('Experiment with ChatGPT and GitHub Copilot');
      } else if (currentReadiness < 70) {
        recommendations.push('Explore advanced AI tools for your domain');
        recommendations.push('Build AI-enhanced projects');
      } else {
        strengths.push('Strong AI foundation');
      }

      // Determine level
      let level = 'beginner';
      if (score >= 70) level = 'advanced';
      else if (score >= 40) level = 'intermediate';

      return {
        score: Math.min(100, score),
        level,
        recommendations,
        strengths,
        weaknesses
      };
    } catch (error) {
      console.error("Error assessing AI readiness:", error);
      
      return {
        score: 50,
        level: 'intermediate',
        recommendations: ['Complete AI readiness assessment', 'Explore AI tools for your role'],
        strengths: ['Professional experience'],
        weaknesses: ['Needs AI skill development']
      };
    }
  }
}

export const careerService = new CareerService();
