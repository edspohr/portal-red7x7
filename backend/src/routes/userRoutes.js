import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { listDirectory, createUser, updateProfile, updateRole } from '../controllers/userController.js';

const router = Router();

router.get('/directory', authenticate, listDirectory);
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('company').optional().isString(),
    body('position').optional().isString(),
    body('phone').optional().isString(),
    body('role').optional().isIn(['MEMBER', 'PRO', 'ADMIN']),
    body('membership').optional().isIn(['SOCIO7X7', 'PRO']),
  ],
  createUser,
);
router.put(
  '/me',
  authenticate,
  [
    body('name').notEmpty(),
    body('company').optional().isString(),
    body('position').optional().isString(),
    body('phone').optional().isString(),
  ],
  updateProfile,
);
router.patch(
  '/:id/role',
  authenticate,
  authorize('ADMIN'),
  [body('role').isIn(['MEMBER', 'PRO', 'ADMIN']), body('membership').isIn(['SOCIO7X7', 'PRO'])],
  updateRole,
);

export default router;
