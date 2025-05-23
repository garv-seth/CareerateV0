import express, { type Request, Response, NextFunction } from "express";
import { WebSocketServer } from "ws";
import toolsRouter from "./routes/tools";
import learningPathsRouter from "./routes/learning-paths";
import { DatabaseStorage } from "./storage";
import { MCPRegistry } from "./mcp_servers/registry";
import { AgentOrchestrator } from "./agents/orchestrator";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize core services
const storage = new DatabaseStorage();
const mcpRegistry = new MCPRegistry();
const orchestrator = new AgentOrchestrator(storage, mcpRegistry);

// Request logging middleware
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

      console.log(logLine);
    }
  });

  next();
});

// Register routes
app.use('/api/tools', toolsRouter);
app.use('/api/learning-paths', learningPathsRouter);

// Create HTTP server
const server = app.listen(5000, () => {
  console.log('🚀 Careerate server running on port 5000');
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const userId = req.url?.split("/").pop();
  if (!userId) {
    ws.close();
    return;
  }

  const interval = setInterval(async () => {
    try {
      const insights = await orchestrator.getRealTimeInsights(userId);
      ws.send(JSON.stringify(insights));
    } catch (error) {
      console.error("WebSocket error:", error);
    }
  }, 30000); // Update every 30 seconds

  ws.on("close", () => {
    clearInterval(interval);
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down Careerate server...");
  await mcpRegistry.shutdown();
  process.exit(0);
});
