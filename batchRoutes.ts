import { Router } from 'express';
import * as batchController from '../controllers/batchController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { batchSchema } from '../utils/validators.js';

const router = Router();

router.use(authenticate);

router.get('/', batchController.getBatches);
router.get('/:id', batchController.getBatch);
router.post(
  '/',
  authorize('instructor', 'admin'),
  validateBody(batchSchema),
  batchController.createBatch
);
router.patch(
  '/:id',
  authorize('instructor', 'admin'),
  batchController.updateBatch
);

export default router;
