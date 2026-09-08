import { Router } from 'express';
import { getAnalytics, getAllUsers, updateUser, deleteUser, exportData, updateAcademyProfile } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/export', exportData);
router.put('/academy-profile', updateAcademyProfile);

export default router;
