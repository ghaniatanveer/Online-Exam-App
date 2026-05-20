import { Router } from 'express';
import * as attemptController from '../controllers/attemptController.js';
import * as resultController from '../controllers/resultController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { manualGradeSchema } from '../utils/validators.js';

const router = Router();

router.use(authenticate);

router.get('/my', authorize('student'), attemptController.getMyAttempts);
router.get('/:attemptId', attemptController.getAttempt);
router.patch(
  '/:attemptId/grade',
  authorize('instructor', 'admin'),
  validateBody(manualGradeSchema),
  attemptController.manualGrade
);
router.get('/:attemptId/pdf', resultController.downloadGradeSheet);

export default router;
