import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authMiddleware.js';
import { register, login, me, requestPasswordReset } from '../controllers/authController.js';

const router = Router();

const emailValidator = body('email').isEmail().withMessage('Email inválido');

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    emailValidator,
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  register,
);

router.post('/login', [emailValidator, body('password').notEmpty()], login);
router.get('/me', authenticate, me);
router.post('/forgot-password', [emailValidator], requestPasswordReset);

export default router;
