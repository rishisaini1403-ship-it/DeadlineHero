import express from 'express';
import {
  createDeadline,
  getDeadlines,
  updateDeadline,
  deleteDeadline,
} from '../controllers/deadline.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import { deadlineSchema } from '../utils/validators';

const router = express.Router();

router.use(protect);

router.post('/', validate(deadlineSchema), createDeadline);
router.get('/', getDeadlines);
router.put('/:id', updateDeadline);
router.delete('/:id', deleteDeadline);

export default router;
