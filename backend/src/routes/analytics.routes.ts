import express from 'express';
import { getAnalytics, getWeeklyProgress } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/', getAnalytics);
router.get('/weekly', getWeeklyProgress);

export default router;
