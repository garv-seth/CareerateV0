import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Mock learning paths data
const mockLearningPaths = [
  {
    id: 'path-1',
    title: 'AI-Powered Writing Mastery',
    description: 'Master advanced writing tools like GPT-4, Claude, and Jasper to become 10x more productive in content creation.',
    progress: 65,
    estimatedHours: 24,
    difficulty: 'intermediate',
    skills: ['GPT-4 Mastery', 'Prompt Engineering', 'Content Strategy', 'AI Writing Ethics'],
    nextStep: 'Complete the Advanced Prompt Engineering module',
    isActive: true,
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to AI Writing',
        status: 'completed',
        duration: 2
      },
      {
        id: 'module-2', 
        title: 'Advanced Prompt Engineering',
        status: 'in_progress',
        duration: 4
      },
      {
        id: 'module-3',
        title: 'Content Strategy with AI',
        status: 'locked',
        duration: 6
      }
    ]
  },
  {
    id: 'path-2',
    title: 'Code Assistant Productivity Boost',
    description: 'Learn to leverage GitHub Copilot, Tabnine, and other AI coding assistants to accelerate your development workflow.',
    progress: 30,
    estimatedHours: 18,
    difficulty: 'beginner',
    skills: ['GitHub Copilot', 'Code Review', 'Debugging', 'Test Generation'],
    nextStep: 'Start the GitHub Copilot Fundamentals module',
    isActive: true,
    modules: [
      {
        id: 'module-4',
        title: 'Setting up GitHub Copilot',
        status: 'completed',
        duration: 3
      },
      {
        id: 'module-5',
        title: 'Advanced Code Generation',
        status: 'in_progress',
        duration: 5
      }
    ]
  },
  {
    id: 'path-3',
    title: 'AI Research & Analysis Tools',
    description: 'Discover and master research tools like Semantic Scholar, Elicit, and Consensus to accelerate your research process.',
    progress: 0,
    estimatedHours: 15,
    difficulty: 'advanced',
    skills: ['Research Methodology', 'Data Analysis', 'Literature Review', 'Citation Management'],
    nextStep: 'Begin with Research Tool Overview',
    isActive: false,
    modules: [
      {
        id: 'module-6',
        title: 'Research Tool Overview',
        status: 'not_started',
        duration: 2
      },
      {
        id: 'module-7',
        title: 'Advanced Search Techniques',
        status: 'locked',
        duration: 4
      }
    ]
  }
];

// Get personalized learning paths
router.get('/personalized', async (req, res) => {
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

    const userId = decoded.userId;

    // In a real implementation, this would:
    // 1. Get user's skill level, work domain, and goals
    // 2. Analyze their activity patterns
    // 3. Generate or filter learning paths based on their profile
    // 4. Consider their current progress

    // For now, return mock data with some personalization
    const personalizedPaths = mockLearningPaths.map(path => ({
      ...path,
      // Simulate some personalization based on user data
      relevanceScore: Math.random() * 100,
      estimatedTimeToComplete: Math.max(1, path.estimatedHours - Math.floor(Math.random() * 5))
    }));

    res.json(personalizedPaths);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

// Get specific learning path details
router.get('/:pathId', async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const path = mockLearningPaths.find(p => p.id === pathId);
    
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    // Add detailed module information
    const detailedPath = {
      ...path,
      modules: path.modules.map(module => ({
        ...module,
        description: `Detailed description for ${module.title}`,
        learningObjectives: [
          'Understand core concepts',
          'Apply practical techniques', 
          'Complete hands-on exercises'
        ],
        resources: [
          { type: 'video', title: 'Introduction Video', duration: 15 },
          { type: 'article', title: 'Best Practices Guide', readTime: 10 },
          { type: 'exercise', title: 'Practical Exercise', duration: 30 }
        ]
      }))
    };

    res.json(detailedPath);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({ error: 'Failed to fetch learning path' });
  }
});

// Update learning path progress
router.post('/:pathId/progress', async (req, res) => {
  try {
    const { pathId } = req.params;
    const { moduleId, status, timeSpent, completedAt } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    // In a real implementation, update the database
    // await updateLearningProgress(decoded.userId, pathId, moduleId, { status, timeSpent, completedAt });

    // Calculate new overall progress
    const path = mockLearningPaths.find(p => p.id === pathId);
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    // Mock progress calculation
    const completedModules = path.modules.filter(m => m.status === 'completed').length;
    const totalModules = path.modules.length;
    const newProgress = Math.round((completedModules / totalModules) * 100);

    res.json({
      message: 'Progress updated successfully',
      pathId,
      moduleId,
      newProgress,
      status,
      timeSpent,
      completedAt
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Start a learning path
router.post('/:pathId/start', async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    const path = mockLearningPaths.find(p => p.id === pathId);
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    // In a real implementation:
    // await startLearningPath(decoded.userId, pathId);

    res.json({
      message: 'Learning path started successfully',
      pathId,
      startedAt: new Date().toISOString(),
      nextStep: path.modules[0]?.title || 'No modules available'
    });
  } catch (error) {
    console.error('Error starting learning path:', error);
    res.status(500).json({ error: 'Failed to start learning path' });
  }
});

// Get user's learning analytics
router.get('/analytics/summary', async (req, res) => {
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

    // Mock analytics data
    const analytics = {
      totalPathsStarted: 3,
      totalPathsCompleted: 1,
      totalHoursLearned: 45,
      skillsGained: 12,
      currentStreak: 7,
      longestStreak: 14,
      averageSessionTime: 28, // minutes
      weeklyGoalProgress: 78, // percentage
      topSkillCategories: [
        { category: 'AI Writing', progress: 85 },
        { category: 'Code Assistance', progress: 60 },
        { category: 'Research Tools', progress: 25 }
      ],
      recentAchievements: [
        {
          id: 'achievement-1',
          title: 'First Path Completed',
          description: 'Completed your first learning path',
          earnedAt: '2024-01-15T10:30:00Z',
          icon: 'trophy'
        },
        {
          id: 'achievement-2',
          title: 'Week Streak',
          description: 'Learned for 7 consecutive days',
          earnedAt: '2024-01-20T18:45:00Z',
          icon: 'fire'
        }
      ]
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch learning analytics' });
  }
});

// Generate custom learning path based on user goals
router.post('/generate', async (req, res) => {
  try {
    const { goals, skillLevel, timeAvailable, preferences } = req.body;
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    // In a real implementation, this would use AI to generate a custom path
    // For now, create a mock custom path
    const customPath = {
      id: `custom-${Date.now()}`,
      title: `Custom AI Learning Path for ${goals[0] || 'Productivity'}`,
      description: `A personalized learning path tailored to your ${skillLevel} skill level and ${timeAvailable} hour weekly commitment.`,
      progress: 0,
      estimatedHours: timeAvailable * 4, // 4 weeks
      difficulty: skillLevel,
      skills: goals,
      nextStep: 'Begin with fundamentals assessment',
      isActive: false,
      isCustom: true,
      generatedAt: new Date().toISOString(),
      modules: [
        {
          id: 'custom-module-1',
          title: 'Skills Assessment',
          status: 'not_started',
          duration: 1,
          description: 'Assess your current skill level'
        },
        {
          id: 'custom-module-2',
          title: 'Tool Discovery',
          status: 'locked',
          duration: Math.ceil(timeAvailable / 2),
          description: 'Discover relevant AI tools for your goals'
        },
        {
          id: 'custom-module-3',
          title: 'Hands-on Practice',
          status: 'locked',
          duration: timeAvailable * 2,
          description: 'Apply tools to real-world scenarios'
        }
      ]
    };

    res.json({
      message: 'Custom learning path generated successfully',
      path: customPath
    });
  } catch (error) {
    console.error('Error generating custom path:', error);
    res.status(500).json({ error: 'Failed to generate custom learning path' });
  }
});

export default router; 