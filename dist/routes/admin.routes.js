"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin);
router.get('/analytics', admin_controller_1.getAnalytics);
router.get('/users', admin_controller_1.getAllUsers);
router.patch('/users/:id', admin_controller_1.updateUser);
router.delete('/users/:id', admin_controller_1.deleteUser);
router.get('/export', admin_controller_1.exportData);
router.put('/academy-profile', admin_controller_1.updateAcademyProfile);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map