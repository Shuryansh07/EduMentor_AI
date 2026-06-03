import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';
import validate from '../middleware/validate.js';
import { changePasswordRules } from '../validators/auth.validator.js';

const router = Router();

router.use(protect);

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.put('/password', changePasswordRules, validate, ctrl.changePassword);
router.post('/avatar', uploadAvatar, ctrl.uploadAvatar);

export default router;
