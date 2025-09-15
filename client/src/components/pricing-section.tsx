import { useState } from "react";
import { Zap, Crown, Building, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Starter",
      icon: <Zap className="text-secondary-foreground" />,
      description: "Perfect for solo developers and small projects",
      price: { monthly: 29, yearly: 24 },
      features: [
        "5 applications per month",
        "Basic Vibe Coding features",
        "Standard hosting infrastructure",
        "Community support"
      ],
      buttonText: "Start Free Trial",
      buttonStyle: "outline",
      color: "bg-secondary"
    },
    {
      name: "Professional",
      icon: <Crown className="text-secondary-foreground" />,
      description: "For growing teams and businesses",
      price: { monthly: 99, yearly: 82 },
      features: [
        "Unlimited applications",
        "Full Vibe Coding + Vibe Hosting",
        "Dedicated hosting infrastructure",
        "Priority support",
        "Advanced GitHub integration",
        "Real-time monitoring & alerts",
        "Custom domains",
        "SSL certificates",
        "Database scaling"
      ],
      buttonText: "Start Free Trial",
      buttonStyle: "default",
      color: "bg-secondary",
      popular: true
    },
    {
      name: "Enterprise",
      icon: <Building className="text-accent-foreground" />,
      description: "For large organizations and mission-critical apps",
      price: { monthly: 499, yearly: 415 },
      features: [
        "Everything in Professional",
        "White-label solution",
        "Custom AI model training",
        "Dedicated infrastructure",
        "24/7 phone support",
        "SLA guarantees",
        "Advanced security features",
        "Compliance certifications",
        "Custom integrations"
      ],
      buttonText: "Contact Sales",
      buttonStyle: "default",
      color: "bg-accent"
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
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-muted rounded-full p-1" data-testid="billing-toggle">
            <button 
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-full font-medium ${
                billingPeriod === 'monthly' ? 'bg-card text-foreground' : 'text-muted-foreground'
              }`}
              data-testid="button-monthly"
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-full font-medium ${
                billingPeriod === 'yearly' ? 'bg-card text-foreground' : 'text-muted-foreground'
              }`}
              data-testid="button-yearly"
            >
              Yearly <span className="text-accent text-sm">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-card rounded-2xl p-8 ${
                plan.popular ? 'border-2 border-secondary relative' : 'border border-border'
              }`}
              data-testid={`pricing-plan-${index}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <div className={`w-12 h-12 ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2" data-testid={`plan-name-${index}`}>
                  {plan.name}
                </h3>
                <p className="text-muted-foreground mb-6" data-testid={`plan-description-${index}`}>
                  {plan.description}
                </p>
                <div className="text-4xl font-bold mb-2" data-testid={`plan-price-${index}`}>
                  ${plan.price[billingPeriod]}
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center" data-testid={`plan-feature-${index}-${featureIndex}`}>
                    <Check className="text-accent mr-3 h-4 w-4 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.buttonStyle as "outline" | "default"}
                className={`w-full py-3 rounded-full font-semibold transition-colors ${
                  plan.buttonStyle === 'default' 
                    ? plan.popular 
                      ? 'bg-secondary text-secondary-foreground hover:bg-indigo-600' 
                      : 'bg-primary text-primary-foreground hover:bg-gray-800'
                    : ''
                }`}
                data-testid={`button-plan-${index}`}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
