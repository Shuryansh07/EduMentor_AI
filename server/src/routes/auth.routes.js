import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import {
  registerRules,
  loginRules,
  forgotRules,
  resetRules,
  resetOtpRules,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/login', authLimiter, loginRules, validate, ctrl.login);
router.post('/google', authLimiter, ctrl.googleLogin);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', authLimiter, forgotRules, validate, ctrl.forgotPassword);
router.post('/reset-password-otp', authLimiter, resetOtpRules, validate, ctrl.resetPasswordOtp);
router.post('/reset-password/:token', authLimiter, resetRules, validate, ctrl.resetPassword);
router.get('/me', protect, ctrl.me);

export default router;
