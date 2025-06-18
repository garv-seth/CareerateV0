"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const passport_1 = __importDefault(require("passport"));
const protect = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(401).json({ message: (info === null || info === void 0 ? void 0 : info.message) || 'User not authenticated.' });
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.protect = protect;
//# sourceMappingURL=middleware.js.map