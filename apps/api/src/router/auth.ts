import { Router } from 'express';
import passport from '../auth/passport';

const router: Router = Router();

// Initiates the B2C login flow
router.get('/login', passport.authenticate('azuread-openidconnect', {
    // failureRedirect: '/', // This is handled by B2C policies
}));

// B2C callback endpoint
router.post('/callback', passport.authenticate('azuread-openidconnect', {
    // failureRedirect: '/login', // Redirect on failure is configured in B2C
}), (req, res) => {
    // On success, Passport.js attaches the user to req.user.
    // Here we can issue our own session token if needed, or redirect.
    // For a SPA, we'll redirect back to the app with a success indicator.
    res.redirect('/'); 
});

// Logout endpoint
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        // We can also redirect to the B2C logout endpoint for single sign-out
        res.redirect('/');
    });
});

export default router; 