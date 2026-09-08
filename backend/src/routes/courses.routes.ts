import { Router } from 'express';
import {
  listCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseWithWishlist,
} from '../controllers/courses.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

// Public
router.get('/', listCourses);
router.get('/:id', getCourseById);
router.get('/:id/detail', authenticate, getCourseWithWishlist);

// Admin only
router.post('/', authenticate, requireAdmin, createCourse);
router.put('/:id', authenticate, requireAdmin, updateCourse);
router.delete('/:id', authenticate, requireAdmin, deleteCourse);

export default router;
