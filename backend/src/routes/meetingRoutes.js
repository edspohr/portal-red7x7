import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  summarizeMeeting,
} from '../controllers/meetingController.js';

const router = Router();

router.get('/', authenticate, listMeetings);
router.get('/:id', authenticate, getMeeting);
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [body('title').notEmpty().withMessage('El título es obligatorio')],
  createMeeting,
);
router.put('/:id', authenticate, authorize('ADMIN', 'PRO'), updateMeeting);
router.post('/ai/summarize', authenticate, authorize('ADMIN'), [body('notes').notEmpty()], summarizeMeeting);

export default router;
