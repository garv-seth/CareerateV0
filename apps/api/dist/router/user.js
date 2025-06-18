"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const router = (0, express_1.Router)();
router.get('/me', middleware_1.protect, (req, res) => {
    if (req.user) {
        res.json(req.user);
    }
    else {
        res.status(404).json({ message: 'User not found in session.' });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map