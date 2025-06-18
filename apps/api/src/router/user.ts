import { Router } from 'express';
import { protect } from '../auth/middleware';

const router: Router = Router();

router.get('/me', protect, (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(404).json({ message: 'User not found in session.' });
    }
});

export default router; 