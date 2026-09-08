"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const courses_routes_1 = __importDefault(require("./routes/courses.routes"));
const enrollments_routes_1 = __importDefault(require("./routes/enrollments.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const coupons_routes_1 = __importDefault(require("./routes/coupons.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const academy_routes_1 = __importDefault(require("./routes/academy.routes"));
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
    },
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        errorCode: 'AUTH_RATE_LIMIT',
    },
});
app.use('/api/', globalLimiter);
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/courses', courses_routes_1.default);
app.use('/api/enrollments', enrollments_routes_1.default);
app.use('/api/wishlist', wishlist_routes_1.default);
app.use('/api/coupons', coupons_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/academy', academy_routes_1.default);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Med Bridge Academy API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        errorCode: 'NOT_FOUND',
    });
});
// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler_middleware_1.errorHandler);
// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Med Bridge Academy API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 🔗 Health check: http://localhost:${PORT}/api/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map