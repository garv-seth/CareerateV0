import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  azureAdId?: string;
  b2cObjectId?: string;
  profile: {
    title?: string;
    company?: string;
    experience?: number;
    skills: string[];
    goals: string[];
    industry?: string;
    location?: string;
    avatar?: string;
  };
  aiRisk: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    lastAssessed: Date;
    factors: string[];
  };
  achievements: {
    badgeId: string;
    earnedAt: Date;
    type: 'milestone' | 'referral' | 'learning' | 'tool' | 'streak';
  }[];
  referrals: {
    code: string;
    invitedUsers: string[];
    successfulReferrals: number;
  };
  learningPath: {
    currentPath?: string;
    completedSteps: string[];
    progressPercentage: number;
    estimatedHours: number;
    lastUpdated: Date;
  };
  settings: {
    emailNotifications: boolean;
    marketTrendsAlerts: boolean;
    learningReminders: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  subscription: {
    plan: 'free' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  azureAdId: {
    type: String,
    sparse: true,
  },
  b2cObjectId: {
    type: String,
    unique: true,
    sparse: true,
  },
  profile: {
    title: String,
    company: String,
    experience: Number,
    skills: [String],
    goals: [String],
    industry: String,
    location: String,
    avatar: String,
  },
  aiRisk: {
    score: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    lastAssessed: {
      type: Date,
      default: Date.now,
    },
    factors: [String],
  },
  achievements: [{
    badgeId: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['milestone', 'referral', 'learning', 'tool', 'streak'],
      required: true,
    },
  }],
  referrals: {
    code: {
      type: String,
      unique: true,
      sparse: true,
    },
    invitedUsers: [String],
    successfulReferrals: {
      type: Number,
      default: 0,
    },
  },
  learningPath: {
    currentPath: String,
    completedSteps: [String],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    marketTrendsAlerts: {
      type: Boolean,
      default: true,
    },
    learningReminders: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'professional', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
    },
    expiresAt: Date,
  },
  lastLoginAt: Date,
}, {
  timestamps: true,
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'referrals.code': 1 });
UserSchema.index({ 'aiRisk.score': 1 });
UserSchema.index({ createdAt: -1 });

export default mongoose.model<IUser>('User', UserSchema); 