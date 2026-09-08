"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollments_controller_1 = require("../controllers/enrollments.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, enrollments_controller_1.enrollInCourse);
router.get('/my', auth_middleware_1.authenticate, enrollments_controller_1.getMyEnrollments);
router.delete('/my/:id', auth_middleware_1.authenticate, enrollments_controller_1.cancelMyEnrollment);
router.get('/', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, enrollments_controller_1.getAllEnrollments);
router.patch('/:id/status', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, enrollments_controller_1.updateEnrollmentStatus);
router.delete('/:id', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, enrollments_controller_1.deleteEnrollment);
exports.default = router;
//# sourceMappingURL=enrollments.routes.js.map