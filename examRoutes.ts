import { Router } from 'express';
import * as examController from '../controllers/examController.js';
import * as attemptController from '../controllers/attemptController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { examSchema, saveAnswerSchema, manualGradeSchema } from '../utils/validators.js';

const router = Router();

router.use(authenticate);

router.get('/student/my-exams', authorize('student'), examController.getStudentExams);
router.get('/', examController.getExams);
router.get('/:id', examController.getExam);

router.post(
  '/',
  authorize('instructor', 'admin'),
  validateBody(examSchema),
  examController.createExam
);
router.patch('/:id', authorize('instructor', 'admin'), examController.updateExam);
router.delete('/:id', authorize('instructor', 'admin'), examController.deleteExam);

// Attempt routes
router.post('/:examId/start', authorize('student'), attemptController.startAttempt);
router.post(
  '/:examId/answer',
  authorize('student'),
  validateBody(saveAnswerSchema),
  attemptController.saveAnswer
);
router.post('/:examId/tab-switch', authorize('student'), attemptController.reportTabSwitch);
router.post('/:examId/submit', authorize('student'), attemptController.submitAttempt);
router.get('/:examId/attempts', authorize('instructor', 'admin'), attemptController.getExamAttempts);

export default router;
