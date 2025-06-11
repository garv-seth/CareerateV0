import express, { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { MCPManager } from '../services/MCPManager';
import type { MCPServerConfig } from '../types/index';

const router = express.Router();

// Initialize MCP manager (will be injected via middleware)
let mcpManager: MCPManager;

// Middleware to inject MCP manager
router.use((req, res, next) => {
  mcpManager = (req as any).app.locals.mcpManager;
  next();
});

/**
 * Get available MCP servers
 */
router.get('/servers', async (req, res) => {
  try {
    const servers = await mcpManager.getAvailableServers();
    res.json({
      success: true,
      servers
    });
  } catch (error) {
    console.error('Failed to get MCP servers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve MCP servers'
    });
  }
});

/**
 * Get MCP server status
 */
router.get('/servers/:serverId/status', [
  param('serverId').isString().isLength({ min: 1 }),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    const status = await mcpManager.getServerStatus(serverId);
    
    res.json({
      success: true,
      serverId,
      status
    });
  } catch (error) {
    console.error('Failed to get server status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve server status'
    });
  }
});

/**
 * Start MCP server
 */
router.post('/servers/:serverId/start', [
  param('serverId').isString().isLength({ min: 1 }),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    await mcpManager.startServer(serverId);
    
    res.json({
      success: true,
      message: `Server ${serverId} started successfully`
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start server'
    });
  }
});

/**
 * Stop MCP server
 */
router.post('/servers/:serverId/stop', [
  param('serverId').isString().isLength({ min: 1 }),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    await mcpManager.stopServer(serverId);
    
    res.json({
      success: true,
      message: `Server ${serverId} stopped successfully`
    });
  } catch (error) {
    console.error('Failed to stop server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop server'
    });
  }
});

/**
 * Invoke MCP server tool
 */
router.post('/servers/:serverId/invoke', [
  param('serverId').isString().isLength({ min: 1 }),
  body('method').isString().isLength({ min: 1 }),
  body('params').optional().isObject(),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    const { method, params = {} } = req.body;
    
    const result = await mcpManager.invokeServer(serverId, method, params);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Failed to invoke server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invoke server method'
    });
  }
});

/**
 * Get MCP server tools
 */
router.get('/servers/:serverId/tools', [
  param('serverId').isString().isLength({ min: 1 }),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    const tools = await mcpManager.getServerTools(serverId);
    
    res.json({
      success: true,
      serverId,
      tools
    });
  } catch (error) {
    console.error('Failed to get server tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve server tools'
    });
  }
});

/**
 * Get MCP server resources
 */
router.get('/servers/:serverId/resources', [
  param('serverId').isString().isLength({ min: 1 }),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    const resources = await mcpManager.getServerResources(serverId);
    
    res.json({
      success: true,
      serverId,
      resources
    });
  } catch (error) {
    console.error('Failed to get server resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve server resources'
    });
  }
});

/**
 * Register new MCP server
 */
router.post('/servers', [
  body('config').isObject(),
  body('config.id').isString().isLength({ min: 1 }),
  body('config.name').isString().isLength({ min: 1 }),
  body('config.command').isString().isLength({ min: 1 }),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const { config } = req.body;
    await mcpManager.registerServer(config as MCPServerConfig);
    
    res.json({
      success: true,
      message: 'MCP server registered successfully'
    });
  } catch (error) {
    console.error('Failed to register server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register MCP server'
    });
  }
});

/**
 * Unregister MCP server
 */
router.delete('/servers/:serverId', [
  param('serverId').isString().isLength({ min: 1 }),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    await mcpManager.unregisterServer(serverId);
    
    res.json({
      success: true,
      message: 'MCP server unregistered successfully'
    });
  } catch (error) {
    console.error('Failed to unregister server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister MCP server'
    });
  }
});

/**
 * Get MCP server logs
 */
router.get('/servers/:serverId/logs', [
  param('serverId').isString().isLength({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('level').optional().isIn(['debug', 'info', 'warn', 'error']),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const serverId = req.params?.serverId as string;
    const limit = parseInt(req.query?.limit as string) || 100;
    const level = (req.query?.level as string) || 'info';
    
    const logs = await mcpManager.getServerLogs(serverId, limit, level);
    
    res.json({
      success: true,
      serverId,
      logs
    });
  } catch (error) {
    console.error('Failed to get server logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve server logs'
    });
  }
});

export default router;