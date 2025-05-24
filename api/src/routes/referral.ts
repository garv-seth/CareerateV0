import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface ReferralCode {
  code: string;
  userId: string;
  createdAt: string;
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

interface ReferralInvite {
  id: string;
  referrerUserId: string;
  inviteeEmail: string;
  referralCode: string;
  status: 'pending' | 'registered' | 'activated' | 'expired';
  sentAt: string;
  registeredAt?: string;
  activatedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ReferralStats {
  userId: string;
  totalInvitesSent: number;
  pendingInvites: number;
  successfulReferrals: number;
  conversionRate: number;
  totalRewards: number;
  recentInvites: ReferralInvite[];
  topPerformingChannels: {
    channel: string;
    count: number;
    conversionRate: number;
  }[];
}

// Generate referral code for a user
router.post('/generate/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { expiresIn, usageLimit } = req.body;
    
    const referralCode = await generateReferralCode(userId, expiresIn, usageLimit);
    
    res.json(referralCode);
  } catch (error) {
    console.error('Referral code generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate referral code',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Send referral invite
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const { referrerUserId, inviteeEmail, referralCode, message, channel } = req.body;
    
    const invite = await sendReferralInvite(referrerUserId, inviteeEmail, referralCode, message, channel);
    
    res.json(invite);
  } catch (error) {
    console.error('Referral invite error:', error);
    res.status(500).json({ 
      error: 'Failed to send referral invite',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get referral stats for a user
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const stats = await getReferralStats(userId);
    
    res.json(stats);
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch referral stats',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Validate and use referral code during registration
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { referralCode, newUserEmail } = req.body;
    
    const validation = await validateReferralCode(referralCode, newUserEmail);
    
    res.json(validation);
  } catch (error) {
    console.error('Referral validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate referral code',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get referral leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { timeframe = 'all-time', limit = 10 } = req.query;
    
    const leaderboard = await getReferralLeaderboard(timeframe as string, Number(limit));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Referral leaderboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch referral leaderboard',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Complete referral process (called when new user activates)
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { referralCode, newUserId } = req.body;
    
    const completion = await completeReferral(referralCode, newUserId);
    
    res.json(completion);
  } catch (error) {
    console.error('Referral completion error:', error);
    res.status(500).json({ 
      error: 'Failed to complete referral',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Generate referral code
async function generateReferralCode(
  userId: string, 
  expiresIn?: number, 
  usageLimit?: number
): Promise<ReferralCode> {
  // Generate unique 8-character code
  const code = generateUniqueCode();
  
  const expiresAt = expiresIn 
    ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  
  const referralCode: ReferralCode = {
    code,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt,
    usageLimit,
    usageCount: 0,
    isActive: true
  };
  
  // In production, save to database
  console.log('Generated referral code:', referralCode);
  
  return referralCode;
}

// Send referral invite
async function sendReferralInvite(
  referrerUserId: string,
  inviteeEmail: string,
  referralCode: string,
  message?: string,
  channel?: string
): Promise<ReferralInvite> {
  const invite: ReferralInvite = {
    id: uuidv4(),
    referrerUserId,
    inviteeEmail,
    referralCode,
    status: 'pending',
    sentAt: new Date().toISOString()
  };
  
  // In production:
  // 1. Save invite to database
  // 2. Send email with personalized message and referral link
  // 3. Track channel for analytics
  
  // Mock email sending
  const inviteLink = `https://gocareerate.com/join?ref=${referralCode}`;
  const emailContent = `
    Hi there!
    
    You've been invited to join Careerate by one of your connections.
    
    ${message || 'Careerate helps tech professionals master AI tools and accelerate their careers.'}
    
    Join here: ${inviteLink}
    
    Best regards,
    The Careerate Team
  `;
  
  console.log('Sending referral email:', {
    to: inviteeEmail,
    subject: 'You\'re invited to join Careerate!',
    content: emailContent,
    channel: channel || 'email'
  });
  
  return invite;
}

// Get referral stats
async function getReferralStats(userId: string): Promise<ReferralStats> {
  // Mock data - in production, fetch from database
  const recentInvites: ReferralInvite[] = [
    {
      id: 'inv-1',
      referrerUserId: userId,
      inviteeEmail: 'colleague@example.com',
      referralCode: 'CARE8X9Y',
      status: 'registered',
      sentAt: '2024-02-10T14:30:00Z',
      registeredAt: '2024-02-12T09:15:00Z'
    },
    {
      id: 'inv-2',
      referrerUserId: userId,
      inviteeEmail: 'friend@example.com',
      referralCode: 'CARE8X9Y',
      status: 'pending',
      sentAt: '2024-02-08T16:20:00Z'
    },
    {
      id: 'inv-3',
      referrerUserId: userId,
      inviteeEmail: 'teammate@example.com',
      referralCode: 'CARE8X9Y',
      status: 'activated',
      sentAt: '2024-02-05T11:45:00Z',
      registeredAt: '2024-02-06T08:30:00Z',
      activatedAt: '2024-02-07T13:20:00Z'
    }
  ];
  
  const totalInvitesSent = 8;
  const successfulReferrals = 3;
  const pendingInvites = 2;
  
  return {
    userId,
    totalInvitesSent,
    pendingInvites,
    successfulReferrals,
    conversionRate: (successfulReferrals / totalInvitesSent) * 100,
    totalRewards: successfulReferrals * 100, // Points earned
    recentInvites,
    topPerformingChannels: [
      { channel: 'email', count: 5, conversionRate: 40 },
      { channel: 'linkedin', count: 2, conversionRate: 50 },
      { channel: 'slack', count: 1, conversionRate: 100 }
    ]
  };
}

// Validate referral code
async function validateReferralCode(referralCode: string, newUserEmail: string) {
  // In production, check database for valid code
  // Mock validation
  const isValid = referralCode.startsWith('CARE');
  const isExpired = false;
  const isOverLimit = false;
  
  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid referral code'
    };
  }
  
  if (isExpired) {
    return {
      valid: false,
      error: 'Referral code has expired'
    };
  }
  
  if (isOverLimit) {
    return {
      valid: false,
      error: 'Referral code usage limit exceeded'
    };
  }
  
  return {
    valid: true,
    referralCode,
    referrerUserId: 'user-123', // Would fetch from database
    benefits: {
      newUserReward: 'Welcome bonus: 50 points',
      referrerReward: 'Referral bonus: 100 points'
    }
  };
}

// Get referral leaderboard
async function getReferralLeaderboard(timeframe: string, limit: number) {
  // Mock leaderboard data
  const leaders = [
    { rank: 1, userId: 'user1', name: 'Sarah Kim', referrals: 47, points: 4700 },
    { rank: 2, userId: 'user2', name: 'Alex Chen', referrals: 42, points: 4200 },
    { rank: 3, userId: 'user3', name: 'David Rodriguez', referrals: 38, points: 3800 },
    { rank: 4, userId: 'user4', name: 'Maria Santos', referrals: 35, points: 3500 },
    { rank: 5, userId: 'user5', name: 'James Wilson', referrals: 31, points: 3100 },
    { rank: 6, userId: 'user6', name: 'Emily Johnson', referrals: 28, points: 2800 },
    { rank: 7, userId: 'user7', name: 'Michael Brown', referrals: 25, points: 2500 },
    { rank: 8, userId: 'user8', name: 'Lisa Wang', referrals: 22, points: 2200 },
    { rank: 9, userId: 'user9', name: 'Robert Taylor', referrals: 19, points: 1900 },
    { rank: 10, userId: 'user10', name: 'Jennifer Lee', referrals: 16, points: 1600 }
  ];
  
  return {
    timeframe,
    lastUpdated: new Date().toISOString(),
    totalReferrers: 1250,
    totalReferrals: 8940,
    leaders: leaders.slice(0, limit)
  };
}

// Complete referral process
async function completeReferral(referralCode: string, newUserId: string) {
  // In production:
  // 1. Update invite status to 'activated'
  // 2. Award points to referrer
  // 3. Award welcome bonus to new user
  // 4. Trigger badge checks
  // 5. Send congratulations emails
  
  return {
    success: true,
    referralCode,
    newUserId,
    rewards: {
      referrer: {
        points: 100,
        badgeEarned: 'successful_referral' // If first successful referral
      },
      newUser: {
        points: 50,
        welcomeBonus: true
      }
    },
    message: 'Referral completed successfully!'
  };
}

// Generate unique referral code
function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CARE';
  
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

export default router; 