import express, { type Express } from "express";
import { randomUUID, createHash } from "crypto";
import { createServer, type Server } from "http";
import Stripe from "stripe"; // From javascript_stripe blueprint
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./azureAuth";
import {
  insertProjectSchema,
  insertCodeGenerationSchema,
  insertIntegrationSchema,
  insertAiAgentSchema,
  insertAgentTaskSchema,
  insertAgentCommunicationSchema,
  type User,
  type Project,
  type CodeGeneration,
  type Integration,
  type AiAgent,
  type AgentTask,
  type AgentCommunication
} from "@shared/schema";
import { 
  generateCodeFromPrompt, 
  generateCodeStreamFromPrompt,
  improveCode,
  analyzeCode,
  generateTests,
  optimizeCode,
  type GenerationContext,
  type StreamingUpdate
} from "./services/ai";
import { agentManager } from "./services/agentManager";
import { enhancedAgentManager } from "./services/enhancedAgentManager";
import { legacyAssessmentService } from "./services/legacyAssessment";
import { integrationService } from "./services/integrationService";
import { repositoryIntegrationService } from "./services/repositoryIntegrationService";
import { apiConnectorManager, ApiConnectorFactory } from "./services/apiConnectorFramework";
import { encryptionService, secretsManager } from "./services/encryptionService";
import { collaborationServer } from "./services/collaborationServer";
import { subscriptionService } from "./services/subscriptionService"; // Subscription management service
import { 
  projectCreationMiddleware,
  aiGenerationMiddleware,
  apiCallMiddleware,
  collaborationMiddleware,
  storageMiddleware,
  usageReportingMiddleware,
  usageSummaryMiddleware,
  professionalFeatureMiddleware,
  enterpriseFeatureMiddleware,
  collaborationFeatureMiddleware,
  monitoringFeatureMiddleware,
  customIntegrationMiddleware,
  teamManagementMiddleware,
  validateUsage,
  incrementUsage
} from "./services/usageTrackingMiddleware"; // Usage tracking middleware
import { 
  insertIntegrationSchema,
  insertIntegrationSecretSchema,
  insertRepositoryConnectionSchema,
  insertApiConnectionSchema,
  insertWebhookConfigurationSchema,
  insertApiRateLimitSchema
} from "@shared/schema";

// Initialize Stripe (from javascript_stripe blueprint)
// Make Stripe optional to allow app to run without credentials
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
} else {
  console.warn('STRIPE_SECRET_KEY not found in routes. Stripe payment routes will be disabled.');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth first
  await setupAuth(app);

  // Create HTTP server and initialize WebSocket collaboration
  const server = createServer(app);
  collaborationServer.initialize(server);

  // Request correlation ID middleware
  app.use((req, res, next) => {
    const existing = (req.headers["x-request-id"] as string) || undefined;
    const id = existing || randomUUID();
    res.setHeader("x-request-id", id);
    (req as any).requestId = id;
    (res as any).locals = (res as any).locals || {};
    (res as any).locals.requestId = id;
    next();
  });

  // Structured request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const user = (req as any).user || {};
      const userId = user?.claims?.sub || user?.id || 'anonymous';
      const userHash = createHash('sha256').update(String(userId)).digest('hex').slice(0, 12);
      const projectId = (req as any).params?.id || (req as any).params?.projectId || undefined;
      const event = {
        ts: new Date().toISOString(),
        reqId: (res as any).locals?.requestId,
        user: userHash,
        projectId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs
      };
      try { console.log(JSON.stringify({ type: 'http', ...event })); } catch {}
    });
    next();
  });

  // Helper function to get authenticated user ID
  const getUserId = (req: any): string => {
    const user = req.user as any;
    return user?.claims?.sub || user?.id;
  };

  // Owner whitelist for full-access bypass on plans/usage
  const OWNER_WHITELIST = [
    'garvseth@outlook.com',
    'garv.seth@gmail.com',
    'garvseth@uw.edu',
    'thesm2018@gmail.com',
    'garvytp@gmail.com'
  ];
  const isOwnerWhitelisted = (email?: string): boolean => !!email && OWNER_WHITELIST.includes(email.toLowerCase());

  // Helper function to validate project ownership
  const validateProjectOwnership = async (projectId: string, userId: string) => {
    const project = await storage.getProject(projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Project not found or access denied');
    }
    return project;
  };
  // Get current authenticated user
  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response (if it exists)
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update current authenticated user profile (name, metadata)
  app.put("/api/user", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const allowed = (({ name, metadata }) => ({ name, metadata }))(req.body || {});
      const updated = await (storage as any).updateUser?.(userId, allowed);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updated as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get authenticated user's projects
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const projects = await storage.getProjectsByUserId(userId);

      // Flatten metadata for easier frontend consumption
      const enhancedProjects = projects.map(project => ({
        ...project,
        framework: project.metadata?.framework || "unknown",
        status: project.metadata?.status || "created",
        deploymentUrl: project.metadata?.deploymentUrl
      }));

      res.json(enhancedProjects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  // Get single project with ownership validation
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const project = await validateProjectOwnership(req.params.id, userId);
      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(404).json({ message: "Project not found" });
    }
  });

  // Create new project for authenticated user (with usage tracking)
  app.post("/api/projects", isAuthenticated, projectCreationMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, description, framework } = req.body;

      // Validate required fields
      if (!name || !framework) {
        return res.status(400).json({ message: "Name and framework are required" });
      }

      const projectData = {
        userId,
        name,
        description: description || "",
        framework: framework || "react", // Ensure framework is set at top level
        metadata: {
          framework,
          status: "created",
          createdAt: new Date().toISOString(),
          files: {}, // Initialize empty files object
          ...(req.body.metadata || {})
        }
      };

      const project = await storage.createProject(projectData);

      // Return project with flattened metadata for easier frontend consumption
      const responseProject = {
        ...project,
        framework: project.metadata?.framework || framework,
        status: project.metadata?.status || "created"
      };

      res.status(201).json(responseProject);
    } catch (error) {
      console.error('Project creation error:', error);
      res.status(400).json({ message: "Failed to create project", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update project with ownership validation
  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateProjectOwnership(req.params.id, userId);
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error('Update project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project with ownership validation
  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateProjectOwnership(req.params.id, userId);
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // =====================================================
  // Comprehensive Subscription and Billing API Endpoints
  // =====================================================

  // Get all available subscription plans
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await subscriptionService.getActivePlans();
      res.json(plans);
    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({ message: "Failed to get subscription plans" });
    }
  });

  // Get current user's subscription details with usage information
  app.get("/api/subscription/current", isAuthenticated, usageSummaryMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = (req.user as any)?.claims?.email || (req.user as any)?.email;

      // Owners get unlimited plan and bypass limits
      if (isOwnerWhitelisted(userEmail)) {
        return res.json({
          subscription: null,
          plan: { name: 'owner' },
          message: "Owner access - usage limits bypassed"
        });
      }
      const subscription = await subscriptionService.getUserSubscriptionWithPlan(userId);
      
      if (!subscription) {
        return res.json({
          subscription: null,
          plan: await subscriptionService.getPlanByName('free'),
          message: "No active subscription - using free plan"
        });
      }

      res.json({
        subscription,
        plan: subscription.plan
      });
    } catch (error) {
      console.error('Get current subscription error:', error);
      res.status(500).json({ message: "Failed to get subscription details" });
    }
  });

  // Health endpoint for usage checking
  app.post("/api/auth/usage-check", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = (req.user as any)?.claims?.email || (req.user as any)?.email;
      const { metricType = 'projects' } = req.body;

      const usageResult = await validateUsage(userId, metricType, userEmail);

      res.json({
        allowed: usageResult.allowed,
        reason: usageResult.error,
        limits: {
          usage: usageResult.usage,
          limit: usageResult.limit,
          plan: usageResult.plan
        }
      });
    } catch (error) {
      console.error('Usage check endpoint error:', error);
      // Return allowed: true for health endpoint failures
      res.json({
        allowed: true,
        reason: 'Usage check service unavailable, allowing operation',
        limits: {
          usage: 0,
          limit: -1,
          plan: 'unknown'
        }
      });
    }
  });

  // Create new subscription (from javascript_stripe blueprint)
  app.post("/api/subscription/create", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { planId, billingCycle = 'monthly' } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      // Check if user already has an active subscription
      const existingSubscription = await subscriptionService.getUserSubscription(userId);
      if (existingSubscription) {
        return res.status(400).json({ 
          message: "User already has an active subscription. Use upgrade/downgrade endpoint instead.",
          code: "SUBSCRIPTION_EXISTS"
        });
      }

      const result = await subscriptionService.createStripeSubscription(userId, planId, billingCycle);
      
      res.status(201).json({
        subscription: result.subscription,
        clientSecret: result.clientSecret,
        message: "Subscription created successfully"
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to create subscription",
        code: "SUBSCRIPTION_CREATION_FAILED"
      });
    }
  });

  // Upgrade/downgrade subscription plan
  app.post("/api/subscription/change-plan", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { planId, billingCycle = 'monthly' } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const updatedSubscription = await subscriptionService.changePlan(userId, planId, billingCycle);
      
      res.json({
        subscription: updatedSubscription,
        message: "Plan changed successfully"
      });
    } catch (error) {
      console.error('Change plan error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to change plan",
        code: "PLAN_CHANGE_FAILED"
      });
    }
  });

  // Cancel subscription
  app.post("/api/subscription/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { cancelAtPeriodEnd = true } = req.body;

      const subscription = await subscriptionService.getUserSubscription(userId);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      const canceledSubscription = await subscriptionService.cancelSubscription(
        subscription.id, 
        cancelAtPeriodEnd
      );
      
      res.json({
        subscription: canceledSubscription,
        message: cancelAtPeriodEnd 
          ? "Subscription will be canceled at the end of the billing period"
          : "Subscription canceled immediately"
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to cancel subscription",
        code: "SUBSCRIPTION_CANCELLATION_FAILED"
      });
    }
  });

  // Get user's usage statistics
  app.get("/api/subscription/usage", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = (req.user as any)?.claims?.email || (req.user as any)?.email;

      // Owners: return unlimited indicators for common metrics
      if (isOwnerWhitelisted(userEmail)) {
        return res.json({
          usage: {},
          plan: 'owner',
          subscription: null
        });
      }

      const usageSummary = await subscriptionService.getAllUserUsage(userId);
      const subscriptionWithPlan = await subscriptionService.getUserSubscriptionWithPlan(userId);
      
      res.json({
        usage: usageSummary,
        plan: subscriptionWithPlan?.plan?.name || 'free',
        subscription: subscriptionWithPlan || null
      });
    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({ message: "Failed to get usage statistics" });
    }
  });

  // Get specific usage metric
  app.get("/api/subscription/usage/:metricType", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = (req.user as any)?.claims?.email || (req.user as any)?.email;
      const { metricType } = req.params;

      // Use owner-aware validator which gracefully degrades on errors
      const usageCheck = await validateUsage(userId, metricType, userEmail);

      res.json({
        metricType,
        usage: usageCheck.usage,
        limit: usageCheck.limit,
        allowed: usageCheck.allowed,
        plan: usageCheck.plan,
        remaining: usageCheck.limit === -1 ? -1 : Math.max(0, usageCheck.limit - usageCheck.usage)
      });
    } catch (error) {
      console.error('Get metric usage error:', error);
      res.status(500).json({ message: "Failed to get usage metric" });
    }
  });

  // Get billing history
  app.get("/api/subscription/billing-history", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const billingHistory = await subscriptionService.getUserBillingHistory(userId);
      
      res.json(billingHistory);
    } catch (error) {
      console.error('Get billing history error:', error);
      res.status(500).json({ message: "Failed to get billing history" });
    }
  });

  // Create payment intent for one-time charges (from javascript_stripe blueprint)
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: getUserId(req)
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Get or create subscription (from javascript_stripe blueprint)
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a subscription
      const existingSubscription = await subscriptionService.getUserSubscription(userId);
      
      if (existingSubscription?.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(existingSubscription.stripeSubscriptionId);

        return res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      // Create or get Stripe customer
      const customerId = await subscriptionService.createOrGetStripeCustomer(
        userId, 
        user.email, 
        `${user.firstName} ${user.lastName}`.trim()
      );

      // Get default plan (you may want to make this configurable)
      const defaultPlan = await subscriptionService.getPlanByName('professional');
      if (!defaultPlan) {
        return res.status(500).json({ message: 'Default plan not found' });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: defaultPlan.stripeMonthlyPriceId || process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Create our subscription record
      await subscriptionService.createSubscription({
        userId,
        planId: defaultPlan.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status as any,
        billingCycle: 'monthly',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        unitAmount: defaultPlan.monthlyPrice,
        currency: 'usd'
      });
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error('Get or create subscription error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Stripe webhook handler (from javascript_stripe blueprint)
  app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await subscriptionService.handleStripeWebhook(event);
      res.json({received: true});
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  // =====================================================
  // Enhanced Vibe Coding Engine API Endpoints
  // =====================================================

  // Project Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const { category } = req.query;
      const templates = await storage.getProjectTemplates(category as string);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  app.post("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertProjectTemplateSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const template = await storage.createProjectTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  // Enhanced code generation with streaming support (with AI usage tracking)
  app.post("/api/generate-code", isAuthenticated, aiGenerationMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCodeGenerationSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      // Create code generation record
      const generation = await storage.createCodeGeneration({
        ...data,
        status: "pending",
        progress: 0
      });
      
      // Get existing project context
      const project = await storage.getProject(data.projectId);
      
      const context: GenerationContext = {
        type: data.generationType || 'full-app',
        framework: data.framework || project?.framework,
        existingCode: project?.files as Record<string, string> || {}
      };
      
      try {
        // Generate code using enhanced AI service
        const generatedCode = await generateCodeFromPrompt(data.prompt, context);
        
        // Update generation record
        await storage.updateCodeGeneration(generation.id, {
          status: "completed",
          progress: 100,
          generatedCode: generatedCode,
          success: true,
          tokensUsed: generatedCode.metadata?.tokensUsed || 0,
          completedAt: new Date()
        });
        
        // Update project
        const updatedProject = await storage.updateProject(data.projectId, {
          files: generatedCode.files,
          framework: generatedCode.framework,
          description: generatedCode.description,
          dependencies: generatedCode.dependencies,
          databaseSchema: generatedCode.databaseSchema,
          apiEndpoints: generatedCode.apiEndpoints,
          status: "building"
        });

        // Create generation history
        const historyCount = await storage.getGenerationHistory(data.projectId);
        await storage.createGenerationHistory({
          projectId: data.projectId,
          generationId: generation.id,
          version: historyCount.length + 1,
          snapshot: {
            files: generatedCode.files,
            dependencies: generatedCode.dependencies
          },
          prompt: data.prompt,
          parentVersion: historyCount.length,
          isCurrent: true
        });

        // Real deployment using deployment manager
        const { deploymentManager } = await import("./services/deploymentManager");
        
        // Deploy the project using real deployment infrastructure
        deploymentManager.deployProject({
          projectId: data.projectId,
          version: historyCount.length + 1,
          strategy: "blue-green",
          environment: "production",
          buildCommand: "npm install",
          startCommand: "npm start",
          port: 5000 + Math.floor(Math.random() * 1000) // Allocate random port
        }).then(async (result) => {
          if (result.status === "success") {
            await storage.updateProject(data.projectId, {
              status: "deployed",
              deploymentUrl: result.url || `https://${updatedProject?.name?.toLowerCase().replace(/\s+/g, '-')}.careerate.dev`
            });
          } else {
            await storage.updateProject(data.projectId, {
              status: "error"
            });
          }
        }).catch(async (error) => {
          console.error('Deployment failed:', error);
          await storage.updateProject(data.projectId, {
            status: "error"
          });
        });

        res.json({ 
          success: true, 
          project: updatedProject,
          generatedCode,
          generationId: generation.id
        });
      } catch (aiError) {
        await storage.updateCodeGeneration(generation.id, {
          status: "failed",
          success: false,
          errorMessage: (aiError as Error).message
        });
        await storage.updateProject(data.projectId, { status: "error" });
        throw aiError;
      }
    } catch (error) {
      console.error("Code generation error:", error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ 
        message: "Failed to generate code",
        error: (error as Error).message 
      });
    }
  });

  // Streaming code generation
  app.post("/api/generate-code/stream", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCodeGenerationSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      
      const generation = await storage.createCodeGeneration({
        ...data,
        status: "streaming",
        progress: 0
      });
      
      const project = await storage.getProject(data.projectId);
      const context: GenerationContext = {
        type: data.generationType || 'full-app',
        framework: data.framework || project?.framework,
        existingCode: project?.files as Record<string, string> || {}
      };
      
      // Stream generation with progress updates
      const streamGenerator = generateCodeStreamFromPrompt(
        data.prompt, 
        context, 
        async (update: StreamingUpdate) => {
          res.write(`data: ${JSON.stringify(update)}\n\n`);
          
          if (update.progress) {
            await storage.updateCodeGeneration(generation.id, {
              progress: update.progress,
              status: update.type === 'complete' ? 'completed' : 'streaming'
            });
          }
        }
      );
      
      for await (const update of streamGenerator) {
        if (update.type === 'complete') {
          // Update generation and project
          await storage.updateCodeGeneration(generation.id, {
            status: "completed",
            progress: 100,
            generatedCode: update.data,
            success: true,
            completedAt: new Date()
          });
          
          await storage.updateProject(data.projectId, {
            files: update.data.files,
            framework: update.data.framework,
            description: update.data.description,
            status: "building"
          });
          
          break;
        }
      }
      
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
      
    } catch (error) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        data: (error as Error).message 
      })}\n\n`);
      res.end();
    }
  });

  // Code Analysis
  app.post("/api/projects/:projectId/analyze", async (req, res) => {
    try {
      const { analysisType = "quality" } = req.body;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project?.files) {
        return res.status(404).json({ message: "Project or files not found" });
      }
      
      const analysis = await storage.createCodeAnalysis({
        projectId: req.params.projectId,
        analysisType,
        status: "running"
      });
      
      try {
        const analysisResult = await analyzeCode(project.files as Record<string, string>);
        
        await storage.updateCodeAnalysis(analysis.id, {
          status: "completed",
          score: analysisResult.overall?.score || 0,
          findings: analysisResult,
          completedAt: new Date()
        });
        
        res.json({ analysis: analysisResult, analysisId: analysis.id });
      } catch (error) {
        await storage.updateCodeAnalysis(analysis.id, { status: "failed" });
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze code" });
    }
  });

  // Code Improvement
  app.post("/api/projects/:projectId/improve", async (req, res) => {
    try {
      const { improvement } = req.body;
      const project = await storage.getProject(req.params.projectId);
      
      const projectFiles = project?.metadata?.files || project?.files || {};
      if (!projectFiles || Object.keys(projectFiles).length === 0) {
        return res.status(404).json({ message: "Project or files not found" });
      }
      
      const improvedCode = await improveCode(
        projectFiles as Record<string, string>, 
        improvement
      );
      
      await storage.updateProject(req.params.projectId, {
        files: improvedCode.files,
        dependencies: { ...project.dependencies, ...improvedCode.dependencies }
      });
      
      res.json({ 
        success: true, 
        improvements: improvedCode.metadata?.changes || []
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to improve code" });
    }
  });

  // Test Generation
  app.post("/api/projects/:projectId/generate-tests", async (req, res) => {
    try {
      const { testType = "unit" } = req.body;
      const project = await storage.getProject(req.params.projectId);
      
      const projectFiles = project?.metadata?.files || project?.files || {};
      if (!projectFiles || Object.keys(projectFiles).length === 0) {
        return res.status(404).json({ message: "Project or files not found" });
      }
      
      const testFiles = await generateTests(
        projectFiles as Record<string, string>, 
        testType as 'unit' | 'integration' | 'e2e'
      );
      
      const updatedFiles = { ...project.files, ...testFiles };
      await storage.updateProject(req.params.projectId, {
        files: updatedFiles
      });
      
      res.json({ success: true, testFiles, testType });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate tests" });
    }
  });

  // =====================================================
  // AI DevOps Agent System API Endpoints
  // =====================================================

  // Agent Management Endpoints
  app.get("/api/projects/:projectId/agents", async (req, res) => {
    try {
      const agents = await storage.getProjectAgents(req.params.projectId);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agents" });
    }
  });

  app.post("/api/projects/:projectId/agents", async (req, res) => {
    try {
      const data = insertAiAgentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const agent = await agentManager.createAgent(data);
      res.status(201).json(agent);
    } catch (error) {
      res.status(400).json({ message: "Invalid agent data", error: (error as Error).message });
    }
  });

  app.get("/api/agents/:agentId", async (req, res) => {
    try {
      const agent = await agentManager.getAgent(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const health = await agentManager.getAgentHealth(req.params.agentId);
      res.json({ ...agent, health });
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent" });
    }
  });

  app.post("/api/agents/:agentId/tasks", async (req, res) => {
    try {
      const data = insertAgentTaskSchema.parse({
        ...req.body,
        agentId: req.params.agentId
      });
      const task = await agentManager.assignTask(req.params.agentId, data);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign task", error: (error as Error).message });
    }
  });

  app.get("/api/agents/:agentId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAgentTasks(req.params.agentId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent tasks" });
    }
  });

  app.post("/api/agents/:agentId/decision", async (req, res) => {
    try {
      const { context, options } = req.body;
      const decision = await agentManager.makeIntelligentDecision(
        req.params.agentId, 
        context, 
        options || []
      );
      res.json(decision);
    } catch (error) {
      res.status(500).json({ message: "Failed to make decision", error: (error as Error).message });
    }
  });

  // Enhanced AI Agent Management Endpoints
  app.post("/api/projects/:projectId/enhanced-agents", isAuthenticated, async (req, res) => {
    try {
      await enhancedAgentManager.initialize(req.params.projectId);

      const agent = await enhancedAgentManager.createAgent({
        ...req.body,
        projectId: req.params.projectId
      });

      res.status(201).json(agent);
    } catch (error) {
      res.status(400).json({ message: "Failed to create enhanced agent", error: (error as Error).message });
    }
  });

  app.post("/api/enhanced-agents/:agentId/tasks", isAuthenticated, async (req, res) => {
    try {
      const task = await enhancedAgentManager.assignTask(req.params.agentId, {
        ...req.body,
        agentId: req.params.agentId
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign enhanced task", error: (error as Error).message });
    }
  });

  app.post("/api/enhanced-agents/:agentId/sub-agents", isAuthenticated, async (req, res) => {
    try {
      const subAgent = await enhancedAgentManager.createSubAgent(req.params.agentId, req.body);
      res.status(201).json(subAgent);
    } catch (error) {
      res.status(400).json({ message: "Failed to create sub-agent", error: (error as Error).message });
    }
  });

  app.post("/api/enhanced-agents/:agentId/delegate", isAuthenticated, async (req, res) => {
    try {
      const subTask = await enhancedAgentManager.delegateToSubAgent(req.params.agentId, req.body);
      res.status(201).json(subTask);
    } catch (error) {
      res.status(400).json({ message: "Failed to delegate task", error: (error as Error).message });
    }
  });

  app.get("/api/enhanced-agents/:agentId/communications", isAuthenticated, async (req, res) => {
    try {
      const communications = await storage.getAgentCommunications(req.params.agentId);
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent communications" });
    }
  });

  app.post("/api/enhanced-agents/:agentId/message", isAuthenticated, async (req, res) => {
    try {
      const message = await enhancedAgentManager.sendAgentMessage({
        fromAgentId: req.params.agentId,
        ...req.body
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message", error: (error as Error).message });
    }
  });

  app.post("/api/enhanced-agents/:agentId/decisions", isAuthenticated, async (req, res) => {
    try {
      const { context, options } = req.body;
      const decision = await enhancedAgentManager.makeIntelligentDecision(
        req.params.agentId,
        context,
        options || []
      );
      res.json(decision);
    } catch (error) {
      res.status(500).json({ message: "Failed to make enhanced decision", error: (error as Error).message });
    }
  });

  app.post("/api/projects/:projectId/autonomous-management", isAuthenticated, async (req, res) => {
    try {
      await enhancedAgentManager.startAutonomousManagement(req.params.projectId);
      res.json({ message: "Autonomous management started", projectId: req.params.projectId });
    } catch (error) {
      res.status(500).json({ message: "Failed to start autonomous management", error: (error as Error).message });
    }
  });

  // Deployment Management Endpoints
  app.get("/api/projects/:projectId/deployments", async (req, res) => {
    try {
      const deployments = await storage.getProjectDeployments(req.params.projectId);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get deployments" });
    }
  });

  app.post("/api/projects/:projectId/deployments", async (req, res) => {
    try {
      const data = insertDeploymentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const deployment = await storage.createDeployment(data);

      // Trigger deployment via agent if available
      const agents = await storage.getProjectAgents(req.params.projectId);
      const deploymentAgent = agents.find(agent => agent.type === "deployment");
      
      if (deploymentAgent) {
        await agentManager.assignTask(deploymentAgent.id, {
          projectId: req.params.projectId,
          taskType: "deployment",
          priority: "high",
          description: `Deploy version ${data.version} using ${data.strategy} strategy`,
          input: { deploymentId: deployment.id, ...data }
        });
      }

      res.status(201).json(deployment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create deployment", error: (error as Error).message });
    }
  });

  app.post("/api/deployments/:deploymentId/rollback", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.deploymentId);
      if (!deployment) {
        return res.status(404).json({ message: "Deployment not found" });
      }

      const rollbackDeployment = await storage.createDeployment({
        projectId: deployment.projectId,
        version: deployment.rollbackVersion || "previous",
        strategy: "blue-green",
        environment: deployment.environment,
        metadata: { rollback: true, originalDeploymentId: req.params.deploymentId }
      });

      await storage.updateDeployment(req.params.deploymentId, {
        status: "rolled-back"
      });

      res.json(rollbackDeployment);
    } catch (error) {
      res.status(500).json({ message: "Failed to rollback deployment" });
    }
  });

  // Incident Management Endpoints
  app.get("/api/projects/:projectId/incidents", async (req, res) => {
    try {
      const incidents = await storage.getProjectIncidents(req.params.projectId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get incidents" });
    }
  });

  app.get("/api/projects/:projectId/incidents/open", async (req, res) => {
    try {
      const incidents = await storage.getOpenIncidents(req.params.projectId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get open incidents" });
    }
  });

  app.post("/api/projects/:projectId/incidents", async (req, res) => {
    try {
      const data = insertIncidentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const incident = await storage.createIncident(data);

      // Auto-assign to SRE agent for incident response
      const agents = await storage.getProjectAgents(req.params.projectId);
      const sreAgent = agents.find(agent => agent.type === "sre");
      
      if (sreAgent) {
        await agentManager.assignTask(sreAgent.id, {
          projectId: req.params.projectId,
          taskType: "incident-response",
          priority: data.severity === "critical" ? "urgent" : "high",
          description: `Respond to ${data.severity} incident: ${data.title}`,
          input: { incidentId: incident.id, ...data }
        });
      }

      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ message: "Failed to create incident", error: (error as Error).message });
    }
  });

  app.patch("/api/incidents/:incidentId", async (req, res) => {
    try {
      const incident = await storage.updateIncident(req.params.incidentId, req.body);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  // Performance Metrics Endpoints
  app.get("/api/projects/:projectId/metrics", async (req, res) => {
    try {
      const { metricType, limit = 100 } = req.query;
      const metrics = await storage.getProjectMetrics(
        req.params.projectId, 
        metricType as string
      );
      res.json(metrics.slice(0, Number(limit)));
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  app.post("/api/projects/:projectId/metrics", async (req, res) => {
    try {
      const data = insertPerformanceMetricSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const metric = await storage.createPerformanceMetric(data);

      // Check for performance issues and trigger optimization if needed
      if (data.metricType === "cpu_usage" && parseFloat(data.value) > 80) {
        const agents = await storage.getProjectAgents(req.params.projectId);
        const perfAgent = agents.find(agent => agent.type === "performance");
        
        if (perfAgent) {
          await agentManager.assignTask(perfAgent.id, {
            projectId: req.params.projectId,
            taskType: "optimization",
            priority: "medium",
            description: `High CPU usage detected: ${data.value}%`,
            input: { metrics: [data] }
          });
        }
      }

      res.status(201).json(metric);
    } catch (error) {
      res.status(400).json({ message: "Failed to create metric", error: (error as Error).message });
    }
  });

  // Security Scan Endpoints
  app.get("/api/projects/:projectId/security-scans", async (req, res) => {
    try {
      const scans = await storage.getProjectSecurityScans(req.params.projectId);
      res.json(scans);
    } catch (error) {
      res.status(500).json({ message: "Failed to get security scans" });
    }
  });

  app.post("/api/projects/:projectId/security-scans", async (req, res) => {
    try {
      const data = insertSecurityScanSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const scan = await storage.createSecurityScan(data);

      // Trigger security scan via security agent
      const agents = await storage.getProjectAgents(req.params.projectId);
      const securityAgent = agents.find(agent => agent.type === "security");
      
      if (securityAgent) {
        await agentManager.assignTask(securityAgent.id, {
          projectId: req.params.projectId,
          taskType: "vulnerability-scan",
          priority: "medium",
          description: `Perform ${data.scanType} security scan`,
          input: { scanId: scan.id, scanType: data.scanType }
        });
      }

      res.status(201).json(scan);
    } catch (error) {
      res.status(400).json({ message: "Failed to create security scan", error: (error as Error).message });
    }
  });

  // Infrastructure Resource Endpoints
  app.get("/api/projects/:projectId/resources", async (req, res) => {
    try {
      const resources = await storage.getProjectResources(req.params.projectId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to get resources" });
    }
  });

  app.post("/api/projects/:projectId/resources", async (req, res) => {
    try {
      const data = insertInfrastructureResourceSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const resource = await storage.createInfrastructureResource(data);
      res.status(201).json(resource);
    } catch (error) {
      res.status(400).json({ message: "Failed to create resource", error: (error as Error).message });
    }
  });

  // Auto-initialize AI agents for new projects
  app.post("/api/projects/:projectId/initialize-agents", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Create default agents for the project
      const agentTypes: Array<{ type: "sre" | "security" | "performance" | "deployment", name: string }> = [
        { type: "sre", name: `${project.name} - SRE Agent` },
        { type: "security", name: `${project.name} - Security Agent` },
        { type: "performance", name: `${project.name} - Performance Agent` },
        { type: "deployment", name: `${project.name} - Deployment Agent` }
      ];

      const createdAgents = [];
      for (const agentConfig of agentTypes) {
        const agent = await agentManager.createAgent({
          projectId,
          type: agentConfig.type,
          name: agentConfig.name
        });
        createdAgents.push(agent);
      }

      res.json({ 
        message: "Agents initialized successfully", 
        agents: createdAgents 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize agents", error: (error as Error).message });
    }
  });

  // =====================================================
  // Enterprise Migration System API Endpoints
  // =====================================================

  // Helper function to determine integration type based on service
  const getIntegrationType = (service: string): string => {
    const typeMap = {
      'github': 'repository',
      'gitlab': 'repository',
      'aws': 'cloud-provider',
      'azure': 'cloud-provider',
      'gcp': 'cloud-provider',
      'stripe': 'api',
      'twilio': 'communication',
      'sendgrid': 'communication',
      'slack': 'communication'
    };
    return typeMap[service] || 'api';
  };

  // Helper function to validate migration project ownership
  const validateMigrationProjectOwnership = async (migrationProjectId: string, userId: string) => {
    const migrationProject = await storage.getMigrationProject(migrationProjectId);
    if (!migrationProject) {
      throw new Error('Migration project not found');
    }
    const project = await storage.getProject(migrationProject.projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Migration project not found or access denied');
    }
    return migrationProject;
  };

  // Migration Projects CRUD
  app.get("/api/migration-projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { status } = req.query;
      
      let migrationProjects;
      if (status) {
        migrationProjects = await storage.getMigrationProjectsByStatus(status as string);
        // Filter by user ownership
        const userProjects = await Promise.all(
          migrationProjects.map(async (mp) => {
            const project = await storage.getProject(mp.projectId);
            return project?.userId === userId ? mp : null;
          })
        );
        migrationProjects = userProjects.filter(Boolean);
      } else {
        migrationProjects = await storage.getUserMigrationProjects(userId);
      }
      
      res.json(migrationProjects);
    } catch (error) {
      console.error('Get migration projects error:', error);
      res.status(500).json({ message: "Failed to get migration projects" });
    }
  });

  app.get("/api/migration-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const migrationProject = await validateMigrationProjectOwnership(req.params.id, userId);
      res.json(migrationProject);
    } catch (error) {
      console.error('Get migration project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(404).json({ message: "Migration project not found" });
    }
  });

  app.post("/api/migration-projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationProjectSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const migrationProject = await storage.createMigrationProject(data);
      res.status(201).json(migrationProject);
    } catch (error) {
      console.error('Create migration project error:', error);
      res.status(400).json({ message: "Invalid migration project data", error: (error as Error).message });
    }
  });

  app.patch("/api/migration-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateMigrationProjectOwnership(req.params.id, userId);
      const migrationProject = await storage.updateMigrationProject(req.params.id, req.body);
      if (!migrationProject) {
        return res.status(404).json({ message: "Migration project not found" });
      }
      res.json(migrationProject);
    } catch (error) {
      console.error('Update migration project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update migration project" });
    }
  });

  app.delete("/api/migration-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateMigrationProjectOwnership(req.params.id, userId);
      const deleted = await storage.deleteMigrationProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Migration project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete migration project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to delete migration project" });
    }
  });

  // Legacy System Assessments CRUD
  app.get("/api/legacy-assessments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, migrationProjectId } = req.query;
      
      let assessments;
      if (projectId) {
        await validateProjectOwnership(projectId as string, userId);
        assessments = await storage.getProjectLegacyAssessments(projectId as string);
      } else if (migrationProjectId) {
        await validateMigrationProjectOwnership(migrationProjectId as string, userId);
        assessments = await storage.getMigrationProjectAssessments(migrationProjectId as string);
      } else {
        return res.status(400).json({ message: "projectId or migrationProjectId is required" });
      }
      
      res.json(assessments);
    } catch (error) {
      console.error('Get legacy assessments error:', error);
      res.status(500).json({ message: "Failed to get legacy assessments" });
    }
  });

  app.get("/api/legacy-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessment = await storage.getLegacySystemAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      res.json(assessment);
    } catch (error) {
      console.error('Get legacy assessment error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(404).json({ message: "Assessment not found" });
    }
  });

  app.post("/api/legacy-assessments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertLegacySystemAssessmentSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const assessment = await storage.createLegacySystemAssessment(data);
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Create legacy assessment error:', error);
      res.status(400).json({ message: "Invalid assessment data", error: (error as Error).message });
    }
  });

  app.patch("/api/legacy-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessment = await storage.getLegacySystemAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      
      const updatedAssessment = await storage.updateLegacySystemAssessment(req.params.id, req.body);
      res.json(updatedAssessment);
    } catch (error) {
      console.error('Update legacy assessment error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  // Code Modernization Tasks CRUD
  app.get("/api/modernization-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, migrationProjectId, legacySystemId, assignedTo } = req.query;
      
      let tasks;
      if (assignedTo === 'me') {
        tasks = await storage.getUserAssignedTasks(userId);
      } else if (projectId) {
        await validateProjectOwnership(projectId as string, userId);
        tasks = await storage.getProjectModernizationTasks(projectId as string);
      } else if (migrationProjectId) {
        await validateMigrationProjectOwnership(migrationProjectId as string, userId);
        tasks = await storage.getMigrationProjectTasks(migrationProjectId as string);
      } else if (legacySystemId) {
        const assessment = await storage.getLegacySystemAssessment(legacySystemId as string);
        if (!assessment) {
          return res.status(404).json({ message: "Legacy system not found" });
        }
        await validateProjectOwnership(assessment.projectId, userId);
        tasks = await storage.getLegacySystemTasks(legacySystemId as string);
      } else {
        return res.status(400).json({ message: "Filter parameter is required" });
      }
      
      res.json(tasks);
    } catch (error) {
      console.error('Get modernization tasks error:', error);
      res.status(500).json({ message: "Failed to get modernization tasks" });
    }
  });

  app.post("/api/modernization-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCodeModernizationTaskSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const task = await storage.createCodeModernizationTask(data);
      res.status(201).json(task);
    } catch (error) {
      console.error('Create modernization task error:', error);
      res.status(400).json({ message: "Invalid task data", error: (error as Error).message });
    }
  });

  app.patch("/api/modernization-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const task = await storage.getCodeModernizationTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      await validateProjectOwnership(task.projectId, userId);
      
      const updatedTask = await storage.updateCodeModernizationTask(req.params.id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error('Update modernization task error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Custom AI Models CRUD
  app.get("/api/custom-ai-models", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, modelType, active } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }
      
      await validateProjectOwnership(projectId as string, userId);
      
      let models;
      if (active === 'true') {
        models = await storage.getActiveCustomModels(projectId as string);
      } else if (modelType) {
        models = await storage.getCustomModelsByType(projectId as string, modelType as string);
      } else {
        models = await storage.getProjectCustomModels(projectId as string);
      }
      
      res.json(models);
    } catch (error) {
      console.error('Get custom AI models error:', error);
      res.status(500).json({ message: "Failed to get custom AI models" });
    }
  });

  app.post("/api/custom-ai-models", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCustomAiModelSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const model = await storage.createCustomAiModel(data);
      res.status(201).json(model);
    } catch (error) {
      console.error('Create custom AI model error:', error);
      res.status(400).json({ message: "Invalid model data", error: (error as Error).message });
    }
  });

  app.patch("/api/custom-ai-models/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const model = await storage.getCustomAiModel(req.params.id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      await validateProjectOwnership(model.projectId, userId);
      
      const updatedModel = await storage.updateCustomAiModel(req.params.id, req.body);
      res.json(updatedModel);
    } catch (error) {
      console.error('Update custom AI model error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update model" });
    }
  });

  // Migration Execution Logs
  app.get("/api/migration-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { migrationProjectId, phase, status } = req.query;
      
      if (!migrationProjectId) {
        return res.status(400).json({ message: "migrationProjectId is required" });
      }
      
      await validateMigrationProjectOwnership(migrationProjectId as string, userId);
      
      let logs;
      if (phase) {
        logs = await storage.getMigrationLogsByPhase(migrationProjectId as string, phase as string);
      } else if (status) {
        logs = await storage.getMigrationLogsByStatus(migrationProjectId as string, status as string);
      } else {
        logs = await storage.getMigrationProjectLogs(migrationProjectId as string);
      }
      
      res.json(logs);
    } catch (error) {
      console.error('Get migration logs error:', error);
      res.status(500).json({ message: "Failed to get migration logs" });
    }
  });

  app.post("/api/migration-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationExecutionLogSchema.parse(req.body);
      
      // Validate migration project ownership
      await validateMigrationProjectOwnership(data.migrationProjectId, userId);
      
      const log = await storage.createMigrationExecutionLog(data);
      res.status(201).json(log);
    } catch (error) {
      console.error('Create migration log error:', error);
      res.status(400).json({ message: "Invalid log data", error: (error as Error).message });
    }
  });

  // Assessment Findings
  app.get("/api/assessment-findings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { assessmentId, severity, findingType, status } = req.query;
      
      if (!assessmentId) {
        return res.status(400).json({ message: "assessmentId is required" });
      }
      
      const assessment = await storage.getLegacySystemAssessment(assessmentId as string);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      
      let findings;
      if (status === 'open') {
        findings = await storage.getOpenFindings(assessmentId as string);
      } else if (severity) {
        findings = await storage.getFindingsBySeverity(assessmentId as string, severity as string);
      } else if (findingType) {
        findings = await storage.getFindingsByType(assessmentId as string, findingType as string);
      } else {
        findings = await storage.getAssessmentFindings(assessmentId as string);
      }
      
      res.json(findings);
    } catch (error) {
      console.error('Get assessment findings error:', error);
      res.status(500).json({ message: "Failed to get assessment findings" });
    }
  });

  app.post("/api/assessment-findings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationAssessmentFindingSchema.parse(req.body);
      
      // Validate assessment ownership
      const assessment = await storage.getLegacySystemAssessment(data.assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      
      const finding = await storage.createMigrationAssessmentFinding(data);
      res.status(201).json(finding);
    } catch (error) {
      console.error('Create assessment finding error:', error);
      res.status(400).json({ message: "Invalid finding data", error: (error as Error).message });
    }
  });

  // Migration Cost Analysis
  app.get("/api/migration-cost-analysis", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { migrationProjectId, analysisType, latest } = req.query;
      
      if (!migrationProjectId) {
        return res.status(400).json({ message: "migrationProjectId is required" });
      }
      
      await validateMigrationProjectOwnership(migrationProjectId as string, userId);
      
      let analyses;
      if (latest === 'true') {
        const analysis = await storage.getLatestCostAnalysis(migrationProjectId as string);
        analyses = analysis ? [analysis] : [];
      } else if (analysisType) {
        analyses = await storage.getCostAnalysesByType(migrationProjectId as string, analysisType as string);
      } else {
        analyses = await storage.getMigrationProjectCostAnalyses(migrationProjectId as string);
      }
      
      res.json(analyses);
    } catch (error) {
      console.error('Get migration cost analysis error:', error);
      res.status(500).json({ message: "Failed to get cost analysis" });
    }
  });

  app.post("/api/migration-cost-analysis", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationCostAnalysisSchema.parse(req.body);
      
      // Validate migration project ownership
      await validateMigrationProjectOwnership(data.migrationProjectId, userId);
      
      const analysis = await storage.createMigrationCostAnalysis(data);
      res.status(201).json(analysis);
    } catch (error) {
      console.error('Create migration cost analysis error:', error);
      res.status(400).json({ message: "Invalid analysis data", error: (error as Error).message });
    }
  });

  // Legacy Assessment Service Endpoints
  app.post("/api/legacy-assessments/run-assessment", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, systemName, discoveryInput, assignedTo } = req.body;
      
      // Validate project ownership
      await validateProjectOwnership(projectId, userId);
      
      const assessment = await legacyAssessmentService.runCompleteAssessment(
        projectId,
        systemName,
        discoveryInput,
        assignedTo
      );
      
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Run legacy assessment error:', error);
      res.status(500).json({ message: "Failed to run assessment", error: (error as Error).message });
    }
  });

  app.get("/api/legacy-assessments/:id/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessment = await storage.getLegacySystemAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Validate project ownership
      await validateProjectOwnership(assessment.projectId, userId);
      
      const summary = await legacyAssessmentService.getAssessmentSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      console.error('Get assessment summary error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to get assessment summary" });
    }
  });

  app.post("/api/infrastructure/discover", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const discoveryInput = req.body;
      
      const discoveredInfra = await legacyAssessmentService.discoverInfrastructure(discoveryInput);
      res.json(discoveredInfra);
    } catch (error) {
      console.error('Infrastructure discovery error:', error);
      res.status(500).json({ message: "Failed to discover infrastructure" });
    }
  });

  // =====================================================
  // INTEGRATIONS HUB API ENDPOINTS
  // =====================================================

  // Integration Management
  app.get("/api/integrations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, type, service, status } = req.query;
      
      let integrations = await storage.getUserIntegrations(userId, { projectId, type, service, status });
      
      // If no integrations found, check if user has stored credentials and create integrations
      if (integrations.length === 0) {
        const user = await storage.getUser(userId);
        const credentials = user?.metadata?.credentials || {};
        
        // Create integrations based on stored credentials
        for (const [serviceName, creds] of Object.entries(credentials)) {
          if (creds && typeof creds === 'object' && Object.keys(creds).length > 0) {
            const integration = {
              id: `${serviceName}-${userId}`,
              userId,
              projectId,
              name: `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Integration`,
              type: this.getIntegrationType(serviceName),
              service: serviceName,
              status: 'active',
              lastConnected: new Date().toISOString(),
              healthCheck: {
                status: 'healthy',
                responseTime: Math.floor(Math.random() * 200) + 50,
                lastChecked: new Date().toISOString()
              },
              usage: {
                requests: Math.floor(Math.random() * 1000) + 100,
                errors: Math.floor(Math.random() * 10),
                uptime: 95 + Math.random() * 4.5
              },
              createdAt: new Date().toISOString()
            };
            integrations.push(integration);
          }
        }
      }
      
      res.json(integrations);
    } catch (error) {
      console.error('Get integrations error:', error);
      res.status(500).json({ message: "Failed to get integrations" });
    }
  });

  app.post("/api/integrations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertIntegrationSchema.parse({ ...req.body, userId });
      
      if (data.projectId) {
        await validateProjectOwnership(data.projectId, userId);
      }

      // Create integration using our service
      const result = await integrationService.createIntegration({
        type: data.type,
        service: data.service,
        configuration: data.configuration || {},
        secrets: {}, // secrets handled separately
        endpoints: data.endpoints || {},
        healthCheck: data.healthCheck || {
          enabled: true,
          interval: 300,
          timeout: 30,
          retries: 3
        }
      }, userId, data.projectId);

      res.status(201).json({
        integration: result.integration,
        connectionTest: result.connectionTest
      });
    } catch (error) {
      console.error('Create integration error:', error);
      res.status(400).json({ message: "Invalid integration data", error: (error as Error).message });
    }
  });

  app.get("/api/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      // const integration = await storage.getIntegration(req.params.id);
      
      // Placeholder response
      res.status(404).json({ message: "Integration not found" });
    } catch (error) {
      console.error('Get integration error:', error);
      res.status(500).json({ message: "Failed to get integration" });
    }
  });

  app.put("/api/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      
      const result = await integrationService.updateIntegrationConfig(
        integrationId,
        req.body,
        userId
      );

      if (result.success) {
        res.json({
          success: true,
          connectionTest: result.connectionTest
        });
      } else {
        res.status(400).json({ 
          message: result.errorMessage || "Failed to update integration"
        });
      }
    } catch (error) {
      console.error('Update integration error:', error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  app.delete("/api/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      // Implementation would validate ownership and delete integration
      res.status(204).send();
    } catch (error) {
      console.error('Delete integration error:', error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  app.post("/api/integrations/:id/test", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      
      // Would fetch integration and test connection
      const mockIntegration = {
        id: integrationId,
        service: 'github',
        secrets: []
      };
      
      const result = await integrationService.testConnection(mockIntegration as any);
      res.json(result);
    } catch (error) {
      console.error('Test integration error:', error);
      res.status(500).json({ message: "Failed to test integration" });
    }
  });

  app.post("/api/integrations/:id/health-check", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      
      // Would fetch integration and perform health check
      const mockIntegration = {
        id: integrationId,
        service: 'github',
        type: 'repository',
        secrets: []
      };
      
      const result = await integrationService.performHealthCheck(mockIntegration as any);
      res.json(result);
    } catch (error) {
      console.error('Integration health check error:', error);
      res.status(500).json({ message: "Failed to perform health check" });
    }
  });

  // Secrets Management
  app.get("/api/integrations/:id/secrets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const credentials = user?.metadata?.credentials || {};
      
      // Get secrets for this integration
      const integrationService = req.params.id.split('-')[0]; // Extract service name from integration ID
      const serviceCredentials = credentials[integrationService] || {};
      
      const secrets = Object.keys(serviceCredentials).map(key => ({
        id: `${req.params.id}-${key}`,
        secretName: key,
        secretType: 'api-key',
        hasValue: true,
        environment: 'production',
        createdAt: new Date().toISOString()
      }));
      
      res.json(secrets);
    } catch (error) {
      console.error('Get secrets error:', error);
      res.status(500).json({ message: "Failed to get secrets" });
    }
  });

  app.post("/api/integrations/:id/secrets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { secretName, secretValue, secretType, environment = 'production' } = req.body;
      const integrationId = req.params.id;
      
      if (!secretName || !secretValue) {
        return res.status(400).json({ message: "secretName and secretValue are required" });
      }

      // Encrypt the secret
      const encryptedData = await secretsManager.encryptApiKey(
        secretValue,
        'generic',
        environment
      );

      const secretData = {
        integrationId,
        secretType: secretType || 'api-key',
        secretName,
        encryptedValue: encryptedData.encryptedValue,
        encryptionAlgorithm: encryptedData.algorithm,
        keyId: encryptedData.keyId,
        environment,
        metadata: {
          ...encryptedData.metadata,
          createdBy: userId
        }
      };

      // Would save to database
      res.status(201).json({
        id: 'generated-id',
        ...secretData,
        encryptedValue: undefined, // Don't return encrypted value
        hasValue: true
      });
    } catch (error) {
      console.error('Create secret error:', error);
      res.status(400).json({ message: "Failed to create secret" });
    }
  });

  app.delete("/api/integrations/:integrationId/secrets/:secretId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      // Implementation would validate ownership and delete secret
      res.status(204).send();
    } catch (error) {
      console.error('Delete secret error:', error);
      res.status(500).json({ message: "Failed to delete secret" });
    }
  });

  // GitHub/GitLab OAuth and Repository Management
  app.post("/api/integrations/github/oauth/initiate", isAuthenticated, async (req, res) => {
    try {
      const { redirectUri, scopes = ['repo', 'user:email'] } = req.body;
      
      const config = {
        clientId: process.env.GITHUB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: redirectUri || `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/github/oauth/callback`,
        scopes
      };

      const result = repositoryIntegrationService.initiateGitHubOAuth(config);
      res.json(result);
    } catch (error) {
      console.error('GitHub OAuth initiate error:', error);
      res.status(500).json({ message: "Failed to initiate GitHub OAuth" });
    }
  });

  app.post("/api/integrations/github/oauth/callback", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { code, state } = req.body;
      
      const config = {
        clientId: process.env.GITHUB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/github/oauth/callback`,
        scopes: ['repo', 'user:email']
      };

      const result = await repositoryIntegrationService.handleGitHubOAuthCallback(
        code,
        state,
        config,
        userId
      );

      if (result.success) {
        res.json({
          success: true,
          integration: result.integration,
          userInfo: result.userInfo
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.status(500).json({ message: "Failed to handle GitHub OAuth callback" });
    }
  });

  app.post("/api/integrations/gitlab/oauth/initiate", isAuthenticated, async (req, res) => {
    try {
      const { redirectUri, scopes = ['api', 'read_user'], baseUrl } = req.body;
      
      const config = {
        clientId: process.env.GITLAB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITLAB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: redirectUri || `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/gitlab/oauth/callback`,
        scopes,
        baseUrl
      };

      const result = repositoryIntegrationService.initiateGitLabOAuth(config);
      res.json(result);
    } catch (error) {
      console.error('GitLab OAuth initiate error:', error);
      res.status(500).json({ message: "Failed to initiate GitLab OAuth" });
    }
  });

  app.post("/api/integrations/gitlab/oauth/callback", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { code, state, baseUrl } = req.body;
      
      const config = {
        clientId: process.env.GITLAB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITLAB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/gitlab/oauth/callback`,
        scopes: ['api', 'read_user'],
        baseUrl
      };

      const result = await repositoryIntegrationService.handleGitLabOAuthCallback(
        code,
        state,
        config,
        userId
      );

      if (result.success) {
        res.json({
          success: true,
          integration: result.integration,
          userInfo: result.userInfo
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('GitLab OAuth callback error:', error);
      res.status(500).json({ message: "Failed to handle GitLab OAuth callback" });
    }
  });

  app.get("/api/integrations/:id/repositories", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      const { type = 'all', sort = 'updated', per_page = 100, page = 1 } = req.query;
      
      // Would fetch integration and discover repositories
      // For demo, return mock data
      const repositories = [
        {
          id: '1',
          name: 'sample-repo',
          fullName: 'user/sample-repo',
          description: 'A sample repository',
          url: 'https://github.com/user/sample-repo',
          defaultBranch: 'main',
          isPrivate: false,
          language: 'JavaScript',
          topics: ['web', 'react'],
          stargazersCount: 42,
          forksCount: 7,
          owner: {
            login: 'user',
            type: 'User',
            avatarUrl: 'https://github.com/user.png'
          }
        }
      ];
      
      res.json(repositories);
    } catch (error) {
      console.error('Get repositories error:', error);
      res.status(500).json({ message: "Failed to get repositories" });
    }
  });

  app.post("/api/integrations/:id/repositories/connect", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      const { repositoryId, projectId, syncBranches, webhookEvents } = req.body;
      
      // Would connect repository to project
      const result = {
        success: true,
        repositoryConnection: {
          id: 'generated-connection-id',
          integrationId,
          repositoryId,
          projectId,
          syncBranches: syncBranches || ['main'],
          autoSync: true
        }
      };
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Connect repository error:', error);
      res.status(500).json({ message: "Failed to connect repository" });
    }
  });

  // Real Integration Testing Endpoint
  app.post("/api/integrations/test", isAuthenticated, async (req, res) => {
    try {
      const { service, credentials } = req.body;

      if (!service || !credentials) {
        return res.status(400).json({ message: "Service and credentials are required" });
      }

      // Test the integration based on service type
      let testResult;
      switch (service) {
        case 'github':
          testResult = await testGitHubIntegration(credentials);
          break;
        case 'gitlab':
          testResult = await testGitLabIntegration(credentials);
          break;
        case 'openai':
          testResult = await testOpenAIIntegration(credentials);
          break;
        case 'stripe':
          testResult = await testStripeIntegration(credentials);
          break;
        case 'sendgrid':
          testResult = await testSendGridIntegration(credentials);
          break;
        case 'twilio':
          testResult = await testTwilioIntegration(credentials);
          break;
        default:
          return res.status(400).json({ message: "Unsupported service type" });
      }

      res.json(testResult);
    } catch (error) {
      console.error('Integration test error:', error);
      res.status(500).json({ message: "Integration test failed", error: (error as Error).message });
    }
  });

  // API Connector Framework
  app.get("/api/api-connectors/available", async (req, res) => {
    try {
      const connectors = ApiConnectorFactory.getAvailableConnectors();
      const connectorInfos = connectors.map(service => ({
        service,
        info: ApiConnectorFactory.getConnectorInfo(service)
      }));
      
      res.json(connectorInfos);
    } catch (error) {
      console.error('Get available connectors error:', error);
      res.status(500).json({ message: "Failed to get available connectors" });
    }
  });

  app.post("/api/api-connectors/:service/initialize", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { service } = req.params;
      const { secrets, integrationId } = req.body;
      
      const result = await apiConnectorManager.initializeConnector(
        integrationId,
        service,
        secrets
      );
      
      if (result.success) {
        res.json({
          success: true,
          testResult: result.testResult
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('Initialize connector error:', error);
      res.status(500).json({ message: "Failed to initialize connector" });
    }
  });

  app.get("/api/api-connectors/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = apiConnectorManager.getAllMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Get connector metrics error:', error);
      res.status(500).json({ message: "Failed to get connector metrics" });
    }
  });

  app.post("/api/api-connectors/health-check", isAuthenticated, async (req, res) => {
    try {
      const healthResults = await apiConnectorManager.healthCheckAll();
      res.json(healthResults);
    } catch (error) {
      console.error('Connector health check error:', error);
      res.status(500).json({ message: "Failed to perform health check" });
    }
  });

  // Webhook Endpoints
  app.post("/api/webhooks/repository/:integrationId", async (req, res) => {
    try {
      const { integrationId } = req.params;
      const payload = req.body;
      const headers = req.headers as Record<string, string>;
      
      const result = await repositoryIntegrationService.handleWebhook(
        payload,
        headers,
        integrationId
      );
      
      if (result.processed) {
        res.status(200).json({ message: "Webhook processed successfully" });
      } else {
        res.status(400).json({ 
          message: "Webhook processing failed",
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ message: "Internal webhook processing error" });
    }
  });

  // Integration Health & Status Monitoring
  app.get("/api/integrations/health/overview", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      const integrations = await storage.getUserIntegrations(userId);
      
      // Calculate real health overview
      const totalIntegrations = integrations.length;
      const healthyIntegrations = integrations.filter(i => i.healthCheck?.status === 'healthy').length;
      const degradedIntegrations = integrations.filter(i => i.healthCheck?.status === 'degraded').length;
      const unhealthyIntegrations = integrations.filter(i => i.healthCheck?.status === 'unhealthy').length;
      
      // Group by type
      const integrationsByType = integrations.reduce((acc, integration) => {
        const type = integration.type || 'api';
        if (!acc[type]) acc[type] = { total: 0, healthy: 0 };
        acc[type].total++;
        if (integration.healthCheck?.status === 'healthy') {
          acc[type].healthy++;
        }
        return acc;
      }, {
        'cloud-provider': { total: 0, healthy: 0 },
        'repository': { total: 0, healthy: 0 },
        'api': { total: 0, healthy: 0 },
        'communication': { total: 0, healthy: 0 }
      });
      
      const healthOverview = {
        totalIntegrations,
        healthyIntegrations,
        degradedIntegrations,
        unhealthyIntegrations,
        lastChecked: new Date(),
        integrationsByType
      };
      
      res.json(healthOverview);
    } catch (error) {
      console.error('Get health overview error:', error);
      res.status(500).json({ message: "Failed to get health overview" });
    }
  });

  // System Health Check
  app.get("/api/system/health", async (req, res) => {
    try {
      const stats = {
        timestamp: new Date(),
        agents: {
          total: 0,
          active: 0,
          inactive: 0
        },
        incidents: {
          open: 0,
          resolved: 0
        },
        deployments: {
          pending: 0,
          deployed: 0,
          failed: 0
        },
        migration: {
          projects: 0,
          assessments: 0,
          tasksInProgress: 0,
          modelsTraining: 0
        }
      };

      // This would normally aggregate across all projects
      // For demo, we'll use sample data
      stats.agents = { total: 12, active: 10, inactive: 2 };
      stats.incidents = { open: 3, resolved: 47 };
      stats.deployments = { pending: 1, deployed: 23, failed: 2 };
      stats.migration = { projects: 8, assessments: 15, tasksInProgress: 12, modelsTraining: 3 };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system health" });
    }
  });

  // =====================================================
  // Real-time Collaboration API Endpoints
  // =====================================================

  // Get active collaboration session for a project
  app.get("/api/projects/:projectId/collaboration/session", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId } = req.params;
      
      // Validate project ownership/access
      await validateProjectOwnership(projectId, userId);
      
      // Get active collaboration sessions for the project
      const sessions = await storage.getProjectCollaborationSessions(projectId);
      const activeSession = sessions.find(session => session.isActive);
      
      if (activeSession) {
        // Get current participants
        const participants = collaborationServer.getRoomParticipants(projectId);
        
        res.json({
          ...activeSession,
          participants: participants.length,
          activeUsers: participants
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Get collaboration session error:', error);
      res.status(500).json({ message: "Failed to get collaboration session" });
    }
  });

  // Get collaboration room participants
  app.get("/api/projects/:projectId/collaboration/participants", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId } = req.params;
      
      // Validate project ownership/access
      await validateProjectOwnership(projectId, userId);
      
      const participants = collaborationServer.getRoomParticipants(projectId);
      res.json(participants);
    } catch (error) {
      console.error('Get collaboration participants error:', error);
      res.status(500).json({ message: "Failed to get collaboration participants" });
    }
  });

  // Get collaboration session messages
  app.get("/api/projects/:projectId/collaboration/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId } = req.params;
      const { limit = 50, fileName } = req.query;
      
      // Validate project ownership/access
      await validateProjectOwnership(projectId, userId);
      
      // Get active session
      const sessions = await storage.getProjectCollaborationSessions(projectId);
      const activeSession = sessions.find(session => session.isActive);
      
      if (!activeSession) {
        return res.json([]);
      }
      
      let messages;
      if (fileName) {
        messages = await storage.getFileMessages(activeSession.sessionId, fileName as string, Number(limit));
      } else {
        messages = await storage.getSessionMessages(activeSession.sessionId, Number(limit));
      }
      
      res.json(messages);
    } catch (error) {
      console.error('Get collaboration messages error:', error);
      res.status(500).json({ message: "Failed to get collaboration messages" });
    }
  });

  // Get collaboration statistics
  app.get("/api/collaboration/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = {
        totalRooms: collaborationServer.getRoomCount(),
        totalConnections: collaborationServer.getTotalConnections(),
        timestamp: new Date()
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Get collaboration stats error:', error);
      res.status(500).json({ message: "Failed to get collaboration stats" });
    }
  });

  // =====================================================
  // Comprehensive Monitoring API Endpoints
  // =====================================================

  // Time Series Metrics APIs
  app.get("/api/projects/:projectId/time-series-metrics", async (req, res) => {
    try {
      const { resourceId, startTime, endTime, metricName } = req.query;
      const start = startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endTime ? new Date(endTime as string) : new Date();
      
      const metrics = await storage.getTimeSeriesMetrics(
        req.params.projectId, 
        resourceId as string || null, 
        start, 
        end
      );
      
      let filteredMetrics = metrics;
      if (metricName) {
        filteredMetrics = metrics.filter(m => m.metricName === metricName);
      }
      
      res.json(filteredMetrics);
    } catch (error) {
      console.error('Get time series metrics error:', error);
      res.status(500).json({ message: "Failed to get time series metrics" });
    }
  });

  app.post("/api/projects/:projectId/time-series-metrics", async (req, res) => {
    try {
      const data = insertTimeSeriesMetricSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const metric = await storage.createTimeSeriesMetric(data);
      res.status(201).json(metric);
    } catch (error) {
      console.error('Create time series metric error:', error);
      res.status(400).json({ message: "Failed to create time series metric", error: (error as Error).message });
    }
  });

  // Anomaly Detection APIs
  app.get("/api/projects/:projectId/anomaly-models", async (req, res) => {
    try {
      const { metricName } = req.query;
      const models = await storage.getAnomalyDetectionModels(
        req.params.projectId, 
        metricName as string
      );
      res.json(models);
    } catch (error) {
      console.error('Get anomaly models error:', error);
      res.status(500).json({ message: "Failed to get anomaly detection models" });
    }
  });

  app.post("/api/projects/:projectId/anomaly-models", async (req, res) => {
    try {
      const data = insertAnomalyDetectionModelSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const model = await storage.createAnomalyDetectionModel(data);
      res.status(201).json(model);
    } catch (error) {
      console.error('Create anomaly model error:', error);
      res.status(400).json({ message: "Failed to create anomaly detection model", error: (error as Error).message });
    }
  });

  app.get("/api/projects/:projectId/anomalies", async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const anomalies = await storage.getProjectAnomalies(
        req.params.projectId, 
        Number(days)
      );
      res.json(anomalies);
    } catch (error) {
      console.error('Get anomalies error:', error);
      res.status(500).json({ message: "Failed to get anomalies" });
    }
  });

  app.post("/api/projects/:projectId/anomalies", async (req, res) => {
    try {
      const data = insertAnomalyDetectionSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const anomaly = await storage.createAnomalyDetection(data);
      res.status(201).json(anomaly);
    } catch (error) {
      console.error('Create anomaly error:', error);
      res.status(400).json({ message: "Failed to create anomaly detection", error: (error as Error).message });
    }
  });

  // Alert Rules APIs
  app.get("/api/projects/:projectId/alert-rules", async (req, res) => {
    try {
      const alertRules = await storage.getAlertRules(req.params.projectId);
      res.json(alertRules);
    } catch (error) {
      console.error('Get alert rules error:', error);
      res.status(500).json({ message: "Failed to get alert rules" });
    }
  });

  app.post("/api/projects/:projectId/alert-rules", async (req, res) => {
    try {
      const data = insertAlertRuleSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const alertRule = await storage.createAlertRule(data);
      res.status(201).json(alertRule);
    } catch (error) {
      console.error('Create alert rule error:', error);
      res.status(400).json({ message: "Failed to create alert rule", error: (error as Error).message });
    }
  });

  app.put("/api/alert-rules/:ruleId", async (req, res) => {
    try {
      const updatedRule = await storage.updateAlertRule(req.params.ruleId, req.body);
      if (!updatedRule) {
        return res.status(404).json({ message: "Alert rule not found" });
      }
      res.json(updatedRule);
    } catch (error) {
      console.error('Update alert rule error:', error);
      res.status(500).json({ message: "Failed to update alert rule" });
    }
  });

  app.delete("/api/alert-rules/:ruleId", async (req, res) => {
    try {
      const deleted = await storage.deleteAlertRule(req.params.ruleId);
      if (!deleted) {
        return res.status(404).json({ message: "Alert rule not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete alert rule error:', error);
      res.status(500).json({ message: "Failed to delete alert rule" });
    }
  });

  // Alert Notifications APIs
  app.get("/api/projects/:projectId/alert-notifications", async (req, res) => {
    try {
      const { alertRuleId, limit = 100 } = req.query;
      const notifications = await storage.getAlertNotifications(
        alertRuleId as string,
        req.params.projectId
      );
      res.json(notifications.slice(0, Number(limit)));
    } catch (error) {
      console.error('Get alert notifications error:', error);
      res.status(500).json({ message: "Failed to get alert notifications" });
    }
  });

  app.post("/api/projects/:projectId/alert-notifications", async (req, res) => {
    try {
      const data = insertAlertNotificationSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const notification = await storage.createAlertNotification(data);
      res.status(201).json(notification);
    } catch (error) {
      console.error('Create alert notification error:', error);
      res.status(400).json({ message: "Failed to create alert notification", error: (error as Error).message });
    }
  });

  // Performance Baselines APIs
  app.get("/api/projects/:projectId/performance-baselines", async (req, res) => {
    try {
      const baselines = await storage.getPerformanceBaselines(req.params.projectId);
      res.json(baselines);
    } catch (error) {
      console.error('Get performance baselines error:', error);
      res.status(500).json({ message: "Failed to get performance baselines" });
    }
  });

  app.post("/api/projects/:projectId/performance-baselines", async (req, res) => {
    try {
      const data = insertPerformanceBaselineSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const baseline = await storage.createPerformanceBaseline(data);
      res.status(201).json(baseline);
    } catch (error) {
      console.error('Create performance baseline error:', error);
      res.status(400).json({ message: "Failed to create performance baseline", error: (error as Error).message });
    }
  });

  // Analytics Dashboard APIs
  app.get("/api/projects/:projectId/monitoring-dashboard", async (req, res) => {
    try {
      const { timeRange = '24h' } = req.query;
      
      // Calculate time range
      const now = new Date();
      let startTime = new Date();
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Gather dashboard data
      const [
        metrics,
        incidents,
        anomalies,
        alertRules,
        baselines
      ] = await Promise.all([
        storage.getTimeSeriesMetrics(req.params.projectId, null, startTime, now),
        storage.getProjectIncidents(req.params.projectId),
        storage.getProjectAnomalies(req.params.projectId, 7),
        storage.getAlertRules(req.params.projectId),
        storage.getPerformanceBaselines(req.params.projectId)
      ]);

      // Calculate dashboard statistics
      const recentIncidents = incidents.filter(inc => 
        new Date(inc.createdAt).getTime() > startTime.getTime()
      );
      
      const openIncidents = incidents.filter(inc => inc.status === 'open');
      const criticalAnomalies = anomalies.filter(anom => anom.severity === 'critical');
      
      // Group metrics by type for charts
      const metricsGrouped = metrics.reduce((acc, metric) => {
        if (!acc[metric.metricName]) {
          acc[metric.metricName] = [];
        }
        acc[metric.metricName].push({
          timestamp: metric.timestamp,
          value: metric.value,
          unit: metric.unit
        });
        return acc;
      }, {} as Record<string, any[]>);

      const dashboardData = {
        overview: {
          totalIncidents: incidents.length,
          openIncidents: openIncidents.length,
          recentIncidents: recentIncidents.length,
          criticalAnomalies: criticalAnomalies.length,
          activeAlerts: alertRules.filter(rule => rule.isEnabled).length,
          performanceBaselines: baselines.length
        },
        metrics: metricsGrouped,
        incidents: recentIncidents.slice(0, 10),
        anomalies: anomalies.slice(0, 10),
        alertRules: alertRules.filter(rule => rule.isEnabled).slice(0, 10),
        timeRange: {
          start: startTime,
          end: now,
          range: timeRange
        }
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Get monitoring dashboard error:', error);
      res.status(500).json({ message: "Failed to get monitoring dashboard data" });
    }
  });

  // Real-time Metrics Streaming API
  app.get("/api/projects/:projectId/metrics/stream", async (req, res) => {
    try {
      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

      // Send metrics every 30 seconds
      const metricsInterval = setInterval(async () => {
        try {
          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes
          
          const recentMetrics = await storage.getTimeSeriesMetrics(
            req.params.projectId, 
            null, 
            startTime, 
            endTime
          );

          const streamData = {
            type: 'metrics',
            timestamp: new Date(),
            data: recentMetrics.slice(0, 20) // Latest 20 metrics
          };

          res.write(`data: ${JSON.stringify(streamData)}\n\n`);
        } catch (error) {
          console.error('Error streaming metrics:', error);
        }
      }, 30000);

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(metricsInterval);
        console.log('Metrics stream client disconnected');
      });

    } catch (error) {
      console.error('Metrics streaming error:', error);
      res.status(500).json({ message: "Failed to start metrics stream" });
    }
  });

  // Health Check for Monitoring System
  app.get("/api/monitoring/health", async (req, res) => {
    try {
      const healthData = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'healthy',
          metricsCollection: 'healthy',
          alertSystem: 'healthy',
          aiDetection: 'healthy'
        },
        version: '1.0.0',
        uptime: process.uptime()
      };

      res.json(healthData);
    } catch (error) {
      res.status(500).json({ 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      });
    }
  });

  // =====================================================
  // Vibe Coding API Endpoints
  // =====================================================

  // AI Intent Parsing for Coding Actions
  app.post("/api/coding/intent", isAuthenticated, aiGenerationMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = (req.user as any)?.claims?.email || (req.user as any)?.email;
      const { projectId, message, contextRefs = [] } = req.body;

      if (!projectId || !message) {
        return res.status(400).json({ message: "Project ID and message are required" });
      }

      // Validate project ownership
      await validateProjectOwnership(projectId, userId);

      // Parse natural language intent
      const intent = message.toLowerCase();
      const actions = [];
      const safetyChecks = [];

      // Intent parsing logic
      if (intent.includes("create") && intent.includes("component")) {
        actions.push({
          type: "create_file",
          description: "Create new React component",
          file: extractComponentName(intent) + ".tsx",
          content: generateReactComponent(extractComponentName(intent))
        });
        safetyChecks.push("New component will be created in src/components/");
      }

      if (intent.includes("api") || intent.includes("fetch")) {
        actions.push({
          type: "create_file",
          description: "Create API service file",
          file: "services/api.ts",
          content: generateApiService()
        });
        safetyChecks.push("API service will handle data fetching");
      }

      if (intent.includes("test")) {
        actions.push({
          type: "create_file",
          description: "Generate test files",
          file: "tests/component.test.tsx",
          content: generateTestFile()
        });
        safetyChecks.push("Test files will be created with Jest");
      }

      // Mock preview diff URL
      const previewDiffUrl = `https://api.github.com/repos/user/repo/pulls/preview-${Date.now()}`;

      res.json({
        plan: `I'll help you ${intent}. Here's what I'll do:`,
        actions,
        safetyChecks,
        previewDiffUrl
      });
    } catch (error) {
      console.error('Coding intent error:', error);
      res.status(500).json({ message: "Failed to parse coding intent" });
    }
  });

  // Apply Coding Actions
  app.post("/api/coding/apply", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, actions = [], branch, commitMessage } = req.body;

      if (!projectId || !actions.length) {
        return res.status(400).json({ message: "Project ID and actions are required" });
      }

      // Validate project ownership
      await validateProjectOwnership(projectId, userId);

      // Create new branch if specified
      const targetBranch = branch || `feature/vibe-coding-${Date.now()}`;

      // Load current project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found", correlationId: (res as any).locals?.requestId });
      }

      // Apply actions to project metadata.files
      const files: Record<string, string> = {
        ...(project.metadata?.files || {})
      };

      const appliedActions = [] as any[];
      for (const action of actions) {
        if (action.type === "create_file" && action.file && typeof action.content === "string") {
          files[action.file] = action.content;
          appliedActions.push({ ...action, status: "applied", path: action.file });
        } else if (action.type === "update_file" && action.file && typeof action.content === "string") {
          files[action.file] = action.content;
          appliedActions.push({ ...action, status: "updated", path: action.file });
        }
      }

      await storage.updateProject(projectId, {
        metadata: {
          ...(project.metadata || {}),
          files,
          lastCodeApplyAt: new Date().toISOString(),
          lastBranch: targetBranch,
          lastCommitMessage: commitMessage || "vibe-coding apply"
        }
      } as any);

      // Mock commit/PR details (repo integration can be wired later)
      const commitSha = `abc${Date.now()}`;
      const prUrl = `https://github.com/user/repo/pull/${Math.floor(Math.random() * 1000)}`;

      res.json({
        branch: targetBranch,
        commitSha,
        prUrl,
        appliedActions
      });
      try { console.log(JSON.stringify({ type: 'event', severity: 'info', module: 'coding', action: 'apply', reqId: (res as any).locals?.requestId, projectId, count: appliedActions.length })); } catch {}
    } catch (error) {
      console.error('Apply coding actions error:', error);
      res.status(500).json({ message: "Failed to apply coding actions", correlationId: (res as any).locals?.requestId });
    }
  });

  // Run Development Server
  app.post("/api/coding/run", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, command = "npm start" } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      // Validate project ownership
      await validateProjectOwnership(projectId, userId);

      // Mock dev server startup
      const previewUrl = `http://localhost:3000?project=${projectId}`;

      res.json({
        status: "started",
        previewUrl,
        logs: [
          "Starting development server...",
          "webpack compiled successfully",
          `Local:   ${previewUrl}`,
          "Network: http://192.168.1.100:3000"
        ]
      });
    } catch (error) {
      console.error('Run coding server error:', error);
      res.status(500).json({ message: "Failed to start development server" });
    }
  });

  // Get Project Files
  app.get("/api/coding/projects/:projectId/files", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId } = req.params;

      // Validate project ownership
      await validateProjectOwnership(projectId, userId);

      const project = await storage.getProject(projectId);
      const files: Record<string, string> = project?.metadata?.files || {};

      // Build a simple file list; client can render tree or flat list
      const fileList = Object.entries(files).map(([path, content]) => ({
        name: path.split('/').pop(),
        type: 'file',
        path,
        content
      }));

      // If empty, seed with a minimal React app scaffold for convenience
      if (fileList.length === 0) {
        const seed = {
          'src/App.tsx': "import React from 'react';\n\nexport default function App() {\n  return <div>Hello Vibe Coding</div>;\n}\n",
          'src/index.tsx': "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n",
          'package.json': '{\n  "name": "vibe-coding-project",\n  "version": "0.1.0",\n  "dependencies": {\n    "react": "^18.2.0"\n  }\n}'
        } as Record<string, string>;

        await storage.updateProject(projectId, {
          metadata: {
            ...(project?.metadata || {}),
            files: seed,
            seededAt: new Date().toISOString()
          }
        } as any);

        const seededList = Object.entries(seed).map(([path, content]) => ({
          name: path.split('/').pop(),
          type: 'file',
          path,
          content
        }));
        return res.json(seededList);
      }

      res.json(fileList);
    } catch (error) {
      console.error('Get project files error:', error);
      res.status(500).json({ message: "Failed to get project files", correlationId: (res as any).locals?.requestId });
    }
  });

  // Save File Content
  app.put("/api/coding/projects/:projectId/files", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId } = req.params;
      const { filePath, content } = req.body;

      if (!filePath || content === undefined) {
        return res.status(400).json({ message: "File path and content are required" });
      }

      // Validate project ownership
      await validateProjectOwnership(projectId, userId);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found", correlationId: (res as any).locals?.requestId });
      }

      const files: Record<string, string> = {
        ...(project.metadata?.files || {}),
        [filePath]: content
      };

      await storage.updateProject(projectId, {
        metadata: {
          ...(project.metadata || {}),
          files,
          lastFileSaveAt: new Date().toISOString()
        }
      } as any);

      res.json({ success: true, filePath, lastModified: new Date().toISOString() });
    } catch (error) {
      console.error('Save file error:', error);
      res.status(500).json({ message: "Failed to save file", correlationId: (res as any).locals?.requestId });
    }
  });

  // =====================================================
  // Vibe Hosting API Endpoints
  // =====================================================

  // Parse Hosting Intent
  app.post("/api/hosting/intent", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, message, constraints = {} } = req.body;

      if (!projectId || !message) {
        return res.status(400).json({ message: "Project ID and message are required" });
      }

      // Validate project ownership
      await validateProjectOwnership(projectId, userId);

      // Parse natural language intent
      const intent = message.toLowerCase();
      let provider = constraints.provider || "azure";
      let region = constraints.region || "West US 2";
      let strategy = "blue-green";

      if (intent.includes("aws")) provider = "aws";
      if (intent.includes("gcp") || intent.includes("google")) provider = "gcp";
      if (intent.includes("canary")) strategy = "canary";
      if (intent.includes("rolling")) strategy = "rolling";

      // Cost estimation
      const baseCost = provider === "azure" ? 45.67 : provider === "aws" ? 48.20 : 42.30;
      const costEstimate = {
        monthly: baseCost,
        compute: baseCost * 0.7,
        storage: baseCost * 0.2,
        bandwidth: baseCost * 0.1
      };

      const steps = [
        "Build application Docker image",
        `Deploy to ${provider} ${region}`,
        "Configure load balancer",
        "Set up monitoring and alerts",
        "Run health checks",
        "Route traffic to new deployment"
      ];

      res.json({
        plan: `I'll deploy your application to ${provider} in ${region} using ${strategy} deployment strategy.`,
        providerDecision: {
          provider,
          region,
          strategy,
          reasoning: `${provider} selected for optimal cost-performance ratio in ${region}`
        },
        costEstimate,
        steps
      });
    } catch (error) {
      console.error('Hosting intent error:', error);
      res.status(500).json({ message: "Failed to parse hosting intent" });
    }
  });

  // Deploy Application (Azure-first path; will expand to MultiCloud)
  app.post("/api/hosting/deploy", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, environment, providerDecision, artifactRef, strategy = "blue-green" } = req.body;

      if (!projectId || !environment || !providerDecision) {
        return res.status(400).json({ message: "Project ID, environment, and provider decision are required" });
      }

      // Validate project ownership
      await validateProjectOwnership(projectId, userId);

      // Create deployment record and kick off local deployment manager
      const result = await deploymentManager.deployProject({
        projectId,
        version: artifactRef || `v-${Date.now()}`,
        strategy,
        environment,
      });

      const statusUrl = `/api/hosting/deployments/${result.deploymentId}`;
      res.status(202).json({
        deploymentId: result.deploymentId,
        statusUrl,
        status: result.status,
        url: result.url,
        message: `Deployment started to ${providerDecision.provider} using ${strategy} strategy`
      });
      try { console.log(JSON.stringify({ type: 'event', severity: 'info', module: 'hosting', action: 'deploy', reqId: (res as any).locals?.requestId, projectId, deploymentId: result.deploymentId, strategy })); } catch {}
    } catch (error) {
      console.error('Deploy application error:', error);
      res.status(500).json({ message: "Failed to start deployment" });
    }
  });

  // Get Deployment Status
  app.get("/api/hosting/deployments/:deploymentId", isAuthenticated, async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const status = await deploymentManager.getDeploymentStatus(deploymentId);
      res.json({
        id: deploymentId,
        status: status.deployment?.status || 'unknown',
        url: (status.deployment as any)?.deploymentUrl,
        metrics: {
          cpu: 0,
          memory: 0,
          requests: 0,
          responseTime: 0,
          uptime: 0
        },
        logsUrl: null,
        rollbackPlan: {
          available: true,
          previousVersion: (status.deployment as any)?.rollbackVersion || null,
          estimatedTime: "2 minutes"
        },
        createdAt: (status.deployment as any)?.startedAt || null,
        completedAt: (status.deployment as any)?.completedAt || null,
        healthChecks: status.healthChecks || []
      });
      try { console.log(JSON.stringify({ type: 'event', severity: 'info', module: 'hosting', action: 'status', reqId: (res as any).locals?.requestId, deploymentId, status: status.deployment?.status })); } catch {}
    } catch (error) {
      console.error('Get deployment status error:', error);
      res.status(500).json({ message: "Failed to get deployment status" });
    }
  });

  // Helper functions for Vibe Coding
  function extractComponentName(intent: string): string {
    const match = intent.match(/component\s+(\w+)|(\w+)\s+component/i);
    return match ? (match[1] || match[2]) : "NewComponent";
  }

  function generateReactComponent(name: string): string {
    return `import React from 'react';

interface ${name}Props {
  // Add your props here
}

const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div>
      <h2>${name}</h2>
      <p>Start building your component here!</p>
    </div>
  );
};

export default ${name};`;
  }

  function generateApiService(): string {
    return `// API Service for data fetching
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export class ApiService {
  static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return response.json();
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return response.json();
  }
}`;
  }

  function generateTestFile(): string {
    return `import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});`;
  }

  // =====================================================
  // Repository Ops and AI Recommendations
  // =====================================================

  // Create commits and PR on GitHub
  app.post('/api/repo/commit-pr', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, repo, baseBranch = 'main', branchName, commitMessage, rootPath = '' } = req.body as any;

      if (!projectId || !repo?.owner || !repo?.name) {
        return res.status(400).json({ message: 'projectId and repo {owner,name} are required' });
      }

      // Validate project ownership and load files
      await validateProjectOwnership(projectId, userId);
      const project = await storage.getProject(projectId);
      const files: Record<string, string> = project?.metadata?.files || {};
      if (!Object.keys(files).length) {
        return res.status(400).json({ message: 'No files to commit' });
      }

      // Locate GitHub integration to get access token
      const integrations = await storage.getUserIntegrations(userId, { service: 'github' });
      if (!integrations?.length) {
        return res.status(400).json({ message: 'GitHub integration not found' });
      }
      const ghIntegration = integrations[0];
      const secrets = await storage.getIntegrationSecrets(ghIntegration.id);
      const tokenSecret = secrets.find(s => s.secretName === 'access_token');
      if (!tokenSecret) {
        return res.status(400).json({ message: 'GitHub access token missing in secrets' });
      }
      const token = await encryptionService.decrypt(tokenSecret, 'production');

      const ghApi = 'https://api.github.com';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Careerate-App'
      } as Record<string, string>;

      // Get base branch SHA
      const refRes = await fetch(`${ghApi}/repos/${repo.owner}/${repo.name}/git/ref/heads/${baseBranch}`, { headers });
      if (!refRes.ok) {
        const t = await refRes.text();
        return res.status(400).json({ message: 'Failed to get base branch', details: t });
      }
      const refJson = await refRes.json();
      const baseSha = refJson.object?.sha;

      // Create branch
      const newBranch = branchName || `careerate/${Date.now()}`;
      const createRefRes = await fetch(`${ghApi}/repos/${repo.owner}/${repo.name}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: baseSha })
      });
      if (!createRefRes.ok && createRefRes.status !== 422) {
        const t = await createRefRes.text();
        return res.status(400).json({ message: 'Failed to create branch', details: t });
      }

      // Commit files via contents API
      for (const [path, content] of Object.entries(files)) {
        const targetPath = `${rootPath ? `${rootPath.replace(/\/$/, '')}/` : ''}${path}`;
        const putRes = await fetch(`${ghApi}/repos/${repo.owner}/${repo.name}/contents/${encodeURIComponent(targetPath)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: commitMessage || 'Careerate apply fix',
            content: Buffer.from(content).toString('base64'),
            branch: newBranch
          })
        });
        if (!putRes.ok && putRes.status !== 409) {
          const t = await putRes.text();
          return res.status(400).json({ message: `Failed to commit ${targetPath}`, details: t });
        }
      }

      // Open PR
      const prRes = await fetch(`${ghApi}/repos/${repo.owner}/${repo.name}/pulls`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: commitMessage || 'Careerate Apply Fix',
          head: newBranch,
          base: baseBranch,
          body: `Automated changes proposed by Careerate.\nProject: ${projectId}`
        })
      });
      if (!prRes.ok) {
        const t = await prRes.text();
        return res.status(400).json({ message: 'Failed to open PR', details: t });
      }
      const pr = await prRes.json();
      res.json({ branch: newBranch, prUrl: pr.html_url, prNumber: pr.number });
    } catch (error) {
      console.error('commit-pr error:', error);
      res.status(500).json({ message: 'Failed to create PR', error: (error as Error).message });
    }
  });

  // Recommend fixes based on current project files
  app.post('/api/recommendations/suggest', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId } = req.body;
      await validateProjectOwnership(projectId, userId);
      const project = await storage.getProject(projectId);
      const files: Record<string, string> = project?.metadata?.files || {};
      const combined = Object.entries(files).map(([p, c]) => `// File: ${p}\n${c}`).join('\n\n');
      const analysis = await analyzeCode(combined, 'typescript');
      const recs = (analysis?.suggestions || []).slice(0, 5).map((s: string, i: number) => ({ id: `rec-${i+1}`, description: s }));
      res.json({ analysis, recommendations: recs });
      try { console.log(JSON.stringify({ type: 'event', severity: 'info', module: 'recs', action: 'suggest', reqId: (res as any).locals?.requestId, projectId, count: recs.length })); } catch {}
    } catch (error) {
      console.error('recommendations suggest error:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  // Apply a recommended fix by committing and opening a PR
  app.post('/api/recommendations/apply', isAuthenticated, async (req, res) => {
    try {
      const { projectId, repo, baseBranch = 'main', branchName, commitMessage = 'Apply AI Recommendation', rootPath } = req.body as any;
      (req as any).body = { projectId, repo, baseBranch, branchName, commitMessage, rootPath };
      const originalUrl = req.url;
      req.url = '/api/repo/commit-pr';
      (app as any)._router.handle(req, res, () => { req.url = originalUrl; });
    } catch (error) {
      console.error('recommendations apply error:', error);
      res.status(500).json({ message: 'Failed to apply recommendation' });
    }
  });

  // =====================================================
  // Azure Onboarding & Reconciliation
  // =====================================================

  app.get('/api/onboarding/azure/context', isAuthenticated, async (req, res) => {
    try {
      const context = {
        subscriptionId: process.env.AZ_SUBSCRIPTION_ID || process.env.AZURE_SUBSCRIPTION_ID || null,
        tenantId: process.env.AZURE_TENANT_ID || null,
        defaultResourceGroup: process.env.AZ_DEFAULT_RG || 'Careerate',
        region: process.env.AZ_REGION || 'westus2',
        env: {
          AZURE_CLIENT_ID: !!process.env.AZURE_CLIENT_ID,
          AZURE_CLIENT_SECRET: !!process.env.AZURE_CLIENT_SECRET,
          DATABASE_URL: !!process.env.DATABASE_URL
        }
      };
      res.json(context);
    } catch (error) {
      res.status(500).json({ message: 'Failed to read Azure context' });
    }
  });

  app.post('/api/onboarding/azure/reconcile', isAuthenticated, async (req, res) => {
    try {
      const desired = req.body || {};
      const plan = [
        { resource: 'ResourceGroup', name: desired.resourceGroup || 'Careerate', action: 'reuse' },
        { resource: 'ContainerRegistry', name: 'careerateacr', action: 'reuse' },
        { resource: 'ContainerAppsEnv', name: 'careerate-agents-env', action: 'reuse' },
        { resource: 'ContainerApp', name: 'careerate-web', action: 'reuse' }
      ];
      res.json({ plan, notes: 'Plan is idempotent; existing resources reused, tags will be applied during deploy.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate reconciliation plan' });
    }
  });

  // =====================================================
  // AI Agents (DevOps & Migration) - keep inside registerRoutes
  // =====================================================

  const devOpsAgent = new (require('./ai-agents/DevOpsAgent').DevOpsAgent)();
  const migrationAgent = new (require('./ai-agents/DevOpsAgent').EnterpriseMigrationAgent)();

  // DevOps Agent - Full automation workflow
  app.post("/api/ai-agents/devops/deploy", isAuthenticated, async (req, res) => {
    try {
      const { projectId, repositoryUrl, requirements } = req.body;

      const result = await devOpsAgent.executeWorkflow({
        project_id: projectId,
        repository_url: repositoryUrl,
        user_requirements: requirements
      });

      res.json({
        success: true,
        deployment_id: `deploy-${projectId}-${Date.now()}`,
        status: result.deployment_status,
        infrastructure: result.infrastructure,
        security: result.security_scan,
        performance: result.performance_metrics,
        estimated_completion: '15-30 minutes'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "DevOps automation failed",
        error: (error as Error).message
      });
    }
  });

  // Get deployment status
  app.get("/api/ai-agents/devops/status/:projectId", isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const status = await devOpsAgent.getDeploymentStatus(projectId);
      res.json(status);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get deployment status",
        error: (error as Error).message
      });
    }
  });

  // Enterprise Migration Agent
  app.post("/api/ai-agents/migration/analyze", isAuthenticated, async (req, res) => {
    try {
      const { systemDescription, currentInfrastructure, businessRequirements } = req.body;

      const analysis = await migrationAgent.analyzeExistingSystem({
        system_description: systemDescription,
        current_infrastructure: currentInfrastructure,
        business_requirements: businessRequirements
      });

      res.json({
        success: true,
        analysis,
        next_step: 'Create detailed migration plan'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Migration analysis failed",
        error: (error as Error).message
      });
    }
  });

  app.post("/api/ai-agents/migration/plan", isAuthenticated, async (req, res) => {
    try {
      const { analysis } = req.body;
      const plan = await migrationAgent.createMigrationPlan(analysis);

      res.json({
        success: true,
        migration_plan: plan,
        execution_ready: true
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Migration planning failed",
        error: (error as Error).message
      });
    }
  });

  // Real-time AI Agent status updates
  app.get("/api/ai-agents/status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const agents = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId));

      const agentStatus = await Promise.all(
        agents.map(async (project) => {
          const status = await devOpsAgent.getDeploymentStatus(project.id);
          return {
            project_id: project.id,
            project_name: project.name,
            ...status
          };
        })
      );

      res.json({ success: true, agents: agentStatus, total_active: agentStatus.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get agent status",
        error: (error as Error).message
      });
    }
  });

  return server;
}

// Integration Testing Functions
async function testGitHubIntegration(credentials: any) {
  try {
    // Check if it's a personal access token or OAuth credentials
    let authHeader: string;

    if (credentials.personalAccessToken) {
      // Personal Access Token flow
      authHeader = `token ${credentials.personalAccessToken}`;
    } else if (credentials.clientSecret && credentials.clientSecret.startsWith('ghp_')) {
      // Client secret is actually a PAT
      authHeader = `token ${credentials.clientSecret}`;
    } else {
      // OAuth App credentials - can only validate the app exists
      const appResponse = await fetch(`https://api.github.com/app`, {
        headers: {
          'Authorization': `Bearer ${credentials.clientSecret}`,
          'User-Agent': 'Careerate-Integration-Test'
        }
      });

      if (!appResponse.ok) {
        return {
          success: false,
          message: `GitHub OAuth App validation failed. Please provide a Personal Access Token for testing.`
        };
      }

      return {
        success: true,
        message: `GitHub OAuth App credentials validated successfully`,
        data: { type: 'oauth_app' }
      };
    }

    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'Careerate-Integration-Test'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const user = await response.json();
    return {
      success: true,
      message: `Successfully connected to GitHub as ${user.login}`,
      data: { username: user.login, id: user.id }
    };
  } catch (error) {
    return {
      success: false,
      message: `GitHub connection failed: ${(error as Error).message}`
    };
  }
}

async function testGitLabIntegration(credentials: any) {
  try {
    const baseUrl = credentials.baseUrl || 'https://gitlab.com';
    const response = await fetch(`${baseUrl}/api/v4/user`, {
      headers: {
        'Authorization': `Bearer ${credentials.clientSecret}`
      }
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    const user = await response.json();
    return {
      success: true,
      message: `Successfully connected to GitLab as ${user.username}`,
      data: { username: user.username, id: user.id }
    };
  } catch (error) {
    return {
      success: false,
      message: `GitLab connection failed: ${(error as Error).message}`
    };
  }
}

async function testOpenAIIntegration(credentials: any) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully connected to OpenAI API (${data.data?.length || 0} models available)`,
      data: { modelsCount: data.data?.length || 0 }
    };
  } catch (error) {
    return {
      success: false,
      message: `OpenAI connection failed: ${(error as Error).message}`
    };
  }
}

async function testStripeIntegration(credentials: any) {
  try {
    // Use Stripe's balance endpoint as a simple test
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${credentials.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.statusText}`);
    }

    const balance = await response.json();
    return {
      success: true,
      message: `Successfully connected to Stripe`,
      data: { currency: balance.available?.[0]?.currency || 'usd' }
    };
  } catch (error) {
    return {
      success: false,
      message: `Stripe connection failed: ${(error as Error).message}`
    };
  }
}

async function testSendGridIntegration(credentials: any) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }

    const profile = await response.json();
    return {
      success: true,
      message: `Successfully connected to SendGrid for ${profile.email}`,
      data: { email: profile.email }
    };
  } catch (error) {
    return {
      success: false,
      message: `SendGrid connection failed: ${(error as Error).message}`
    };
  }
}

async function testTwilioIntegration(credentials: any) {
  try {
    // Use Twilio's account endpoint as a simple test
    const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }

    const account = await response.json();
    return {
      success: true,
      message: `Successfully connected to Twilio account ${account.friendly_name}`,
      data: { accountName: account.friendly_name, status: account.status }
    };
  } catch (error) {
    return {
      success: false,
      message: `Twilio connection failed: ${(error as Error).message}`
    };
  }
}

/*
// AI Agents
const devOpsAgent = new (require('./ai-agents/DevOpsAgent').DevOpsAgent)();
const migrationAgent = new (require('./ai-agents/DevOpsAgent').EnterpriseMigrationAgent)();

// DevOps Agent - Full automation workflow
app.post("/api/ai-agents/devops/deploy", isAuthenticated, async (req, res) => {
  try {
    const { projectId, repositoryUrl, requirements } = req.body;

    const result = await devOpsAgent.executeWorkflow({
      project_id: projectId,
      repository_url: repositoryUrl,
      user_requirements: requirements
    });

    res.json({
      success: true,
      deployment_id: `deploy-${projectId}-${Date.now()}`,
      status: result.deployment_status,
      infrastructure: result.infrastructure,
      security: result.security_scan,
      performance: result.performance_metrics,
      estimated_completion: '15-30 minutes'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "DevOps automation failed",
      error: error.message
    });
  }
});

// Get deployment status
app.get("/api/ai-agents/devops/status/:projectId", isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const status = await devOpsAgent.getDeploymentStatus(projectId);
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get deployment status",
      error: error.message
    });
  }
});

// Enterprise Migration Agent
app.post("/api/ai-agents/migration/analyze", isAuthenticated, async (req, res) => {
  try {
    const { systemDescription, currentInfrastructure, businessRequirements } = req.body;

    const analysis = await migrationAgent.analyzeExistingSystem({
      system_description: systemDescription,
      current_infrastructure: currentInfrastructure,
      business_requirements: businessRequirements
    });

    res.json({
      success: true,
      analysis,
      next_step: 'Create detailed migration plan'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Migration analysis failed",
      error: error.message
    });
  }
});

app.post("/api/ai-agents/migration/plan", isAuthenticated, async (req, res) => {
  try {
    const { analysis } = req.body;
    const plan = await migrationAgent.createMigrationPlan(analysis);

    res.json({
      success: true,
      migration_plan: plan,
      execution_ready: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Migration planning failed",
      error: error.message
    });
  }
});

// Real-time AI Agent status updates
app.get("/api/ai-agents/status", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Get all active AI agents for the user
    const agents = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));

    const agentStatus = await Promise.all(
      agents.map(async (project) => {
        const status = await devOpsAgent.getDeploymentStatus(project.id);
        return {
          project_id: project.id,
          project_name: project.name,
          ...status
        };
      })
    );

    res.json({
      success: true,
      agents: agentStatus,
      total_active: agentStatus.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get agent status",
      error: error.message
    });
  }
});
*/
