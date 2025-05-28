import express, { Request, Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator';
import { DatabaseStorage } from '../storage';
import { MCPRegistry } from '../mcp_servers/registry';

const router = express.Router();
const storage = new DatabaseStorage();
const mcpRegistry = new MCPRegistry();
const orchestrator = new AgentOrchestrator(storage, mcpRegistry);

// Get learning paths
router.get('/', (req: Request, res: Response, next: express.NextFunction) => {
  (async () => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const tools = await orchestrator.discoverTools(userId);
      const paths = await orchestrator.createLearningPath(userId, tools);
      return res.json({ paths });
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      next(error); // Pass error to Express error handler
    }
  })().catch(next); // Catch unhandled promise rejections
});

export default router; 