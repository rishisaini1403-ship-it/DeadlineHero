import express from 'express';
import { getAnalytics, getWeeklyProgress, getHeatmap } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/', getAnalytics);
router.get('/weekly-progress', getWeeklyProgress);
router.get('/heatmap', getHeatmap);
router.get('/weekly', getWeeklyProgress);

export default router;
