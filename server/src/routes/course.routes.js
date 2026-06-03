import { Router } from 'express';
import * as ctrl from '../controllers/course.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import validate from '../middleware/validate.js';
import { courseCreateRules, resourceRules, idParam } from '../validators/index.js';

const router = Router();

router.use(protect);

router.get('/', ctrl.listCourses);
router.get('/:id', idParam, validate, ctrl.getCourse);

router.post('/', authorize('teacher', 'admin'), courseCreateRules, validate, ctrl.createCourse);
router.put('/:id', idParam, validate, ctrl.updateCourse);
router.delete('/:id', idParam, validate, ctrl.deleteCourse);

router.post('/:id/enroll', idParam, validate, ctrl.enroll);
router.delete('/:id/enroll', idParam, validate, ctrl.unenroll);

router.post('/:id/resources', idParam, resourceRules, validate, ctrl.addResource);
router.delete('/:id/resources/:resourceId', idParam, validate, ctrl.removeResource);

export default router;
