import { Router } from 'express';
import {
  validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon,
} from '../controllers/coupons.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.post('/validate', authenticate, validateCoupon);
router.get('/', authenticate, requireAdmin, listCoupons);
router.post('/', authenticate, requireAdmin, createCoupon);
router.put('/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/:id', authenticate, requireAdmin, deleteCoupon);

export default router;
