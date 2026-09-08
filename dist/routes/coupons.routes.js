"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupons_controller_1 = require("../controllers/coupons.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.post('/validate', auth_middleware_1.authenticate, coupons_controller_1.validateCoupon);
router.get('/', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, coupons_controller_1.listCoupons);
router.post('/', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, coupons_controller_1.createCoupon);
router.put('/:id', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, coupons_controller_1.updateCoupon);
router.delete('/:id', auth_middleware_1.authenticate, rbac_middleware_1.requireAdmin, coupons_controller_1.deleteCoupon);
exports.default = router;
//# sourceMappingURL=coupons.routes.js.map