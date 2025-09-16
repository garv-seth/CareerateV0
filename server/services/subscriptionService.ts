// Comprehensive Subscription Management Service for Careerate
// From javascript_stripe blueprint integration

import Stripe from "stripe";
import { 
  subscriptionPlans, 
  userSubscriptions, 
  usageTracking, 
  billingHistory, 
  paymentMethods,
  users,
  type SubscriptionPlan, 
  type UserSubscription, 
  type InsertUserSubscription,
  type UsageTracking,
  type InsertUsageTracking,
  type BillingHistory,
  type InsertBillingHistory,
  type PaymentMethod,
  type InsertPaymentMethod
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, gte, lte, isNull, or } from "drizzle-orm";

// Initialize Stripe (from javascript_stripe blueprint)
// Make Stripe optional to allow app to run without credentials
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
} else {
  console.warn('STRIPE_SECRET_KEY not found. Stripe features will be disabled.');
}

export interface PlanLimits {
  projects: number;
  aiGenerations: number; // per month
  storageGB: number;
  collaborators: number;
  apiCalls: number; // per month
  [key: string]: number;
}

export interface SubscriptionServiceError {
  code: string;
  message: string;
  details?: any;
}

export class SubscriptionService {
  
  // Helper method to check if Stripe is available
  private ensureStripeAvailable(): Stripe {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    return stripe;
  }
  
  // =====================================================
  // Plan Management
  // =====================================================
  
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.sortOrder, subscriptionPlans.monthlyPrice);
    } catch (error) {
      throw new Error(`Failed to get active plans: ${error.message}`);
    }
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
      
      return plans[0] || null;
    } catch (error) {
      throw new Error(`Failed to get plan: ${error.message}`);
    }
  }

  async getPlanByName(planName: string): Promise<SubscriptionPlan | null> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, planName))
        .limit(1);
      
      return plans[0] || null;
    } catch (error) {
      throw new Error(`Failed to get plan by name: ${error.message}`);
    }
  }

  getPlanLimits(plan: SubscriptionPlan): PlanLimits {
    const limits = plan.limits as PlanLimits || {};
    
    // Default limits based on plan
    const defaultLimits: { [key: string]: PlanLimits } = {
      free: {
        projects: 1,
        aiGenerations: 5,
        storageGB: 1,
        collaborators: 0,
        apiCalls: 100
      },
      starter: {
        projects: 5,
        aiGenerations: 50,
        storageGB: 5,
        collaborators: 2,
        apiCalls: 1000
      },
      professional: {
        projects: -1, // unlimited
        aiGenerations: -1, // unlimited
        storageGB: 100,
        collaborators: 10,
        apiCalls: 10000
      },
      enterprise: {
        projects: -1, // unlimited
        aiGenerations: -1, // unlimited
        storageGB: 1000,
        collaborators: -1, // unlimited
        apiCalls: 100000
      }
    };

    return { ...defaultLimits[plan.name] || defaultLimits.free, ...limits };
  }

  // =====================================================
  // User Subscription Management
  // =====================================================

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const subscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        ))
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);
      
      return subscriptions[0] || null;
    } catch (error) {
      throw new Error(`Failed to get user subscription: ${error.message}`);
    }
  }

  async getUserSubscriptionWithPlan(userId: string): Promise<(UserSubscription & { plan: SubscriptionPlan }) | null> {
    try {
      const result = await db
        .select({
          subscription: userSubscriptions,
          plan: subscriptionPlans
        })
        .from(userSubscriptions)
        .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        ))
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);
      
      if (!result[0]) return null;
      
      return {
        ...result[0].subscription,
        plan: result[0].plan
      };
    } catch (error) {
      throw new Error(`Failed to get user subscription with plan: ${error.message}`);
    }
  }

  async createSubscription(data: InsertUserSubscription): Promise<UserSubscription> {
    try {
      const subscriptions = await db
        .insert(userSubscriptions)
        .values(data)
        .returning();
      
      return subscriptions[0];
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
      const subscriptions = await db
        .update(userSubscriptions)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userSubscriptions.id, subscriptionId))
        .returning();
      
      return subscriptions[0] || null;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<UserSubscription | null> {
    try {
      const subscription = await this.updateSubscription(subscriptionId, {
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? undefined : new Date()
      });

      // Also cancel in Stripe if we have a Stripe subscription ID
      if (subscription?.stripeSubscriptionId) {
        await this.ensureStripeAvailable().subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd
        });
      }

      return subscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  // =====================================================
  // Usage Tracking
  // =====================================================

  async getCurrentUsage(userId: string, metricType: string): Promise<UsageTracking | null> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const usage = await db
        .select()
        .from(usageTracking)
        .where(and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.metricType, metricType),
          eq(usageTracking.period, 'current_month'),
          gte(usageTracking.periodStart, startOfMonth),
          lte(usageTracking.periodEnd, endOfMonth)
        ))
        .orderBy(desc(usageTracking.createdAt))
        .limit(1);
      
      return usage[0] || null;
    } catch (error) {
      throw new Error(`Failed to get current usage: ${error.message}`);
    }
  }

  async incrementUsage(userId: string, metricType: string, increment = 1): Promise<UsageTracking> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Get or create current usage record
      let usage = await this.getCurrentUsage(userId, metricType);
      
      if (!usage) {
        // Create new usage record
        const usageData: InsertUsageTracking = {
          userId,
          metricType,
          metricValue: increment,
          period: 'current_month',
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
          resetAt: endOfMonth,
          lastIncrement: now
        };

        const newUsage = await db
          .insert(usageTracking)
          .values(usageData)
          .returning();
        
        return newUsage[0];
      } else {
        // Update existing usage record
        const updatedUsage = await db
          .update(usageTracking)
          .set({
            metricValue: usage.metricValue + increment,
            lastIncrement: now,
            updatedAt: now
          })
          .where(eq(usageTracking.id, usage.id))
          .returning();
        
        return updatedUsage[0];
      }
    } catch (error) {
      throw new Error(`Failed to increment usage: ${error.message}`);
    }
  }

  async checkUsageLimit(userId: string, metricType: string): Promise<{ allowed: boolean; usage: number; limit: number; plan: string }> {
    try {
      // Get user's current subscription and plan
      const subscriptionWithPlan = await this.getUserSubscriptionWithPlan(userId);
      
      if (!subscriptionWithPlan) {
        // No subscription, use free plan limits
        const freePlan = await this.getPlanByName('free');
        if (!freePlan) throw new Error('Free plan not found');
        
        const limits = this.getPlanLimits(freePlan);
        const usage = await this.getCurrentUsage(userId, metricType);
        const currentUsage = usage?.metricValue || 0;
        const limit = limits[metricType] || 0;
        
        return {
          allowed: limit === -1 || currentUsage < limit,
          usage: currentUsage,
          limit,
          plan: 'free'
        };
      }

      // Get plan limits
      const limits = this.getPlanLimits(subscriptionWithPlan.plan);
      const usage = await this.getCurrentUsage(userId, metricType);
      const currentUsage = usage?.metricValue || 0;
      const limit = limits[metricType] || 0;

      return {
        allowed: limit === -1 || currentUsage < limit, // -1 means unlimited
        usage: currentUsage,
        limit,
        plan: subscriptionWithPlan.plan.name
      };
    } catch (error) {
      throw new Error(`Failed to check usage limit: ${error.message}`);
    }
  }

  async getAllUserUsage(userId: string): Promise<{ [key: string]: { usage: number; limit: number } }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get all current month usage
      const usageRecords = await db
        .select()
        .from(usageTracking)
        .where(and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.period, 'current_month'),
          gte(usageTracking.periodStart, startOfMonth),
          lte(usageTracking.periodEnd, endOfMonth)
        ));

      // Get user's plan limits
      const subscriptionWithPlan = await this.getUserSubscriptionWithPlan(userId);
      const plan = subscriptionWithPlan?.plan || await this.getPlanByName('free');
      if (!plan) throw new Error('No plan found');
      
      const limits = this.getPlanLimits(plan);

      // Build usage summary
      const usageSummary: { [key: string]: { usage: number; limit: number } } = {};
      
      // Initialize with plan limits
      Object.keys(limits).forEach(metricType => {
        usageSummary[metricType] = {
          usage: 0,
          limit: limits[metricType]
        };
      });

      // Add actual usage
      usageRecords.forEach(record => {
        if (usageSummary[record.metricType]) {
          usageSummary[record.metricType].usage = record.metricValue;
        }
      });

      return usageSummary;
    } catch (error) {
      throw new Error(`Failed to get all user usage: ${error.message}`);
    }
  }

  // =====================================================
  // Stripe Integration (from javascript_stripe blueprint)
  // =====================================================

  async createOrGetStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // Check if user already has a Stripe customer ID
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.stripeCustomerId) {
        return user[0].stripeCustomerId;
      }

      // Create new Stripe customer
      const customer = await this.ensureStripeAvailable().customers.create({
        email,
        name,
        metadata: { userId }
      });

      // Update user record with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customer.id })
        .where(eq(users.id, userId));

      return customer.id;
    } catch (error) {
      throw new Error(`Failed to create or get Stripe customer: ${error.message}`);
    }
  }

  async createStripeSubscription(
    userId: string, 
    planId: string, 
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{ subscription: UserSubscription; clientSecret?: string }> {
    try {
      // Get plan details
      const plan = await this.getPlanById(planId);
      if (!plan) throw new Error('Plan not found');

      // Get user details
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user[0]) throw new Error('User not found');

      // Create or get Stripe customer
      const customerId = await this.createOrGetStripeCustomer(
        userId, 
        user[0].email!, 
        `${user[0].firstName} ${user[0].lastName}`.trim()
      );

      // Determine which Stripe price ID to use
      const stripePriceId = billingCycle === 'yearly' 
        ? plan.stripeYearlyPriceId 
        : plan.stripeMonthlyPriceId;

      if (!stripePriceId) {
        throw new Error(`Stripe price ID not configured for ${billingCycle} billing`);
      }

      // Create Stripe subscription
      const stripeSubscription = await this.ensureStripeAvailable().subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Create our subscription record
      const subscriptionData: InsertUserSubscription = {
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status as any,
        billingCycle,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        unitAmount: plan[billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice'],
        currency: 'usd'
      };

      const subscription = await this.createSubscription(subscriptionData);

      // Get client secret for payment confirmation
      const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

      return {
        subscription,
        clientSecret: paymentIntent?.client_secret
      };
    } catch (error) {
      throw new Error(`Failed to create Stripe subscription: ${error.message}`);
    }
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      throw new Error(`Failed to handle Stripe webhook: ${error.message}`);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscription.id))
      .limit(1);

    if (subscription[0]) {
      await this.updateSubscription(subscription[0].id, {
        status: stripeSubscription.status as any,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null
      });
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscription.id))
      .limit(1);

    if (subscription[0]) {
      await this.updateSubscription(subscription[0].id, {
        status: 'canceled',
        canceledAt: new Date()
      });
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    // Record successful payment in billing history
    const subscriptionId = invoice.subscription as string;
    
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);

    if (subscription[0]) {
      const billingData: InsertBillingHistory = {
        userId: subscription[0].userId,
        subscriptionId: subscription[0].id,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_paid / 100).toString(), // Convert from cents
        currency: invoice.currency,
        status: 'paid',
        paymentStatus: 'succeeded',
        description: invoice.description || 'Subscription payment',
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000)
      };

      await db.insert(billingHistory).values(billingData);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Record failed payment in billing history
    const subscriptionId = invoice.subscription as string;
    
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);

    if (subscription[0]) {
      const billingData: InsertBillingHistory = {
        userId: subscription[0].userId,
        subscriptionId: subscription[0].id,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_due / 100).toString(), // Convert from cents
        currency: invoice.currency,
        status: 'past_due',
        paymentStatus: 'failed',
        description: invoice.description || 'Subscription payment',
        invoiceUrl: invoice.hosted_invoice_url,
        failureReason: 'Payment failed',
        attemptedAt: new Date(),
        nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : undefined
      };

      await db.insert(billingHistory).values(billingData);

      // Update subscription status
      await this.updateSubscription(subscription[0].id, {
        status: 'past_due'
      });
    }
  }

  // =====================================================
  // Billing History
  // =====================================================

  async getUserBillingHistory(userId: string): Promise<BillingHistory[]> {
    try {
      return await db
        .select()
        .from(billingHistory)
        .where(eq(billingHistory.userId, userId))
        .orderBy(desc(billingHistory.createdAt));
    } catch (error) {
      throw new Error(`Failed to get billing history: ${error.message}`);
    }
  }

  // =====================================================
  // Plan Change Operations
  // =====================================================

  async changePlan(userId: string, newPlanId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<UserSubscription> {
    try {
      const currentSubscription = await this.getUserSubscription(userId);
      
      if (!currentSubscription) {
        // No current subscription, create new one
        const result = await this.createStripeSubscription(userId, newPlanId, billingCycle);
        return result.subscription;
      }

      // Get new plan
      const newPlan = await this.getPlanById(newPlanId);
      if (!newPlan) throw new Error('New plan not found');

      // Update Stripe subscription
      if (currentSubscription.stripeSubscriptionId) {
        const stripePriceId = billingCycle === 'yearly' 
          ? newPlan.stripeYearlyPriceId 
          : newPlan.stripeMonthlyPriceId;

        if (!stripePriceId) {
          throw new Error(`Stripe price ID not configured for ${billingCycle} billing`);
        }

        await this.ensureStripeAvailable().subscriptions.update(currentSubscription.stripeSubscriptionId, {
          items: [{
            price: stripePriceId
          }],
          proration_behavior: 'create_prorations'
        });
      }

      // Update our subscription record
      const updatedSubscription = await this.updateSubscription(currentSubscription.id, {
        planId: newPlanId,
        billingCycle,
        unitAmount: newPlan[billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice']
      });

      if (!updatedSubscription) throw new Error('Failed to update subscription');
      
      return updatedSubscription;
    } catch (error) {
      throw new Error(`Failed to change plan: ${error.message}`);
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();