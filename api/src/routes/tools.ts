import { Router, Request, Response } from 'express';

const router = Router();

// Get AI tools directory
router.get('/', async (req: Request, res: Response) => {
  res.json({
    categories: [
      {
        id: 'coding',
        name: 'AI-Powered Coding',
        description: 'Enhance your development workflow',
        tools: [
          {
            id: 'github-copilot',
            name: 'GitHub Copilot',
            description: 'AI pair programmer',
            url: 'https://github.com/features/copilot',
            pricing: '$10/month',
            difficulty: 'Beginner',
            popularity: 95
          },
          {
            id: 'cursor',
            name: 'Cursor',
            description: 'AI-first code editor',
            url: 'https://cursor.sh',
            pricing: 'Free/Paid',
            difficulty: 'Beginner',
            popularity: 88
          }
        ]
      },
      {
        id: 'content',
        name: 'Content Creation',
        description: 'AI tools for writing and content',
        tools: [
          {
            id: 'chatgpt',
            name: 'ChatGPT',
            description: 'Conversational AI assistant',
            url: 'https://chat.openai.com',
            pricing: 'Free/Paid',
            difficulty: 'Beginner',
            popularity: 98
          }
        ]
      }
    ]
  });
});

// Track tool usage
router.post('/track', async (req: Request, res: Response) => {
  const { userId, toolId, action } = req.body;
  
  res.json({
    success: true,
    message: `Tracked ${action} for tool ${toolId}`
  });
});

// Get user tool progress
router.get('/progress/:userId', async (req: Request, res: Response) => {
  res.json({
    toolsExplored: 8,
    toolsMastered: 3,
    categories: {
      coding: { explored: 3, mastered: 2 },
      content: { explored: 2, mastered: 1 },
      productivity: { explored: 3, mastered: 0 }
    },
    recommendations: [
      {
        toolId: 'notion-ai',
        reason: 'Based on your content creation interest'
      }
    ]
  });
});

export default router; 