import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Mock AI tools database
const mockAITools = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    category: 'writing',
    description: 'Advanced language model for content creation, analysis, and complex reasoning tasks.',
    capabilities: ['text_generation', 'editing', 'summarization', 'coding', 'analysis'],
    pricing: 'usage_based',
    pricingDetails: '$0.03/1K tokens (input), $0.06/1K tokens (output)',
    difficulty: 'beginner',
    url: 'https://openai.com/gpt-4',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    rating: 4.8,
    reviewCount: 12500,
    tags: ['ai', 'writing', 'coding', 'analysis'],
    useCase: ['content_creation', 'code_assistance', 'research', 'customer_support'],
    integrations: ['api', 'web_interface', 'plugins'],
    learningResources: [
      { type: 'documentation', url: 'https://platform.openai.com/docs' },
      { type: 'tutorial', title: 'GPT-4 Best Practices' }
    ],
    pros: ['Excellent reasoning', 'Versatile applications', 'Strong coding abilities'],
    cons: ['Can be expensive', 'Rate limits', 'Occasional hallucinations']
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    category: 'analysis',
    description: 'Advanced AI assistant for complex reasoning, analysis, and thoughtful conversation.',
    capabilities: ['reasoning', 'analysis', 'writing', 'math', 'coding'],
    pricing: 'usage_based',
    pricingDetails: '$3/million tokens (input), $15/million tokens (output)',
    difficulty: 'intermediate',
    url: 'https://claude.ai',
    icon: 'https://claude.ai/favicon.ico',
    rating: 4.7,
    reviewCount: 8900,
    tags: ['ai', 'analysis', 'reasoning', 'writing'],
    useCase: ['research', 'analysis', 'writing', 'code_review'],
    integrations: ['api', 'web_interface'],
    learningResources: [
      { type: 'documentation', url: 'https://docs.anthropic.com' }
    ],
    pros: ['Strong reasoning', 'Helpful and harmless', 'Good at analysis'],
    cons: ['Limited availability', 'Higher cost', 'Newer ecosystem']
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'coding',
    description: 'AI pair programmer that helps you write code faster with contextual suggestions.',
    capabilities: ['code_generation', 'autocomplete', 'refactoring', 'documentation'],
    pricing: 'subscription',
    pricingDetails: '$10/month for individuals, $19/month for business',
    difficulty: 'beginner',
    url: 'https://github.com/features/copilot',
    icon: 'https://github.githubassets.com/images/modules/site/copilot/copilot.png',
    rating: 4.6,
    reviewCount: 15600,
    tags: ['coding', 'ai', 'productivity', 'vscode'],
    useCase: ['code_generation', 'autocompletion', 'learning', 'productivity'],
    integrations: ['vscode', 'jetbrains', 'neovim', 'visual_studio'],
    learningResources: [
      { type: 'documentation', url: 'https://docs.github.com/copilot' },
      { type: 'course', title: 'GitHub Copilot Fundamentals' }
    ],
    pros: ['Great IDE integration', 'Fast suggestions', 'Learns from context'],
    cons: ['Subscription required', 'Sometimes inaccurate', 'Privacy concerns']
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'design',
    description: 'AI image generation tool for creating stunning artwork and visual content.',
    capabilities: ['image_generation', 'style_transfer', 'concept_art', 'design'],
    pricing: 'subscription',
    pricingDetails: '$10-$60/month depending on plan',
    difficulty: 'intermediate',
    url: 'https://midjourney.com',
    icon: 'https://midjourney.com/favicon.ico',
    rating: 4.5,
    reviewCount: 9200,
    tags: ['design', 'ai', 'images', 'art'],
    useCase: ['concept_art', 'marketing_visuals', 'creative_projects', 'prototyping'],
    integrations: ['discord', 'web_interface'],
    learningResources: [
      { type: 'documentation', url: 'https://docs.midjourney.com' },
      { type: 'community', title: 'Midjourney Discord' }
    ],
    pros: ['High-quality images', 'Artistic styles', 'Active community'],
    cons: ['Discord-only interface', 'Limited control', 'Can be expensive']
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    category: 'productivity',
    description: 'AI-powered writing assistant integrated into Notion workspace for enhanced productivity.',
    capabilities: ['writing_assistance', 'summarization', 'brainstorming', 'task_management'],
    pricing: 'addon',
    pricingDetails: '$10/month per user (addon to Notion)',
    difficulty: 'beginner',
    url: 'https://notion.so/ai',
    icon: 'https://notion.so/favicon.ico',
    rating: 4.3,
    reviewCount: 6700,
    tags: ['productivity', 'writing', 'workspace', 'organization'],
    useCase: ['note_taking', 'project_management', 'content_creation', 'brainstorming'],
    integrations: ['notion_workspace'],
    learningResources: [
      { type: 'documentation', url: 'https://notion.so/help/ai' }
    ],
    pros: ['Seamless integration', 'Multiple AI features', 'Workspace context'],
    cons: ['Requires Notion subscription', 'Limited compared to specialized tools']
  },
  {
    id: 'grammarly',
    name: 'Grammarly',
    category: 'writing',
    description: 'AI-powered writing assistant for grammar, spelling, and style improvements.',
    capabilities: ['grammar_check', 'spell_check', 'style_suggestions', 'tone_analysis'],
    pricing: 'freemium',
    pricingDetails: 'Free basic, $12/month premium',
    difficulty: 'beginner',
    url: 'https://grammarly.com',
    icon: 'https://grammarly.com/favicon.ico',
    rating: 4.4,
    reviewCount: 25000,
    tags: ['writing', 'grammar', 'editing', 'productivity'],
    useCase: ['email_writing', 'document_editing', 'academic_writing', 'business_communication'],
    integrations: ['browser_extension', 'microsoft_office', 'google_docs', 'mobile_apps'],
    learningResources: [
      { type: 'blog', title: 'Grammarly Writing Tips' },
      { type: 'handbook', title: 'Grammar Handbook' }
    ],
    pros: ['Easy to use', 'Wide integration', 'Good free tier'],
    cons: ['Can be overly prescriptive', 'Premium features paywall', 'Not always contextually aware']
  }
];

// Get all AI tools with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      difficulty, 
      pricing, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    let filteredTools = [...mockAITools];

    // Apply filters
    if (category) {
      filteredTools = filteredTools.filter(tool => tool.category === category);
    }

    if (difficulty) {
      filteredTools = filteredTools.filter(tool => tool.difficulty === difficulty);
    }

    if (pricing) {
      filteredTools = filteredTools.filter(tool => tool.pricing === pricing);
    }

    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredTools = filteredTools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description.toLowerCase().includes(searchTerm) ||
        tool.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Sort tools
    filteredTools.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTools = filteredTools.slice(startIndex, endIndex);

    res.json({
      tools: paginatedTools,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredTools.length,
        totalPages: Math.ceil(filteredTools.length / limitNum)
      },
      filters: {
        categories: [...new Set(mockAITools.map(tool => tool.category))],
        difficulties: [...new Set(mockAITools.map(tool => tool.difficulty))],
        pricingModels: [...new Set(mockAITools.map(tool => tool.pricing))]
      }
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch AI tools' });
  }
});

// Get specific tool details
router.get('/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params;
    
    const tool = mockAITools.find(t => t.id === toolId);
    
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Add additional details for single tool view
    const detailedTool = {
      ...tool,
      alternatives: mockAITools
        .filter(t => t.category === tool.category && t.id !== tool.id)
        .slice(0, 3),
      similarTools: mockAITools
        .filter(t => t.tags.some(tag => tool.tags.includes(tag)) && t.id !== tool.id)
        .slice(0, 4),
      recentReviews: [
        {
          id: 'review-1',
          userId: 'user-123',
          userName: 'Sarah M.',
          rating: 5,
          comment: 'Excellent tool for my workflow. Highly recommended!',
          date: '2024-01-15T10:30:00Z'
        },
        {
          id: 'review-2',
          userId: 'user-456',
          userName: 'Mike D.',
          rating: 4,
          comment: 'Good features but can be expensive for heavy usage.',
          date: '2024-01-12T15:45:00Z'
        }
      ]
    };

    res.json(detailedTool);
  } catch (error) {
    console.error('Error fetching tool details:', error);
    res.status(500).json({ error: 'Failed to fetch tool details' });
  }
});

// Get personalized tool recommendations
router.get('/recommendations/personalized', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    // In a real implementation, this would call the FastAPI recommendation service
    // For now, return mock personalized recommendations
    const recommendations = [
      {
        id: 'rec-1',
        type: 'tool',
        tool: mockAITools[0], // GPT-4
        title: 'Boost Your Writing with GPT-4',
        description: 'Based on your coding background, GPT-4 can help you create better documentation and technical content.',
        confidence: 0.92,
        category: 'writing',
        estimatedImpact: 'high',
        timeToImplement: '2-3 hours',
        reasoning: 'Your activity patterns show frequent documentation writing. GPT-4 excels at technical writing and can integrate with your existing workflow.',
        actionUrl: 'https://platform.openai.com',
        prerequisites: ['OpenAI account'],
        relatedTools: ['Claude 3', 'Notion AI']
      },
      {
        id: 'rec-2',
        type: 'tool',
        tool: mockAITools[2], // GitHub Copilot
        title: 'Accelerate Coding with GitHub Copilot',
        description: 'Perfect match for your development workflow. Integrates directly with VS Code.',
        confidence: 0.89,
        category: 'coding',
        estimatedImpact: 'high',
        timeToImplement: '30 minutes',
        reasoning: 'You spend 60% of your time coding. Copilot can increase your coding speed by 30-40%.',
        actionUrl: 'https://github.com/features/copilot',
        prerequisites: ['GitHub account', 'VS Code'],
        relatedTools: ['Tabnine', 'CodeT5']
      },
      {
        id: 'rec-3',
        type: 'optimization',
        tool: mockAITools[4], // Notion AI
        title: 'Optimize Project Management',
        description: 'Streamline your project documentation and planning with AI assistance.',
        confidence: 0.75,
        category: 'productivity',
        estimatedImpact: 'medium',
        timeToImplement: '1-2 hours',
        reasoning: 'Your workflow shows project management activities. Notion AI can help organize and generate project documentation.',
        actionUrl: 'https://notion.so/ai',
        prerequisites: ['Notion workspace'],
        relatedTools: ['Todoist', 'Asana']
      }
    ];

    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch personalized recommendations' });
  }
});

// Submit tool rating/review
router.post('/:toolId/review', async (req, res) => {
  try {
    const { toolId } = req.params;
    const { rating, comment, usageContext } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    const tool = mockAITools.find(t => t.id === toolId);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // In a real implementation, save to database
    // await saveToolReview(decoded.userId, toolId, { rating, comment, usageContext });

    const review = {
      id: `review-${Date.now()}`,
      userId: decoded.userId,
      toolId,
      rating,
      comment,
      usageContext,
      createdAt: new Date().toISOString()
    };

    res.json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Track tool usage
router.post('/:toolId/usage', async (req, res) => {
  try {
    const { toolId } = req.params;
    const { action, duration, context } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    // In a real implementation, track usage for analytics
    // await trackToolUsage(decoded.userId, toolId, { action, duration, context });

    res.json({
      message: 'Usage tracked successfully',
      toolId,
      action,
      trackedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Failed to track tool usage' });
  }
});

// Get tool categories and statistics
router.get('/categories/stats', async (req, res) => {
  try {
    const categories: Record<string, {
      name: string;
      count: number;
      averageRating: number;
      topTools: { id: string; name: string; rating: number; }[];
    }> = {};
    
    mockAITools.forEach(tool => {
      if (!categories[tool.category]) {
        categories[tool.category] = {
          name: tool.category,
          count: 0,
          averageRating: 0,
          topTools: []
        };
      }
      
      categories[tool.category].count++;
      categories[tool.category].topTools.push({
        id: tool.id,
        name: tool.name,
        rating: tool.rating
      });
    });

    // Calculate average ratings and sort top tools
    Object.values(categories).forEach((category) => {
      category.averageRating = category.topTools.reduce((sum: number, tool: any) => sum + tool.rating, 0) / category.topTools.length;
      category.topTools = category.topTools.sort((a: any, b: any) => b.rating - a.rating).slice(0, 3);
    });

    res.json({
      categories: Object.values(categories),
      totalTools: mockAITools.length,
      averageRating: mockAITools.reduce((sum: number, tool) => sum + tool.rating, 0) / mockAITools.length
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

export default router; 