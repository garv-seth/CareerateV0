import { Router, Request, Response } from 'express';

const router = Router();

// User login
router.post('/login', async (req: Request, res: Response) => {
  // Mock login response
  res.json({ 
    success: true, 
    user: { id: 'user-123', email: 'user@example.com', name: 'John Doe' },
    token: 'mock-jwt-token'
  });
});

// User registration
router.post('/register', async (req: Request, res: Response) => {
  // Mock registration response
  res.json({ 
    success: true, 
    user: { id: 'user-123', email: req.body.email, name: req.body.name },
    message: 'Registration successful'
  });
});

// User logout
router.post('/logout', async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  res.json({ 
    user: { id: 'user-123', email: 'user@example.com', name: 'John Doe' }
  });
});

export default router; 