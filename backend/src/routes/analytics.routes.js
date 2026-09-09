const express = require('express');
const { getAnalytics, getWeeklyProgress, getHeatmap } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(protect);

router.get('/', getAnalytics);
router.get('/weekly-progress', getWeeklyProgress);
router.get('/heatmap', getHeatmap);
router.get('/weekly', getWeeklyProgress);
module.exports = router;
