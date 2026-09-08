"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courses_controller_1 = require("../controllers/courses.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const router = (0, express_1.Router)();
// Public
router.get('/', courses_controller_1.listCourses);
router.get('/:id', courses_controller_1.getCourseById);
router.get('/:id/detail', auth_middleware_1.authenticate, courses_controller_1.getCourseWithWishlist);
// Admin only
router.post('/', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, courses_controller_1.createCourse);
router.put('/:id', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, courses_controller_1.updateCourse);
router.delete('/:id', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, courses_controller_1.deleteCourse);
exports.default = router;
//# sourceMappingURL=courses.routes.js.map