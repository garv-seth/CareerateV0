import { useState, useEffect } from "react";
import { Zap, Crown, Building, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  // Fetch available subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
    enabled: true
  });

  // Fetch current user subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
    enabled: true
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: string, billingCycle: string }) => {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Created",
        description: "Your subscription has been created successfully!",
      });
      
      // Invalidate cache to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/billing-history'] });
      
      // Redirect to payment if needed
      if (data.clientSecret) {
        // Handle Stripe payment flow
        window.location.href = `/payment?client_secret=${data.clientSecret}`;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Plan upgrade/downgrade mutation
  const changePlanMutation = useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: string, billingCycle: string }) => {
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan Changed",
        description: "Your subscription plan has been updated successfully!",
      });
      
      // Invalidate cache to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/billing-history'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Plan Change Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePlanSelection = async (plan: any) => {
    try {
      // Check if user has existing subscription
      if (currentSubscription?.subscription) {
        // User has existing subscription - change plan
        await changePlanMutation.mutateAsync({
          planId: plan.id,
          billingCycle: billingPeriod
        });
      } else {
        // User has no subscription - create new one
        await createSubscriptionMutation.mutateAsync({
          planId: plan.id,
          billingCycle: billingPeriod
        });
      }
    } catch (error) {
      console.error('Plan selection error:', error);
    }
  };

  const getButtonText = (plan: any) => {
    if (currentSubscription?.plan?.name?.toLowerCase() === plan.name.toLowerCase()) {
      return "Current Plan";
    }
    
    if (plan.name.toLowerCase() === 'enterprise') {
      return "Contact Sales";
    }
    
    if (currentSubscription?.subscription) {
      return currentSubscription.plan?.monthlyPrice < plan.monthlyPrice ? "Upgrade" : "Downgrade";
    }
    
    return "Start Free Trial";
  };

  const isCurrentPlan = (plan: any) => {
    return currentSubscription?.plan?.name?.toLowerCase() === plan.name.toLowerCase();
  };

  const getPlanFeatures = (planName: string) => {
    const features = {
      starter: [
        "5 AI generations per month",
        "3 projects maximum",
        "Basic Vibe Coding features",
        "Standard hosting infrastructure",
        "Community support",
        "Basic templates"
      ],
      professional: [
        "Unlimited AI generations",
        "Unlimited projects",
        "Full Vibe Coding + Vibe Hosting",
        "Real-time collaboration",
        "Priority support",
        "Advanced GitHub integration",
        "Real-time monitoring & alerts",
        "Custom domains & SSL",
        "Advanced templates",
        "API access"
      ],
      enterprise: [
        "Everything in Professional",
        "White-label solution",
        "Custom AI model training",
        "Dedicated infrastructure",
        "24/7 phone support",
        "SLA guarantees",
        "Advanced security features",
        "Compliance certifications",
        "Custom integrations",
        "Team management",
        "Advanced analytics"
      ]
    };
    
    return features[planName.toLowerCase()] || [];
  };

  // Loading state
  if (plansLoading || subscriptionLoading) {
    return (
      <section id="pricing" className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pricing plans...</p>
        </div>
      </section>
    );
  }

  // Default plans if API doesn't return data
  const displayPlans = plans.length > 0 ? plans : [
    {
      id: 'starter',
      name: "Starter",
      description: "Perfect for solo developers and small projects",
      monthlyPrice: 29,
      yearlyPrice: 24,
      features: getPlanFeatures('starter')
    },
    {
      id: 'professional',
      name: "Professional", 
      description: "For growing teams and businesses",
      monthlyPrice: 99,
      yearlyPrice: 82,
      features: getPlanFeatures('professional'),
      popular: true
    },
    {
      id: 'enterprise',
      name: "Enterprise",
      description: "For large organizations and mission-critical apps",
      monthlyPrice: 499,
      yearlyPrice: 415,
      features: getPlanFeatures('enterprise')
    }
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="pricing-title">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground mb-8" data-testid="pricing-description">
            Choose the plan that fits your needs. All plans include both Vibe Coding and Vibe Hosting.
          </p>
          
          {/* Current Subscription Status */}
          {currentSubscription?.subscription && (
            <div className="mb-8 p-4 bg-card rounded-lg border" data-testid="current-subscription-status">
              <p className="text-sm text-muted-foreground">
                Current Plan: <span className="font-semibold text-foreground">
                  {currentSubscription.plan?.name} - ${currentSubscription.plan?.monthlyPrice}/month
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: {currentSubscription.subscription.status}
              </p>
            </div>
          )}
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-muted rounded-full p-1" data-testid="billing-toggle">
            <button 
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                billingPeriod === 'monthly' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="button-monthly"
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                billingPeriod === 'yearly' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="button-yearly"
            >
              Yearly <span className="text-accent text-sm ml-1">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {displayPlans.map((plan, index) => {
            const planIcon = plan.name === 'Starter' ? <Zap className="text-secondary-foreground" /> :
                           plan.name === 'Professional' ? <Crown className="text-secondary-foreground" /> :
                           <Building className="text-accent-foreground" />;
            
            const planColor = plan.name === 'Enterprise' ? 'bg-accent' : 'bg-secondary';
            const currentPlan = isCurrentPlan(plan);
            const isLoading = createSubscriptionMutation.isPending || changePlanMutation.isPending;
            
            return (
              <div 
                key={plan.id || index}
                className={`bg-card rounded-2xl p-8 transition-all hover:shadow-lg ${
                  plan.popular || currentPlan ? 'border-2 border-secondary relative' : 'border border-border'
                } ${currentPlan ? 'ring-2 ring-primary' : ''}`}
                data-testid={`pricing-plan-${plan.name.toLowerCase()}`}
              >
                {(plan.popular || currentPlan) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className={`px-4 py-1 rounded-full text-sm font-medium ${
                      currentPlan ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {currentPlan ? 'Current Plan' : 'Most Popular'}
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className={`w-12 h-12 ${planColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    {planIcon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2" data-testid={`plan-name-${plan.name.toLowerCase()}`}>
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground mb-6" data-testid={`plan-description-${plan.name.toLowerCase()}`}>
                    {plan.description}
                  </p>
                  <div className="text-4xl font-bold mb-2" data-testid={`plan-price-${plan.name.toLowerCase()}`}>
                    ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    <span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-accent">
                      Billed annually (${(plan.yearlyPrice * 12).toLocaleString()}/year)
                    </p>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start" data-testid={`plan-feature-${plan.name.toLowerCase()}-${featureIndex}`}>
                      <Check className="text-accent mr-3 h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={currentPlan ? "outline" : plan.popular ? "default" : "outline"}
                  className={`w-full py-3 rounded-full font-semibold transition-all ${
                    currentPlan ? 'cursor-default' : 'hover:shadow-md'
                  }`}
                  disabled={currentPlan || isLoading}
                  onClick={() => !currentPlan && handlePlanSelection(plan)}
                  data-testid={`button-plan-${plan.name.toLowerCase()}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {getButtonText(plan)}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
          <p className="text-sm text-muted-foreground">
            Need a custom plan? <a href="/contact" className="text-accent hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </section>
  );
}

// Stripe Elements wrapper component for checkout
export function PricingSectionWithStripe() {
  return (
    <Elements stripe={stripePromise}>
      <PricingSection />
    </Elements>
  );
}