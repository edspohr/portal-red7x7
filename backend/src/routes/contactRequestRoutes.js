import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authMiddleware.js';
import { listRequests, createRequest, updateRequestStatus } from '../controllers/contactRequestController.js';

const router = Router();

router.get('/', authenticate, listRequests);
router.post('/', authenticate, [body('targetId').isInt()], createRequest);
router.patch('/:id/status', authenticate, [body('status').isIn(['PENDING', 'APPROVED', 'REJECTED'])], updateRequestStatus);

export default router;
