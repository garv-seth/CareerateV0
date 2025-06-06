import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types/index.js';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Basic validation logic - in a real implementation you'd use a library like Joi or Zod
      if (schema.body) {
        validateObject(req.body, schema.body, 'body');
      }
      
      if (schema.params) {
        validateObject(req.params, schema.params, 'params');
      }
      
      if (schema.query) {
        validateObject(req.query, schema.query, 'query');
      }
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed'
          }
        });
      }
    }
  };
};

function validateObject(obj: any, schema: any, location: string): void {
  if (!obj) {
    throw new ValidationError(`${location} is required`);
  }

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    
    if ((rules as any).required && (value === undefined || value === null)) {
      throw new ValidationError(`${key} is required in ${location}`);
    }
    
    if (value !== undefined && (rules as any).type) {
      const expectedType = (rules as any).type;
      const actualType = typeof value;
      
      if (actualType !== expectedType) {
        throw new ValidationError(
          `${key} in ${location} must be of type ${expectedType}, got ${actualType}`
        );
      }
    }
    
    if (value !== undefined && (rules as any).minLength) {
      if (typeof value === 'string' && value.length < (rules as any).minLength) {
        throw new ValidationError(
          `${key} in ${location} must be at least ${(rules as any).minLength} characters long`
        );
      }
    }
    
    if (value !== undefined && (rules as any).maxLength) {
      if (typeof value === 'string' && value.length > (rules as any).maxLength) {
        throw new ValidationError(
          `${key} in ${location} must be no more than ${(rules as any).maxLength} characters long`
        );
      }
    }
    
    if (value !== undefined && (rules as any).pattern) {
      if (typeof value === 'string' && !(rules as any).pattern.test(value)) {
        throw new ValidationError(
          `${key} in ${location} has invalid format`
        );
      }
    }
  }
}

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