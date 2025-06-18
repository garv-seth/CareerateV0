"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = require("../auth/passport");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/token
 * @desc    Exchange an Azure AD B2C token for an application JWT
 * @access  Public
 */
router.post('/token', [
    (0, express_validator_1.body)('token', 'B2C token is required').not().isEmpty(),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { token: b2cToken } = req.body;
    try {
        const { token, user } = await (0, passport_1.exchangeB2CTokenForJWT)(b2cToken);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('B2C token exchange error:', error);
        res.status(401).json({ msg: 'Token is not valid' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map