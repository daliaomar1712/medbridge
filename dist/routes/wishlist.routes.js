"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, wishlist_controller_1.getMyWishlist);
router.post('/', auth_middleware_1.authenticate, wishlist_controller_1.addToWishlist);
router.post('/toggle', auth_middleware_1.authenticate, wishlist_controller_1.toggleWishlist);
router.delete('/:courseId', auth_middleware_1.authenticate, wishlist_controller_1.removeFromWishlist);
exports.default = router;
//# sourceMappingURL=wishlist.routes.js.map