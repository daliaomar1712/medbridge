import { Router } from 'express';
import {
  enrollInCourse, getMyEnrollments, getAllEnrollments, updateEnrollmentStatus, deleteEnrollment, cancelMyEnrollment,
} from '../controllers/enrollments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.post('/', authenticate, enrollInCourse);
router.get('/my', authenticate, getMyEnrollments);
router.delete('/my/:id', authenticate, cancelMyEnrollment);
router.get('/', authenticate, requireAdmin, getAllEnrollments);
router.patch('/:id/status', authenticate, requireAdmin, updateEnrollmentStatus);
router.delete('/:id', authenticate, requireAdmin, deleteEnrollment);

export default router;
