import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import materialRoutes from './material.routes.js';
import quizRoutes from './quiz.routes.js';
import attemptRoutes from './attempt.routes.js';
import chatRoutes from './chat.routes.js';
import courseRoutes from './course.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import { isAiConfigured } from '../services/ai.service.js';
import { isGoogleConfigured } from '../services/auth.service.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';

const router = Router();

router.get('/health', (req, res) =>
  res.json({
    success: true,
    status: 'ok',
    services: {
      ai: isAiConfigured(),
      cloudinary: isCloudinaryConfigured(),
      google: isGoogleConfigured(),
    },
  })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/materials', materialRoutes);
router.use('/quizzes', quizRoutes);
router.use('/attempts', attemptRoutes);
router.use('/chat', chatRoutes);
router.use('/courses', courseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

export default router;
