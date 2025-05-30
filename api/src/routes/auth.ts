import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PublicClientApplication } from '@azure/msal-node';

const router = express.Router();

// Azure AD MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// Login with Azure AD
router.post('/login', async (req, res) => {
  try {
    const { authCode, redirectUri } = req.body;

    if (!authCode) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange auth code for tokens (this would be handled client-side typically)
    // For server-side flow, you'd use MSAL Node's acquireTokenByCode
    
    // Mock user data for now - in production, get from Azure AD
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'John Doe',
      skillLevel: 'intermediate',
      workDomain: 'software_development',
      goals: ['increase_productivity', 'learn_ai_tools'],
      preferences: {
        theme: 'system',
        notifications: true,
        learningStyle: 'visual',
        difficultyPreference: 'intermediate',
        autoSync: true,
        privacy: {
          shareData: true,
          trackingEnabled: true,
          anonymousAnalytics: true
        }
      }
    };

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: mockUser.id, email: mockUser.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: mockUser.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      { expiresIn: '7d' }
    );

    // Store user in database (implement your database logic here)
    // await createOrUpdateUser(mockUser);

    res.json({
      user: mockUser,
      auth: {
        accessToken,
        refreshToken,
        tokenExpiry: Date.now() + (60 * 60 * 1000) // 1 hour
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
    ) as any;

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );

    res.json({
      accessToken: newAccessToken,
      tokenExpiry: Date.now() + (60 * 60 * 1000) // 1 hour
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    // In a real implementation, you'd invalidate the tokens
    // For now, just send success response
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    // Extract user ID from JWT token (implement middleware for this)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    // Get user from database
    // const user = await getUserById(decoded.userId);
    
    // Mock user data
    const mockUser = {
      id: decoded.userId,
      email: decoded.email,
      displayName: 'John Doe',
      skillLevel: 'intermediate',
      workDomain: 'software_development',
      goals: ['increase_productivity', 'learn_ai_tools'],
      preferences: {
        theme: 'system',
        notifications: true,
        learningStyle: 'visual',
        difficultyPreference: 'intermediate',
        autoSync: true,
        privacy: {
          shareData: true,
          trackingEnabled: true,
          anonymousAnalytics: true
        }
      }
    };

    res.json(mockUser);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    const { skillLevel, workDomain, goals, preferences } = req.body;

    // Update user in database
    // await updateUser(decoded.userId, { skillLevel, workDomain, goals, preferences });

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: decoded.userId,
        email: decoded.email,
        skillLevel,
        workDomain,
        goals,
        preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

export default router; 