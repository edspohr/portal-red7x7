import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';

const router = Router();

router.get('/', authenticate, listAnnouncements);
router.post('/', authenticate, authorize('ADMIN'), [body('content').notEmpty()], createAnnouncement);
router.put('/:id', authenticate, authorize('ADMIN'), updateAnnouncement);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteAnnouncement);

export default router;
