import mongoose, { Document, Schema } from 'mongoose';

export interface IBadge extends Document {
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
  earnedBy: number;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAchievement extends Document {
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress: number;
  completed: boolean;
  context?: any; // Additional context about how the badge was earned
}

export interface IUserStats extends Document {
  userId: string;
  totalBadges: number;
  totalPoints: number;
  rank: number;
  streak: {
    current: number;
    longest: number;
    lastActive: Date;
  };
  categories: {
    milestone: number;
    referral: number;
    learning: number;
    tool: number;
    streak: number;
  };
  lastUpdated: Date;
}

const BadgeSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['milestone', 'referral', 'learning', 'tool', 'streak'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  requirements: [{
    type: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, required: true }
  }],
  earnedBy: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const UserAchievementSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  badgeId: {
    type: String,
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  completed: {
    type: Boolean,
    default: true
  },
  context: Schema.Types.Mixed
}, {
  timestamps: true
});

const UserStatsSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  totalBadges: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  categories: {
    milestone: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    learning: { type: Number, default: 0 },
    tool: { type: Number, default: 0 },
    streak: { type: Number, default: 0 }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
BadgeSchema.index({ category: 1, isActive: 1 });
BadgeSchema.index({ rarity: 1 });
UserAchievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
UserAchievementSchema.index({ earnedAt: -1 });
UserStatsSchema.index({ totalPoints: -1 });
UserStatsSchema.index({ rank: 1 });

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema);
export const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);
export const UserStats = mongoose.model<IUserStats>('UserStats', UserStatsSchema); 