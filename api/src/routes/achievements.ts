import { Router, Request, Response } from 'express';
import { Badge, UserAchievement, UserStats } from '../models/Badge';

const router = Router();

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'referral' | 'learning' | 'tool' | 'streak';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: string;
    value: number | string;
    description: string;
  }[];
  earnedBy: number; // Number of users who earned it
  points: number;
}

interface UserAchievement {
  badgeId: string;
  earnedAt: string;
  progress: number;
  completed: boolean;
}

interface UserStats {
  userId: string;
  totalBadges: number;
  totalPoints: number;
  rank: number;
  streak: {
    current: number;
    longest: number;
    lastActive: string;
  };
  categories: {
    milestone: number;
    referral: number;
    learning: number;
    tool: number;
    streak: number;
  };
  achievements: UserAchievement[];
}

// Get all available badges
router.get('/badges', async (req: Request, res: Response) => {
  try {
    const badges = await getAllBadges();
    res.json(badges);
  } catch (error) {
    console.error('Badges fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch badges',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get user achievements and stats
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userStats = await getUserAchievements(userId);
    res.json(userStats);
  } catch (error) {
    console.error('User achievements error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user achievements',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Award a badge to a user
router.post('/award', async (req: Request, res: Response) => {
  try {
    const { userId, badgeId, context } = req.body;
    
    const result = await awardBadge(userId, badgeId, context);
    
    res.json(result);
  } catch (error) {
    console.error('Badge award error:', error);
    res.status(500).json({ 
      error: 'Failed to award badge',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { category, limit = 10 } = req.query;
    const leaderboard = await getLeaderboard(category as string, Number(limit));
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Update user activity for streak tracking
router.post('/activity/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { activityType } = req.body;
    
    const updatedStats = await updateActivity(userId, activityType);
    
    res.json(updatedStats);
  } catch (error) {
    console.error('Activity update error:', error);
    res.status(500).json({ 
      error: 'Failed to update activity',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get all available badges
async function getAllBadges() {
  try {
    // Try to get badges from database first
    let badges = await Badge.find({ isActive: true }).sort({ category: 1, rarity: 1 });
    
    // If no badges in database, seed with default badges
    if (badges.length === 0) {
      const defaultBadges = [
    // Milestone badges
    {
      id: 'welcome',
      name: 'Welcome to Careerate',
      description: 'Complete your profile setup',
      icon: '👋',
      category: 'milestone',
      rarity: 'common',
      requirements: [
        { type: 'profile_complete', value: 100, description: 'Complete 100% of profile' }
      ],
      earnedBy: 8500,
      points: 10
    },
    {
      id: 'resume_uploaded',
      name: 'Resume Analyzer',
      description: 'Upload and analyze your first resume',
      icon: '📄',
      category: 'milestone',
      rarity: 'common',
      requirements: [
        { type: 'resume_upload', value: 1, description: 'Upload at least 1 resume' }
      ],
      earnedBy: 7200,
      points: 20
    },
    {
      id: 'ai_risk_assessed',
      name: 'Risk Aware',
      description: 'Complete your AI displacement risk assessment',
      icon: '⚠️',
      category: 'milestone',
      rarity: 'common',
      requirements: [
        { type: 'ai_risk_complete', value: 1, description: 'Complete AI risk assessment' }
      ],
      earnedBy: 6800,
      points: 15
    },
    
    // Learning badges
    {
      id: 'first_course',
      name: 'Learning Beginner',
      description: 'Complete your first learning step',
      icon: '🎓',
      category: 'learning',
      rarity: 'common',
      requirements: [
        { type: 'learning_steps', value: 1, description: 'Complete 1 learning step' }
      ],
      earnedBy: 5400,
      points: 25
    },
    {
      id: 'learning_streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      icon: '🔥',
      category: 'streak',
      rarity: 'rare',
      requirements: [
        { type: 'streak_days', value: 7, description: 'Learn for 7 consecutive days' }
      ],
      earnedBy: 2100,
      points: 50
    },
    {
      id: 'learning_streak_30',
      name: 'Month Master',
      description: 'Maintain a 30-day learning streak',
      icon: '🏆',
      category: 'streak',
      rarity: 'epic',
      requirements: [
        { type: 'streak_days', value: 30, description: 'Learn for 30 consecutive days' }
      ],
      earnedBy: 340,
      points: 200
    },
    {
      id: 'python_certified',
      name: 'Python Pro',
      description: 'Master Python programming fundamentals',
      icon: '🐍',
      category: 'learning',
      rarity: 'rare',
      requirements: [
        { type: 'skill_mastery', value: 'Python', description: 'Achieve Python skill mastery' }
      ],
      earnedBy: 1800,
      points: 100
    },
    
    // Tool badges
    {
      id: 'first_ai_tool',
      name: 'AI Explorer',
      description: 'Try your first AI tool',
      icon: '🤖',
      category: 'tool',
      rarity: 'common',
      requirements: [
        { type: 'tools_tried', value: 1, description: 'Try at least 1 AI tool' }
      ],
      earnedBy: 4600,
      points: 30
    },
    {
      id: 'tool_master',
      name: 'Tool Master',
      description: 'Master 5 different AI tools',
      icon: '🛠️',
      category: 'tool',
      rarity: 'epic',
      requirements: [
        { type: 'tools_mastered', value: 5, description: 'Master 5 AI tools' }
      ],
      earnedBy: 450,
      points: 250
    },
    {
      id: 'copilot_expert',
      name: 'Copilot Expert',
      description: 'Complete GitHub Copilot integration',
      icon: '✈️',
      category: 'tool',
      rarity: 'rare',
      requirements: [
        { type: 'tool_specific', value: 'github_copilot', description: 'Master GitHub Copilot' }
      ],
      earnedBy: 1200,
      points: 75
    },
    
    // Referral badges
    {
      id: 'first_referral',
      name: 'Connector',
      description: 'Invite your first friend to Careerate',
      icon: '🤝',
      category: 'referral',
      rarity: 'common',
      requirements: [
        { type: 'referrals_sent', value: 1, description: 'Send 1 referral invitation' }
      ],
      earnedBy: 3200,
      points: 40
    },
    {
      id: 'successful_referral',
      name: 'Influencer',
      description: 'Successfully refer someone who joins',
      icon: '⭐',
      category: 'referral',
      rarity: 'rare',
      requirements: [
        { type: 'successful_referrals', value: 1, description: '1 successful referral signup' }
      ],
      earnedBy: 1600,
      points: 100
    },
    {
      id: 'super_referrer',
      name: 'Super Connector',
      description: 'Successfully refer 10 people',
      icon: '🌟',
      category: 'referral',
      rarity: 'legendary',
      requirements: [
        { type: 'successful_referrals', value: 10, description: '10 successful referrals' }
      ],
      earnedBy: 45,
      points: 500
    },
    
    // Advanced badges
    {
      id: 'ai_certified',
      name: 'AI Professional',
      description: 'Earn a professional AI certification',
      icon: '🎖️',
      category: 'learning',
      rarity: 'legendary',
      requirements: [
        { type: 'certification', value: 'ai_professional', description: 'Complete AI certification' }
      ],
      earnedBy: 120,
      points: 1000
    },
    {
      id: 'career_accelerated',
      name: 'Career Accelerator',
      description: 'Get promoted or land a new role using Careerate',
      icon: '🚀',
      category: 'milestone',
      rarity: 'legendary',
      requirements: [
        { type: 'career_milestone', value: 'promotion', description: 'Achieve career advancement' }
      ],
      earnedBy: 280,
      points: 750
    }
      ];
      
      // Insert default badges into database
      await Badge.insertMany(defaultBadges);
      badges = await Badge.find({ isActive: true }).sort({ category: 1, rarity: 1 });
    }
    
    return badges;
  } catch (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }
}

// Get user achievements and stats
async function getUserAchievements(userId: string): Promise<UserStats> {
  // This would fetch from database, for now return mock data
  const allBadges = await getAllBadges();
  
  // Mock user achievements (in production, fetch from database)
  const userAchievements: UserAchievement[] = [
    {
      badgeId: 'welcome',
      earnedAt: '2024-01-15T10:30:00Z',
      progress: 100,
      completed: true
    },
    {
      badgeId: 'resume_uploaded',
      earnedAt: '2024-01-16T14:20:00Z',
      progress: 100,
      completed: true
    },
    {
      badgeId: 'first_course',
      earnedAt: '2024-01-18T09:15:00Z',
      progress: 100,
      completed: true
    },
    {
      badgeId: 'learning_streak_7',
      earnedAt: '2024-01-25T18:45:00Z',
      progress: 100,
      completed: true
    },
    {
      badgeId: 'first_ai_tool',
      earnedAt: '2024-01-20T11:30:00Z',
      progress: 100,
      completed: true
    },
    {
      badgeId: 'learning_streak_30',
      earnedAt: '',
      progress: 23,
      completed: false
    }
  ];
  
  const completedBadges = userAchievements.filter(a => a.completed);
  const totalPoints = completedBadges.reduce((sum, achievement) => {
    const badge = allBadges.find(b => b.id === achievement.badgeId);
    return sum + (badge?.points || 0);
  }, 0);
  
  const categoryCounts = completedBadges.reduce((counts, achievement) => {
    const badge = allBadges.find(b => b.id === achievement.badgeId);
    if (badge) {
      counts[badge.category]++;
    }
    return counts;
  }, {
    milestone: 0,
    referral: 0,
    learning: 0,
    tool: 0,
    streak: 0
  });
  
  return {
    userId,
    totalBadges: completedBadges.length,
    totalPoints,
    rank: 245, // Mock rank
    streak: {
      current: 23,
      longest: 31,
      lastActive: '2024-02-15T20:30:00Z'
    },
    categories: categoryCounts,
    achievements: userAchievements
  };
}

// Award a badge to a user
async function awardBadge(userId: string, badgeId: string, context: any) {
  // This would update the database and trigger notifications
  const badge = await Badge.findOne({ id: badgeId, isActive: true });
  
  if (!badge) {
    throw new Error('Badge not found');
  }
  
  // Mock awarding logic
  return {
    success: true,
    badge,
    earnedAt: new Date().toISOString(),
    message: `Congratulations! You earned the "${badge.name}" badge!`,
    points: badge.points
  };
}

// Get leaderboard
async function getLeaderboard(category?: string, limit: number = 10) {
  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, userId: 'user1', name: 'Alex Chen', points: 2450, badges: 28 },
    { rank: 2, userId: 'user2', name: 'Sarah Kim', points: 2380, badges: 26 },
    { rank: 3, userId: 'user3', name: 'David Rodriguez', points: 2250, badges: 24 },
    { rank: 4, userId: 'user4', name: 'Maria Santos', points: 2100, badges: 23 },
    { rank: 5, userId: 'user5', name: 'James Wilson', points: 1950, badges: 21 },
    { rank: 6, userId: 'user6', name: 'Emily Johnson', points: 1850, badges: 20 },
    { rank: 7, userId: 'user7', name: 'Michael Brown', points: 1720, badges: 18 },
    { rank: 8, userId: 'user8', name: 'Lisa Wang', points: 1650, badges: 17 },
    { rank: 9, userId: 'user9', name: 'Robert Taylor', points: 1580, badges: 16 },
    { rank: 10, userId: 'user10', name: 'Jennifer Lee', points: 1500, badges: 15 }
  ];
  
  return {
    category: category || 'overall',
    timeframe: 'all-time',
    lastUpdated: new Date().toISOString(),
    leaders: leaderboard.slice(0, limit)
  };
}

// Update user activity for streak tracking
async function updateActivity(userId: string, activityType: string) {
  // This would update database and calculate streaks
  // Mock response
  return {
    userId,
    activityType,
    timestamp: new Date().toISOString(),
    streak: {
      current: 24,
      longest: 31,
      lastActive: new Date().toISOString()
    },
    newBadges: [] // Any badges earned from this activity
  };
}

export default router; 