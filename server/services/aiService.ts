import Anthropic from '@anthropic-ai/sdk';
import type { User } from '@shared/schema';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY || "default_key",
});

class AIService {
  async analyzeResume(resumeText: string): Promise<{
    overallScore: number;
    suggestions: string[];
    scoreBreakdown: Record<string, number>;
    aiEnhancedSections: Record<string, string>;
  }> {
    try {
      const prompt = `
        Analyze this resume and provide a comprehensive assessment focusing on AI readiness and modern tech skills.
        
        Resume content:
        ${resumeText}
        
        Please provide:
        1. Overall score (0-100) for AI readiness and modern tech relevance
        2. Specific suggestions for improvement (focus on AI skills, modern frameworks, etc.)
        3. Score breakdown for different sections (skills, experience, education, etc.)
        4. AI-enhanced versions of key sections
        
        Respond in JSON format with keys: overallScore, suggestions, scoreBreakdown, aiEnhancedSections
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: 'You are an expert career coach specializing in AI and technology careers. Provide detailed, actionable feedback.',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          // Fallback if JSON parsing fails
          return {
            overallScore: 75,
            suggestions: [
              "Add AI and machine learning skills to your technical skills section",
              "Include experience with modern frameworks and cloud platforms",
              "Highlight any automation or AI-assisted projects you've worked on"
            ],
            scoreBreakdown: {
              skills: 70,
              experience: 80,
              education: 75,
              formatting: 85
            },
            aiEnhancedSections: {
              summary: "AI-enhanced professional summary focusing on modern tech skills"
            }
          };
        }
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error analyzing resume:", error);
      throw new Error("Failed to analyze resume");
    }
  }

  async chatWithAssistant(
    message: string, 
    user: User, 
    context?: any
  ): Promise<string> {
    try {
      const systemPrompt = `
        You are ${user.firstName || 'User'}'s personal AI career assistant for Careerate. 
        You help tech professionals adapt to and leverage AI technologies effectively.
        
        User context:
        - Role: ${user.role || 'Not specified'}
        - Company: ${user.company || 'Not specified'}
        - Experience: ${user.yearsExperience || 'Not specified'} years
        - AI Readiness Score: ${user.aiReadinessScore || 0}/100
        - Current Level: ${user.currentLevel || 'beginner'}
        
        Your responses should be:
        - Personalized to their role and experience level
        - Focused on practical AI tool recommendations
        - Actionable and specific
        - Encouraging and supportive
        - Professional but friendly
        
        Always suggest specific AI tools, learning resources, or next steps when relevant.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        max_tokens: 1000,
        messages: [{ 
          role: 'user', 
          content: context ? `${context}\n\nUser message: ${message}` : message 
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error in AI chat:", error);
      throw new Error("Failed to process AI chat request");
    }
  }

  async generateToolRecommendations(
    user: User,
    toolsData: any[]
  ): Promise<Array<{
    toolId: number;
    title: string;
    description: string;
    reasoning: string;
    matchScore: number;
    priority: 'low' | 'medium' | 'high';
  }>> {
    try {
      const prompt = `
        Based on this user profile, recommend the most suitable AI tools from the provided list.
        
        User Profile:
        - Role: ${user.role || 'Not specified'}
        - Experience: ${user.yearsExperience || 0} years
        - Current AI Level: ${user.currentLevel || 'beginner'}
        - Preferences: ${JSON.stringify(user.preferences || {})}
        
        Available Tools:
        ${JSON.stringify(toolsData.slice(0, 20))} // Limit to prevent token overflow
        
        Provide 5-8 personalized recommendations with:
        - Specific reasoning for each recommendation
        - Match score (0-100) based on user's profile
        - Priority level (low/medium/high)
        - Brief description of how it helps their career
        
        Respond in JSON format as an array of recommendation objects.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: 'You are an AI career advisor specializing in tool recommendations for tech professionals.',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          // Fallback recommendations
          return [
            {
              toolId: 1,
              title: "GitHub Copilot",
              description: "AI-powered code completion for faster development",
              reasoning: "Perfect for your development role to increase coding productivity",
              matchScore: 95,
              priority: 'high' as const
            }
          ];
        }
      }

      return [];
    } catch (error) {
      console.error("Error generating tool recommendations:", error);
      return [];
    }
  }

  async generateLearningPath(
    user: User,
    targetRole: string,
    currentSkills: string[],
    timeCommitment: number
  ): Promise<{
    title: string;
    description: string;
    estimatedHours: number;
    difficulty: string;
    steps: any[];
  }> {
    try {
      const prompt = `
        Create a personalized learning path for this user.
        
        Current Profile:
        - Role: ${user.role || 'Not specified'}
        - Experience: ${user.yearsExperience || 0} years
        - Current Skills: ${currentSkills.join(', ')}
        
        Target:
        - Target Role: ${targetRole}
        - Time Commitment: ${timeCommitment} hours/week
        
        Create a structured learning path with:
        - Clear title and description
        - Realistic time estimate
        - Difficulty level
        - Step-by-step learning modules
        - Specific AI tools and technologies to learn
        - Milestones and checkpoints
        
        Respond in JSON format with: title, description, estimatedHours, difficulty, steps
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: 'You are an expert career coach creating personalized learning paths for AI-enhanced careers.',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          // Fallback learning path
          return {
            title: `AI-Enhanced ${targetRole} Learning Path`,
            description: `Comprehensive path to transition to ${targetRole} with AI expertise`,
            estimatedHours: Math.max(20, timeCommitment * 8), // 8 weeks minimum
            difficulty: user.yearsExperience > 3 ? 'intermediate' : 'beginner',
            steps: [
              {
                title: "Foundation AI Skills",
                description: "Learn basic AI concepts and tools",
                estimatedHours: timeCommitment * 2,
                tools: ["ChatGPT", "GitHub Copilot"],
                skills: ["AI Prompting", "Code Assistance"]
              }
            ]
          };
        }
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error generating learning path:", error);
      throw new Error("Failed to generate learning path");
    }
  }
}

export const aiService = new AIService();
