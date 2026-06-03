import { Router } from 'express';
import * as ctrl from '../controllers/material.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { uploadMaterial } from '../middleware/upload.js';
import validate from '../middleware/validate.js';
import { materialCreateRules, idParam } from '../validators/index.js';

const router = Router();

router.use(protect);

router.get('/', ctrl.listMaterials);
router.get('/:id', idParam, validate, ctrl.getMaterial);

// Only students & teachers upload/own materials.
router.post(
  '/',
  authorize('student', 'teacher'),
  uploadMaterial,
  materialCreateRules,
  validate,
  ctrl.uploadMaterial
);
router.put('/:id', idParam, validate, ctrl.updateMaterial);
router.delete('/:id', idParam, validate, ctrl.deleteMaterial);

export default router;
