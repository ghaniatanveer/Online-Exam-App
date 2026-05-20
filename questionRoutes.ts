import { Router } from 'express';
import * as questionController from '../controllers/questionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { questionSchema, bulkQuestionsSchema } from '../utils/validators.js';

const router = Router();

router.use(authenticate);

router.get('/meta', questionController.getQuestionMeta);
router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestion);

router.post(
  '/',
  authorize('instructor', 'admin'),
  validateBody(questionSchema),
  questionController.createQuestion
);
router.post(
  '/bulk',
  authorize('instructor', 'admin'),
  validateBody(bulkQuestionsSchema),
  questionController.bulkCreateQuestions
);
router.patch(
  '/:id',
  authorize('instructor', 'admin'),
  validateBody(questionSchema.partial()),
  questionController.updateQuestion
);
router.delete('/:id', authorize('instructor', 'admin'), questionController.deleteQuestion);

export default router;
