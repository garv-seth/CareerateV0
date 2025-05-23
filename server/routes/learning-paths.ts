import express, { Request, Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator';
import { DatabaseStorage } from '../storage';
import { MCPRegistry } from '../mcp_servers/registry';

const router = express.Router();
const storage = new DatabaseStorage();
const mcpRegistry = new MCPRegistry();
const orchestrator = new AgentOrchestrator(storage, mcpRegistry);

// Get learning paths
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const tools = await orchestrator.discoverTools(userId);
    const paths = await orchestrator.createLearningPath(userId, tools);
    res.json({ paths });
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

export default router; 