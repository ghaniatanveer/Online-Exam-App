import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validators.js';
import { z } from 'zod';

const router = Router();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.patch('/profile', authenticate, validateBody(updateProfileSchema), authController.updateProfile);
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
