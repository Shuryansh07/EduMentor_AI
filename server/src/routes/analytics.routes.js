import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = Router();

router.use(protect);

router.get('/student', ctrl.studentDashboard);
router.get('/teacher', authorize('teacher', 'admin'), ctrl.teacherDashboard);
router.get('/admin', authorize('admin'), ctrl.adminDashboard);

export default router;
