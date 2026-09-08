"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email address.'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required.'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required.'),
    (0, express_validator_1.body)('phone').trim().notEmpty().withMessage('Phone number is required.')
        .matches(/^\+?[0-9][0-9\s()-]{6,28}$/).withMessage('Please provide a valid phone number.'),
], auth_controller_1.register);
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email address.'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required.'),
], auth_controller_1.login);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
router.put('/profile', auth_middleware_1.authenticate, auth_controller_1.updateProfile);
router.put('/change-password', auth_middleware_1.authenticate, auth_controller_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map