import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { RealTimeCollaboration } from '../services/RealTimeCollaboration.js';
import type { WorkspaceConfig } from '../types/index.js';

const router = express.Router();

// Initialize collaboration service (will be injected via middleware)
let realTimeCollab: RealTimeCollaboration;

// Middleware to inject collaboration service
router.use((req, res, next) => {
  realTimeCollab = (req as any).app.locals.realTimeCollab;
  next();
});

/**
 * Get user workspaces
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const workspaces = await realTimeCollab.getUserWorkspaces(userId);
    
    res.json({
      success: true,
      workspaces
    });
  } catch (error) {
    console.error('Failed to get workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workspaces'
    });
  }
});

/**
 * Create new workspace
 */
router.post('/',
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('isPrivate').optional().isBoolean(),
  validateRequest,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { name, description, isPrivate = true } = req.body;
      
      const workspace = await realTimeCollab.createWorkspace({
        name,
        description,
        isPrivate,
        ownerId: userId
      });
      
      res.status(201).json({
        success: true,
        workspace
      });
    } catch (error) {
      console.error('Failed to create workspace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create workspace'
      });
    }
  }
);

/**
 * Get workspace details
 */
router.get('/:workspaceId',
  param('workspaceId').isString().isLength({ min: 1 }),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = (req as any).user.id;
      
      const workspace = await realTimeCollab.getWorkspace(workspaceId, userId);
      
      res.json({
        success: true,
        workspace
      });
    } catch (error) {
      console.error('Failed to get workspace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workspace'
      });
    }
  }
);

/**
 * Update workspace
 */
router.put('/:workspaceId',
  param('workspaceId').isString().isLength({ min: 1 }),
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('isPrivate').optional().isBoolean(),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;
      
      const workspace = await realTimeCollab.updateWorkspace(workspaceId, userId, updates);
      
      res.json({
        success: true,
        workspace
      });
    } catch (error) {
      console.error('Failed to update workspace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update workspace'
      });
    }
  }
);

/**
 * Delete workspace
 */
router.delete('/:workspaceId',
  param('workspaceId').isString().isLength({ min: 1 }),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = (req as any).user.id;
      
      await realTimeCollab.deleteWorkspace(workspaceId, userId);
      
      res.json({
        success: true,
        message: 'Workspace deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete workspace'
      });
    }
  }
);

/**
 * Get workspace members
 */
router.get('/:workspaceId/members',
  param('workspaceId').isString().isLength({ min: 1 }),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = (req as any).user.id;
      
      const members = await realTimeCollab.getWorkspaceMembers(workspaceId, userId);
      
      res.json({
        success: true,
        members
      });
    } catch (error) {
      console.error('Failed to get workspace members:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workspace members'
      });
    }
  }
);

/**
 * Invite user to workspace
 */
router.post('/:workspaceId/invite',
  param('workspaceId').isString().isLength({ min: 1 }),
  body('email').isEmail(),
  body('role').optional().isIn(['viewer', 'editor', 'admin']),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { email, role = 'editor' } = req.body;
      const userId = (req as any).user.id;
      
      const invitation = await realTimeCollab.inviteToWorkspace({
        workspaceId,
        email,
        role,
        invitedBy: userId
      });
      
      res.json({
        success: true,
        invitation
      });
    } catch (error) {
      console.error('Failed to invite user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send invitation'
      });
    }
  }
);

/**
 * Remove member from workspace
 */
router.delete('/:workspaceId/members/:memberId',
  param('workspaceId').isString().isLength({ min: 1 }),
  param('memberId').isString().isLength({ min: 1 }),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId, memberId } = req.params;
      const userId = (req as any).user.id;
      
      await realTimeCollab.removeMember(workspaceId, memberId, userId);
      
      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      console.error('Failed to remove member:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove member'
      });
    }
  }
);

/**
 * Get workspace sessions (active collaborations)
 */
router.get('/:workspaceId/sessions',
  param('workspaceId').isString().isLength({ min: 1 }),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = (req as any).user.id;
      
      const sessions = await realTimeCollab.getWorkspaceSessions(workspaceId, userId);
      
      res.json({
        success: true,
        sessions
      });
    } catch (error) {
      console.error('Failed to get workspace sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workspace sessions'
      });
    }
  }
);

/**
 * Join workspace session
 */
router.post('/:workspaceId/join',
  param('workspaceId').isString().isLength({ min: 1 }),
  body('sessionId').optional().isString(),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { sessionId } = req.body;
      const userId = (req as any).user.id;
      
      const session = await realTimeCollab.joinWorkspaceSession({
        workspaceId,
        userId,
        sessionId
      });
      
      res.json({
        success: true,
        session
      });
    } catch (error) {
      console.error('Failed to join workspace session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to join workspace session'
      });
    }
  }
);

/**
 * Share context in workspace
 */
router.post('/:workspaceId/context',
  param('workspaceId').isString().isLength({ min: 1 }),
  body('context').isObject(),
  body('sessionId').optional().isString(),
  validateRequest,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { context, sessionId } = req.body;
      const userId = (req as any).user.id;
      
      await realTimeCollab.shareContext({
        workspaceId,
        userId,
        context,
        sessionId
      });
      
      res.json({
        success: true,
        message: 'Context shared successfully'
      });
    } catch (error) {
      console.error('Failed to share context:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to share context'
      });
    }
  }
);

export default router;