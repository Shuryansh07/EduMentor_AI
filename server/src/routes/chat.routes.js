import { Router } from 'express';
import * as ctrl from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import { chatRules, idParam } from '../validators/index.js';

const router = Router();

router.use(protect);

router.get('/', ctrl.listSessions);
router.get('/:id', idParam, validate, ctrl.getSession);
router.post('/', aiLimiter, chatRules, validate, ctrl.sendMessage);
router.delete('/:id', idParam, validate, ctrl.deleteSession);

export default router;
