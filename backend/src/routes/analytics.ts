import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * Get user analytics overview
 */
router.get('/overview', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Mock analytics data - in real implementation, query from database
    const analytics = {
      totalSessions: 42,
      totalMessages: 158,
      averageResponseTime: 1.2,
      topAgents: [
        { name: 'Terraform', usage: 35 },
        { name: 'Kubernetes', usage: 28 },
        { name: 'AWS', usage: 22 }
      ],
      recentActivity: [
        { type: 'agent_chat', agent: 'Terraform', timestamp: new Date() },
        { type: 'workspace_join', workspace: 'DevOps Team', timestamp: new Date() }
      ]
    };
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Failed to get analytics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics overview'
    });
  }
});

/**
 * Get agent usage metrics
 */
router.get('/agents',
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  query('agentType').optional().isString(),
  validateRequest,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { timeframe = 'week', agentType } = req.query;
      
      // Mock agent metrics
      const metrics = {
        timeframe,
        agentType: agentType || 'all',
        data: [
          { agent: 'Terraform', sessions: 15, messages: 45, successRate: 0.92 },
          { agent: 'Kubernetes', sessions: 12, messages: 38, successRate: 0.89 },
          { agent: 'AWS', sessions: 10, messages: 32, successRate: 0.94 }
        ]
      };
      
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
 * Get collaboration metrics
 */
router.get('/collaboration',
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  validateRequest,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { timeframe = 'week' } = req.query;
      
      // Mock collaboration metrics
      const metrics = {
        timeframe,
        activeWorkspaces: 3,
        totalCollaborators: 8,
        sessionsCreated: 12,
        contextShares: 25,
        timeline: [
          { date: '2024-01-01', sessions: 3, collaborators: 2 },
          { date: '2024-01-02', sessions: 4, collaborators: 3 },
          { date: '2024-01-03', sessions: 2, collaborators: 1 }
        ]
      };
      
      res.json({
        success: true,
        metrics
      });
    } catch (error) {
      console.error('Failed to get collaboration metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve collaboration metrics'
      });
    }
  }
);

/**
 * Get performance metrics
 */
router.get('/performance',
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  validateRequest,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { timeframe = 'week' } = req.query;
      
      // Mock performance metrics
      const metrics = {
        timeframe,
        averageResponseTime: 1.2,
        successRate: 0.91,
        errorRate: 0.09,
        throughput: 45,
        timeline: [
          { date: '2024-01-01', responseTime: 1.1, successRate: 0.92 },
          { date: '2024-01-02', responseTime: 1.3, successRate: 0.89 },
          { date: '2024-01-03', responseTime: 1.0, successRate: 0.95 }
        ]
      };
      
      res.json({
        success: true,
        metrics
      });
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    }
  }
);

/**
 * Get team analytics (for team/workspace owners)
 */
router.get('/team/:workspaceId',
  param('workspaceId').isString().isLength({ min: 1 }),
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { timeframe = 'week' } = req.query;
      const userId = (req as any).user.id;
      
      // Mock team analytics
      const analytics = {
        workspaceId,
        timeframe,
        totalMembers: 5,
        activeMembers: 4,
        totalSessions: 28,
        totalMessages: 142,
        topPerformers: [
          { userId: 'user1', name: 'Alice', sessions: 8, messages: 35 },
          { userId: 'user2', name: 'Bob', sessions: 6, messages: 28 }
        ],
        agentUsage: [
          { agent: 'Terraform', usage: 45 },
          { agent: 'Kubernetes', usage: 38 },
          { agent: 'AWS', usage: 32 }
        ]
      };
      
      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Failed to get team analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve team analytics'
      });
    }
  }
);

/**
 * Get usage trends
 */
router.get('/trends',
  query('metric').optional().isIn(['sessions', 'messages', 'response_time', 'success_rate']),
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  validateRequest,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { metric = 'sessions', timeframe = 'week' } = req.query;
      
      // Mock trend data
      const trends = {
        metric,
        timeframe,
        data: [
          { period: '2024-01-01', value: 5 },
          { period: '2024-01-02', value: 8 },
          { period: '2024-01-03', value: 6 },
          { period: '2024-01-04', value: 12 },
          { period: '2024-01-05', value: 9 }
        ],
        growth: 0.15, // 15% growth
        prediction: [
          { period: '2024-01-06', value: 10 },
          { period: '2024-01-07', value: 11 }
        ]
      };
      
      res.json({
        success: true,
        trends
      });
    } catch (error) {
      console.error('Failed to get usage trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve usage trends'
      });
    }
  }
);

/**
 * Export analytics data
 */
router.post('/export',
  body('format').isIn(['csv', 'json', 'pdf']),
  body('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
  body('metrics').optional().isArray(),
  validateRequest,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { format, timeframe = 'week', metrics = ['all'] } = req.body;
      
      // In real implementation, generate and return export file
      const exportData = {
        exportId: 'export_' + Date.now(),
        format,
        timeframe,
        metrics,
        status: 'generating',
        downloadUrl: null
      };
      
      res.json({
        success: true,
        export: exportData
      });
    } catch (error) {
      console.error('Failed to export analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export analytics data'
      });
    }
  }
);

export default router;