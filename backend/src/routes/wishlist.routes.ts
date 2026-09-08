import { Router } from 'express';
import { addToWishlist, removeFromWishlist, getMyWishlist, toggleWishlist } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMyWishlist);
router.post('/', authenticate, addToWishlist);
router.post('/toggle', authenticate, toggleWishlist);
router.delete('/:courseId', authenticate, removeFromWishlist);

export default router;
