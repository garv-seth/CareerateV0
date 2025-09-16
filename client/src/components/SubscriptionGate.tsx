import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Crown, Zap, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubscriptionGateProps {
  feature: string;
  requiredPlan?: string;
  metricType?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface UsageCheckProps {
  metricType: string;
  children: React.ReactNode;
  showWarning?: boolean;
  warningThreshold?: number;
}

// Main Subscription Gate component
export function SubscriptionGate({ 
  feature, 
  requiredPlan, 
  metricType, 
  children, 
  fallback 
}: SubscriptionGateProps) {
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription/current'],
    enabled: true
  });

  const { data: usage } = useQuery({
    queryKey: ['/api/subscription/usage', metricType],
    enabled: !!metricType
  });

  const currentPlan = subscription?.plan?.name?.toLowerCase() || 'free';
  const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
  
  const hasRequiredPlan = !requiredPlan || 
    (planHierarchy[currentPlan] >= planHierarchy[requiredPlan.toLowerCase()]);
  
  const hasUsageRemaining = !metricType || !usage || usage.allowed;

  // If user has access, render children
  if (hasRequiredPlan && hasUsageRemaining) {
    return <>{children}</>;
  }

  // If fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <UpgradePrompt 
      feature={feature}
      requiredPlan={requiredPlan}
      usage={usage}
      currentPlan={currentPlan}
    />
  );
}

// Usage tracking component with warnings
export function UsageCheck({ 
  metricType, 
  children, 
  showWarning = true, 
  warningThreshold = 0.8 
}: UsageCheckProps) {
  const { data: usage } = useQuery({
    queryKey: ['/api/subscription/usage', metricType],
    enabled: true
  });

  if (!usage) return <>{children}</>;

  const usagePercentage = usage.limit === -1 ? 0 : usage.usage / usage.limit;
  const shouldShowWarning = showWarning && usagePercentage >= warningThreshold && usage.limit !== -1;

  return (
    <div className="space-y-4">
      {shouldShowWarning && (
        <UsageWarning 
          metricType={metricType}
          usage={usage.usage}
          limit={usage.limit}
          remaining={usage.remaining}
        />
      )}
      {children}
    </div>
  );
}

// Upgrade prompt component
function UpgradePrompt({ 
  feature, 
  requiredPlan, 
  usage, 
  currentPlan 
}: { 
  feature: string;
  requiredPlan?: string;
  usage?: any;
  currentPlan: string;
}) {
  const getUpgradeMessage = () => {
    if (usage && !usage.allowed) {
      return `You've reached your ${formatMetricType(usage.metricType)} limit for this month.`;
    }
    if (requiredPlan) {
      return `${feature} requires a ${requiredPlan} plan or higher.`;
    }
    return `Upgrade your plan to access ${feature}.`;
  };

  const getRecommendedPlan = () => {
    if (requiredPlan) return requiredPlan;
    if (currentPlan === 'free') return 'starter';
    return 'professional';
  };

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25" data-testid="upgrade-prompt">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg" data-testid="upgrade-title">
          {feature} Requires Upgrade
        </CardTitle>
        <CardDescription data-testid="upgrade-message">
          {getUpgradeMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {usage && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Usage:</span>
              <span data-testid="current-usage">
                {usage.usage} / {usage.limit === -1 ? 'Unlimited' : usage.limit}
              </span>
            </div>
            <Progress value={usage.limit === -1 ? 0 : (usage.usage / usage.limit) * 100} className="h-2" />
          </div>
        )}
        
        <div className="space-y-2">
          <Button 
            className="w-full"
            onClick={() => window.location.href = '/#pricing'}
            data-testid="button-upgrade-plan"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to {getRecommendedPlan()}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/billing'}
            data-testid="button-view-billing"
          >
            View Current Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage warning component
function UsageWarning({ 
  metricType, 
  usage, 
  limit, 
  remaining 
}: { 
  metricType: string;
  usage: number;
  limit: number;
  remaining: number;
}) {
  const percentage = (usage / limit) * 100;
  const isNearLimit = percentage >= 90;

  return (
    <Alert variant={isNearLimit ? "destructive" : "default"} data-testid="usage-warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p>
            <strong>Usage Alert:</strong> You've used {usage} of {limit} {formatMetricType(metricType)} 
            ({percentage.toFixed(0)}% of your monthly limit).
          </p>
          
          {isNearLimit ? (
            <p className="text-sm">
              Only {remaining} {formatMetricType(metricType)} remaining this month. 
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={() => window.location.href = '/#pricing'}
                data-testid="link-upgrade-now"
              >
                Upgrade now
              </Button> to continue using this feature.
            </p>
          ) : (
            <p className="text-sm">
              {remaining} {formatMetricType(metricType)} remaining this month.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Plan badge component
export function PlanBadge({ plan }: { plan?: string }) {
  if (!plan) return null;

  const planConfig = {
    free: { color: 'bg-gray-500', icon: Zap, label: 'Free' },
    starter: { color: 'bg-blue-500', icon: Zap, label: 'Starter' },
    professional: { color: 'bg-purple-500', icon: Crown, label: 'Pro' },
    enterprise: { color: 'bg-amber-500', icon: Users, label: 'Enterprise' }
  };

  const config = planConfig[plan.toLowerCase()] || planConfig.free;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} text-white`} data-testid={`plan-badge-${plan}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Feature availability indicator
export function FeatureAvailability({ 
  feature, 
  requiredPlan, 
  currentPlan 
}: { 
  feature: string;
  requiredPlan: string;
  currentPlan?: string;
}) {
  const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
  const current = currentPlan?.toLowerCase() || 'free';
  const required = requiredPlan.toLowerCase();
  
  const hasAccess = planHierarchy[current] >= planHierarchy[required];

  return (
    <div className="flex items-center gap-2" data-testid={`feature-availability-${feature}`}>
      <div className={`w-2 h-2 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-sm text-muted-foreground">
        {feature} {hasAccess ? '(Available)' : `(Requires ${requiredPlan})`}
      </span>
    </div>
  );
}

// Usage meter component
export function UsageMeter({ 
  metricType, 
  className = "" 
}: { 
  metricType: string;
  className?: string;
}) {
  const { data: usage } = useQuery({
    queryKey: ['/api/subscription/usage', metricType],
    enabled: true
  });

  if (!usage) return null;

  const percentage = usage.limit === -1 ? 0 : (usage.usage / usage.limit) * 100;

  return (
    <div className={`space-y-2 ${className}`} data-testid={`usage-meter-${metricType}`}>
      <div className="flex justify-between text-sm">
        <span>{formatMetricType(metricType)}</span>
        <span data-testid={`usage-text-${metricType}`}>
          {usage.usage} / {usage.limit === -1 ? 'Unlimited' : usage.limit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2" 
        data-testid={`usage-progress-${metricType}`}
      />
    </div>
  );
}

// Helper function to format metric types
function formatMetricType(metricType: string): string {
  const labels = {
    'aigenerations': 'AI generations',
    'projects': 'projects',
    'collaborators': 'collaborators',
    'apicalls': 'API calls',
    'storagegb': 'GB storage'
  };
  return labels[metricType.toLowerCase()] || metricType;
}

// Export all components
export {
  UsageCheck,
  UpgradePrompt,
  UsageWarning,
  PlanBadge,
  FeatureAvailability,
  UsageMeter
};