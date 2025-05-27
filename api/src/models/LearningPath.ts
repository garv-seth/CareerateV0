import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningStep {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'tool' | 'project' | 'certification';
  provider: string;
  url: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  completed: boolean;
  order: number;
  completedAt?: Date;
  hoursSpent?: number;
}

export interface ILearningPath extends Document {
  userId: string;
  title: string;
  description: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  estimatedTotalHours: number;
  remainingHours: number;
  targetRole: string;
  skills: string[];
  steps: ILearningStep[];
  milestones: {
    stepId: string;
    title: string;
    reward: string;
    achieved: boolean;
    achievedAt?: Date;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
}

const LearningStepSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['course', 'tool', 'project', 'certification'],
    required: true
  },
  provider: { type: String, required: true },
  url: { type: String, required: true },
  estimatedHours: { type: Number, required: true },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  skills: [String],
  completed: { type: Boolean, default: false },
  order: { type: Number, required: true },
  completedAt: Date,
  hoursSpent: { type: Number, default: 0 }
});

const LearningPathSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  },
  completedSteps: {
    type: Number,
    default: 0
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  estimatedTotalHours: {
    type: Number,
    required: true
  },
  remainingHours: {
    type: Number,
    required: true
  },
  targetRole: {
    type: String,
    required: true
  },
  skills: [String],
  steps: [LearningStepSchema],
  milestones: [{
    stepId: { type: String, required: true },
    title: { type: String, required: true },
    reward: { type: String, required: true },
    achieved: { type: Boolean, default: false },
    achievedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
LearningPathSchema.index({ userId: 1, isActive: 1 });
LearningPathSchema.index({ targetRole: 1 });
LearningPathSchema.index({ 'skills': 1 });

export default mongoose.model<ILearningPath>('LearningPath', LearningPathSchema); 