// Usage Tracking Middleware for Subscription Plan Enforcement
// Integrates with the Subscription Service to enforce plan limits

import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "./subscriptionService";

export interface UsageCheckRequest extends Request {
  user?: any;
  usageCheck?: {
    allowed: boolean;
    usage: number;
    limit: number;
    plan: string;
  };
}

export interface UsageCheckOptions {
  metricType: string;
  increment?: number;
  skipIncrement?: boolean;
  errorMessage?: string;
}

// Generic usage tracking middleware factory
export function createUsageTrackingMiddleware(options: UsageCheckOptions) {
  return async (req: UsageCheckRequest, res: Response, next: NextFunction) => {
    try {
      // Skip if user is not authenticated
      if (!req.user?.claims?.sub && !req.user?.id) {
        return res.status(401).json({ 
          message: "Authentication required",
          code: "AUTHENTICATION_REQUIRED"
        });
      }

      const userId = req.user.claims?.sub || req.user.id;
      const { metricType, increment = 1, skipIncrement = false, errorMessage } = options;

      // Check current usage against plan limits
      const usageCheck = await subscriptionService.checkUsageLimit(userId, metricType);
      
      // Store usage check results for use in route handlers
      req.usageCheck = usageCheck;

      // If usage would exceed limit, block the request
      if (!usageCheck.allowed) {
        const limitText = usageCheck.limit === -1 ? "unlimited" : usageCheck.limit.toString();
        
        return res.status(403).json({
          message: errorMessage || `${metricType} limit exceeded. Your ${usageCheck.plan} plan allows ${limitText} ${metricType} per month.`,
          code: "USAGE_LIMIT_EXCEEDED",
          details: {
            usage: usageCheck.usage,
            limit: usageCheck.limit,
            plan: usageCheck.plan,
            metricType
          }
        });
      }

      // If not skipping increment, update usage after successful check
      if (!skipIncrement) {
        await subscriptionService.incrementUsage(userId, metricType, increment);
      }

      next();
    } catch (error) {
      console.error('Usage tracking middleware error:', error);
      res.status(500).json({ 
        message: "Failed to check usage limits",
        code: "USAGE_CHECK_FAILED"
      });
    }
  };
}

// Specific middleware for different features
export const projectCreationMiddleware = createUsageTrackingMiddleware({
  metricType: 'projects',
  errorMessage: 'Project creation limit exceeded. Upgrade your plan to create more projects.'
});

export const aiGenerationMiddleware = createUsageTrackingMiddleware({
  metricType: 'aiGenerations',
  errorMessage: 'AI generation limit exceeded. Upgrade your plan for more AI generations.'
});

export const apiCallMiddleware = createUsageTrackingMiddleware({
  metricType: 'apiCalls',
  errorMessage: 'API call limit exceeded. Upgrade your plan for higher API limits.'
});

// Middleware to check collaboration limits (for team features)
export const collaborationMiddleware = createUsageTrackingMiddleware({
  metricType: 'collaborators',
  skipIncrement: true, // Don't increment, just check
  errorMessage: 'Collaboration limit exceeded. Upgrade to Professional plan for team collaboration.'
});

// Middleware to check storage limits
export const storageMiddleware = createUsageTrackingMiddleware({
  metricType: 'storageGB',
  skipIncrement: true, // Storage is checked separately
  errorMessage: 'Storage limit exceeded. Upgrade your plan for more storage space.'
});

// Usage reporting middleware - provides current usage without enforcement
export function usageReportingMiddleware(req: UsageCheckRequest, res: Response, next: NextFunction) {
  const originalSend = res.json;
  
  res.json = function(data: any) {
    // Add usage information to responses if available
    if (req.usageCheck) {
      const responseData = {
        ...data,
        usage: {
          current: req.usageCheck.usage,
          limit: req.usageCheck.limit,
          plan: req.usageCheck.plan,
          remaining: req.usageCheck.limit === -1 ? -1 : Math.max(0, req.usageCheck.limit - req.usageCheck.usage)
        }
      };
      return originalSend.call(this, responseData);
    }
    
    return originalSend.call(this, data);
  };

  next();
}

// Plan feature checking middleware - validates if user has access to specific features
export function planFeatureMiddleware(requiredPlan: string, featureName: string) {
  return async (req: UsageCheckRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          message: "Authentication required",
          code: "AUTHENTICATION_REQUIRED"
        });
      }

      // Get user's current subscription
      const subscriptionWithPlan = await subscriptionService.getUserSubscriptionWithPlan(userId);
      const currentPlan = subscriptionWithPlan?.plan?.name || 'free';

      // Define plan hierarchy (higher number = more features)
      const planHierarchy: Record<string, number> = {
        'free': 0,
        'starter': 1,
        'professional': 2,
        'enterprise': 3
      };

      const currentPlanLevel = planHierarchy[currentPlan] || 0;
      const requiredPlanLevel = planHierarchy[requiredPlan] || 999;

      if (currentPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          message: `${featureName} requires ${requiredPlan} plan or higher. Current plan: ${currentPlan}`,
          code: "FEATURE_NOT_AVAILABLE",
          details: {
            currentPlan,
            requiredPlan,
            featureName
          }
        });
      }

      next();
    } catch (error) {
      console.error('Plan feature middleware error:', error);
      res.status(500).json({ 
        message: "Failed to check plan features",
        code: "PLAN_CHECK_FAILED"
      });
    }
  };
}

// Specific feature middlewares
export const professionalFeatureMiddleware = planFeatureMiddleware('professional', 'Professional features');
export const enterpriseFeatureMiddleware = planFeatureMiddleware('enterprise', 'Enterprise features');

// Real-time collaboration middleware
export const collaborationFeatureMiddleware = planFeatureMiddleware('professional', 'Real-time collaboration');

// Advanced monitoring middleware
export const monitoringFeatureMiddleware = planFeatureMiddleware('professional', 'Advanced monitoring');

// Custom integration middleware
export const customIntegrationMiddleware = planFeatureMiddleware('enterprise', 'Custom integrations');

// Team management middleware
export const teamManagementMiddleware = planFeatureMiddleware('enterprise', 'Team management');

// Usage summary middleware - adds comprehensive usage data to response
export function usageSummaryMiddleware(req: UsageCheckRequest, res: Response, next: NextFunction) {
  const originalSend = res.json;
  
  res.json = (async function(data: any) {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (userId) {
        // Get comprehensive usage summary
        const usageSummary = await subscriptionService.getAllUserUsage(userId);
        const subscriptionWithPlan = await subscriptionService.getUserSubscriptionWithPlan(userId);
        
        const responseData = {
          ...data,
          subscription: {
            plan: subscriptionWithPlan?.plan?.name || 'free',
            status: subscriptionWithPlan?.status || 'inactive',
            usage: usageSummary
          }
        };
        
        return originalSend.call(this, responseData);
      }
    } catch (error) {
      console.error('Usage summary middleware error:', error);
      // Don't fail the request, just send original data
    }
    
    return originalSend.call(this, data);
  }) as any;

  next();
}

// Validation helper for checking specific usage without middleware
export async function validateUsage(userId: string, metricType: string): Promise<{
  allowed: boolean;
  usage: number;
  limit: number;
  plan: string;
  error?: string;
}> {
  try {
    const usageCheck = await subscriptionService.checkUsageLimit(userId, metricType);
    
    return {
      ...usageCheck,
      error: !usageCheck.allowed ? `${metricType} limit exceeded` : undefined
    };
  } catch (error) {
    return {
      allowed: false,
      usage: 0,
      limit: 0,
      plan: 'unknown',
      error: `Failed to check usage: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Usage increment helper for manual usage tracking
export async function incrementUsage(userId: string, metricType: string, increment = 1): Promise<void> {
  try {
    await subscriptionService.incrementUsage(userId, metricType, increment);
  } catch (error) {
    console.error(`Failed to increment usage for ${metricType}:`, error);
    // Don't throw - usage tracking failures shouldn't break functionality
  }
}

// Export all middleware and utilities
export {
  subscriptionService
};