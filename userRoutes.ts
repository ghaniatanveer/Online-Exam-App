import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', userController.getUsers);
router.patch('/:id/status', userController.updateUserStatus);

export default router;
