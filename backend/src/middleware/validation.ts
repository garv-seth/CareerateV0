import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  } else {
    next();
  }
};

// Common validation schemas
export const commonSchemas = {
  pagination: {
    page: { type: 'number', min: 1 },
    limit: { type: 'number', min: 1, max: 100 }
  },
  
  agentMessage: {
    message: { type: 'string', required: true, minLength: 1 },
    agentType: { type: 'string' },
    context: { type: 'object' }
  },
  
  workspaceCreate: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    isPublic: { type: 'boolean' }
  },
  
  userUpdate: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    preferences: { type: 'object' }
  }
};