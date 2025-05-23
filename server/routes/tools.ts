import express from 'express';
import { AgentOrchestrator } from '../agents/orchestrator';
import { DatabaseStorage } from '../storage';
import { MCPRegistry } from '../mcp_servers/registry';

const router = express.Router();
const storage = new DatabaseStorage();
const mcpRegistry = new MCPRegistry();
const orchestrator = new AgentOrchestrator(storage, mcpRegistry);

// Get recommended tools
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const tools = await orchestrator.discoverTools(userId);
    res.json({ tools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

export default router; 