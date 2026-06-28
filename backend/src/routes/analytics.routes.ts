import express from 'express';
import { getAnalytics, getWeeklyProgress } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/', getAnalytics);
router.get('/weekly-progress', async (req, res) => {
  res.json({
    success: true,
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [2, 3, 1, 4, 2, 5, 3]
  });
});

export default router;
