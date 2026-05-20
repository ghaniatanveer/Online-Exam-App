import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);
router.get('/instructor', authorize('instructor'), dashboardController.getInstructorDashboard);
router.get('/student', authorize('student'), dashboardController.getStudentDashboard);

export default router;
