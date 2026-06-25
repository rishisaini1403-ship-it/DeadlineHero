import express from 'express';
import { generateSchedule, prioritizeTasks } from '../controllers/schedule.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/generate', generateSchedule);
router.post('/prioritize', prioritizeTasks);

export default router;
