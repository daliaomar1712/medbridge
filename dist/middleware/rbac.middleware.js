"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.',
                errorCode: 'UNAUTHORIZED',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action.',
                errorCode: 'FORBIDDEN',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('ADMIN');
exports.requireUser = (0, exports.requireRole)('USER', 'ADMIN');
//# sourceMappingURL=rbac.middleware.js.map