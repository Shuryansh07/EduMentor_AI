import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import validate from '../middleware/validate.js';
import { idParam } from '../validators/index.js';

const router = Router();

router.use(protect, authorize('admin'));

// Users
router.get('/users', ctrl.listUsers);
router.put('/users/:id/role', idParam, validate, ctrl.updateUserRole);
router.put('/users/:id/active', idParam, validate, ctrl.setUserActive);
router.delete('/users/:id', idParam, validate, ctrl.deleteUser);

// Content moderation
router.get('/materials/flagged', ctrl.listFlagged);
router.put('/materials/:id/flag', idParam, validate, ctrl.flagMaterial);
router.delete('/materials/:id', idParam, validate, ctrl.removeMaterial);
router.delete('/courses/:id', idParam, validate, ctrl.removeCourse);

export default router;
