import { Router, Request, Response } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequest, commonSchemas } from '../middleware/validation.js';

const router = Router();

// Azure B2C configuration will be injected from the main server
let msalInstance: ConfidentialClientApplication | null = null;

export const initializeAuth = (msalConfig: any) => {
  msalInstance = new ConfidentialClientApplication(msalConfig);
};

// Login endpoint
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!msalInstance) {
      throw new Error('Authentication not initialized');
    }

    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_AUTH_CODE',
          message: 'Authorization code is required'
        }
      });
    }

    // Exchange authorization code for tokens
    const tokenRequest = {
      code,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback'
    };

    const response = await msalInstance.acquireTokenByCode(tokenRequest);

    if (!response.accessToken) {
      throw new Error('Failed to acquire access token');
    }

    // Generate our own JWT token for internal use
    const jwtToken = jwt.sign(
      {
        sub: response.account?.localAccountId,
        email: response.account?.username,
        name: response.account?.name,
        role: 'user' // Default role, can be enhanced based on Azure claims
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        accessToken: jwtToken,
        refreshToken: response.refreshToken,
        user: {
          id: response.account?.localAccountId,
          email: response.account?.username,
          name: response.account?.name,
          role: 'user'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Authentication failed'
      }
    });
  }
}));

// Logout endpoint
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  try {
    // In a more complete implementation, you'd invalidate the refresh token
    // and potentially redirect to Azure B2C logout endpoint
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed'
      }
    });
  }
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!msalInstance) {
      throw new Error('Authentication not initialized');
    }

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    // Use MSAL to refresh the token
    const refreshRequest = {
      refreshToken,
      scopes: ['openid', 'profile', 'email']
    };

    const response = await msalInstance.acquireTokenByRefreshToken(refreshRequest);

    // Generate new JWT token
    const jwtToken = jwt.sign(
      {
        sub: response.account?.localAccountId,
        email: response.account?.username,
        name: response.account?.name,
        role: 'user'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        accessToken: jwtToken,
        refreshToken: response.refreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: 'Token refresh failed'
      }
    });
  }
}));

// Get user profile
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token required'
        }
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    res.json({
      success: true,
      data: {
        user: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }
}));

// Health check for auth service
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      msalInitialized: !!msalInstance,
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;