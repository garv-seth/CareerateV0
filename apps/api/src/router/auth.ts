import { Router, Request, Response } from 'express';
import { exchangeB2CTokenForJWT } from '../auth/passport';
import { body, validationResult } from 'express-validator';

const router: Router = Router();

/**
 * @route   POST /api/auth/token
 * @desc    Exchange an Azure AD B2C token for an application JWT
 * @access  Public
 */
router.post(
    '/token',
    [
        body('token', 'B2C token is required').not().isEmpty(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token: b2cToken } = req.body;

        try {
            const { token, user } = await exchangeB2CTokenForJWT(b2cToken);
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (error) {
            console.error('B2C token exchange error:', error);
            res.status(401).json({ msg: 'Token is not valid' });
        }
    }
);

export default router;