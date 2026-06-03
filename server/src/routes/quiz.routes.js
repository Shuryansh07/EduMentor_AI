import { Router } from 'express';
import * as ctrl from '../controllers/quiz.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import { quizGenerateRules, quizCreateRules, idParam } from '../validators/index.js';

const router = Router();

router.use(protect);

router.get('/', ctrl.list);
router.get('/:id', idParam, validate, ctrl.getOne);

// AI generation — rate limited (expensive).
router.post('/generate', aiLimiter, quizGenerateRules, validate, ctrl.generate);

// Manual creation — teachers (and admins) only.
router.post('/', authorize('teacher', 'admin'), quizCreateRules, validate, ctrl.create);

router.delete('/:id', idParam, validate, ctrl.remove);

export default router;
