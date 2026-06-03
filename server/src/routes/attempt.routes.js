import { Router } from 'express';
import * as ctrl from '../controllers/attempt.controller.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { attemptRules, idParam } from '../validators/index.js';

const router = Router();

router.use(protect);

router.post('/', attemptRules, validate, ctrl.submit);
router.get('/', ctrl.myHistory);
router.get('/:id', idParam, validate, ctrl.getAttempt);

export default router;
