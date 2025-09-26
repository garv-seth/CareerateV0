import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Stripe webhook needs raw body, so handle it before JSON parsing
app.use('/api/webhooks/stripe', express.raw({type: 'application/json'}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add cache-busting and deployment info headers
app.use((req, res, next) => {
  // Add deployment tracking headers
  const deployTimestamp = process.env.DEPLOY_TIMESTAMP || new Date().toISOString();
  const gitCommit = process.env.GIT_COMMIT || 'unknown';
  const cacheBust = process.env.CACHE_BUST || Date.now().toString();

  res.setHeader('X-Deploy-Timestamp', deployTimestamp);
  res.setHeader('X-Git-Commit', gitCommit);
  res.setHeader('X-Cache-Bust', cacheBust);

  // Prevent caching for HTML files to ensure latest app shell
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Allow caching for static assets but with validation
  if (req.path.includes('/assets/') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.setHeader('ETag', `"${gitCommit}-${cacheBust}"`);
  }

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add a simple health check route with deployment info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: 'v0.0.24',
    deployTimestamp: process.env.DEPLOY_TIMESTAMP || 'unknown',
    gitCommit: process.env.GIT_COMMIT || 'unknown',
    cacheBust: process.env.CACHE_BUST || 'unknown'
  });
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      console.log(`🚀 Careerate server running on port ${port}`);
      console.log(`🔗 Production URL: https://gocareerate.com`);
      console.log(`🔗 Direct URL: https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
