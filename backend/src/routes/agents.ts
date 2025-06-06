import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { AgentOrchestrator } from '../services/AgentOrchestrator.js';
import type { AgentType, AgentMessage } from '../types/index.js';

const router = express.Router();

// Initialize agent orchestrator (will be injected via middleware)
let agentOrchestrator: AgentOrchestrator;

// Middleware to inject agent orchestrator
router.use((req, res, next) => {
  agentOrchestrator = (req as any).app.locals.agentOrchestrator;
  next();
});

/**
 * Get available agents
 */
router.get('/available', async (req, res) => {
  try {
    const agents = await agentOrchestrator.getAvailableAgents();
    res.json({
      success: true,
      agents
    });
  } catch (error) {
    console.error('Failed to get available agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available agents'
    });
  }
});

/**
 * Get agent capabilities
 */
router.get('/:agentType/capabilities', 
  param('agentType').isString().isLength({ min: 1 }),
  validateRequest,
  async (req, res) => {
    try {
      const { agentType } = req.params;
      const capabilities = await agentOrchestrator.getAgentCapabilities(agentType as AgentType);
      
      res.json({
        success: true,
        agentType,
        capabilities
      });
    } catch (error) {
      console.error('Failed to get agent capabilities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent capabilities'
      });
    }
  }
);

/**
 * Chat with specific agent
 */
router.post('/:agentType/chat',
  param('agentType').isString().isLength({ min: 1 }),
  body('message').isString().isLength({ min: 1 }),
  body('context').optional().isObject(),
  body('sessionId').optional().isString(),
  validateRequest,
  async (req, res) => {
    try {
      const { agentType } = req.params;
      const { message, context, sessionId } = req.body;
      const userId = (req as any).user.id;

      const response = await agentOrchestrator.processMessage({
        message,
        agentType: agentType as AgentType,
        context,
        userId,
        sessionId
      });

      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Agent chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process agent message'
      });
    }
  }
);

/**
 * Stream chat with agent
 */
router.post('/:agentType/stream',
  param('agentType').isString().isLength({ min: 1 }),
  body('message').isString().isLength({ min: 1 }),
  body('context').optional().isObject(),
  body('sessionId').optional().isString(),
  validateRequest,
  async (req, res) => {
    try {
      const { agentType } = req.params;
      const { message, context, sessionId } = req.body;
      const userId = (req as any).user.id;

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const stream = await agentOrchestrator.streamResponse({
        message,
        agentType: agentType as AgentType,
        context,
        userId,
        sessionId
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Agent streaming error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stream agent response'
      });
    }
  }
);

/**
 * Get agent conversation history
 */
router.get('/:agentType/history',
  param('agentType').isString().isLength({ min: 1 }),
  query('sessionId').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  async (req, res) => {
    try {
      const { agentType } = req.params;
      const { sessionId, limit = 20 } = req.query;
      const userId = (req as any).user.id;

      const history = await agentOrchestrator.getConversationHistory({
        agentType: agentType as AgentType,
        userId,
        sessionId: sessionId as string,
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversation history'
      });
    }
  }
);

/**
 * Clear agent conversation history
 */
router.delete('/:agentType/history',
  param('agentType').isString().isLength({ min: 1 }),
  body('sessionId').optional().isString(),
  validateRequest,
  async (req, res) => {
    try {
      const { agentType } = req.params;
      const { sessionId } = req.body;
      const userId = (req as any).user.id;

      await agentOrchestrator.clearConversationHistory({
        agentType: agentType as AgentType,
        userId,
        sessionId
      });

      res.json({
        success: true,
        message: 'Conversation history cleared'
      });
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear conversation history'
      });
    }
  }
);

/**
 * Get agent performance metrics
 */
router.get('/:agentType/metrics',
  param('agentType').isString().isLength({ min: 1 }),
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  validateRequest,
  async (req, res) => {
    try {
      const { agentType } = req.params;
      const { timeframe = 'day' } = req.query;
      const userId = (req as any).user.id;

      const metrics = await agentOrchestrator.getAgentMetrics({
        agentType: agentType as AgentType,
        userId,
        timeframe: timeframe as string
      });

      res.json({
        success: true,
        metrics
      });
    } catch (error) {
      console.error('Failed to get agent metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent metrics'
      });
    }
  }
);

/**
 * Update agent preferences
 */
router.put('/:agentType/preferences',
  param('agentType').isString().isLength({ min: 1 }),
  body('preferences').isObject(),
  validateRequest,
  async (req, res) => {
    try {
      const { agentType } = req.params;
      const { preferences } = req.body;
      const userId = (req as any).user.id;

      await agentOrchestrator.updateAgentPreferences({
        agentType: agentType as AgentType,
        userId,
        preferences
      });

      res.json({
        success: true,
        message: 'Agent preferences updated'
      });
    } catch (error) {
      console.error('Failed to update agent preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update agent preferences'
      });
    }
  }
);

export default router;