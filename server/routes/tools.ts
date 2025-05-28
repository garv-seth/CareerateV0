import express, { Request, Response, NextFunction } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator';
import { DatabaseStorage } from '../storage';
import { MCPRegistry } from '../mcp_servers/registry';

const router = express.Router();
const storage = new DatabaseStorage();
const mcpRegistry = new MCPRegistry();
const orchestrator = new AgentOrchestrator(storage, mcpRegistry);

// Get recommended tools
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const tools = await orchestrator.discoverTools(userId);
      res.json({ tools });
    } catch (error) {
      console.error('Error fetching tools:', error);
      next(error);
    }
  })().catch(next);
});

export default router; 