"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const errorHandler_middleware_1 = require("../middleware/errorHandler.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/profile', (0, errorHandler_middleware_1.asyncHandler)(async (_req, res) => {
    const profile = await prisma.academyProfile.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
    });
    res.json({ success: true, data: { profile } });
}));
exports.default = router;
//# sourceMappingURL=academy.routes.js.map