const express = require('express');
const { generateSchedule, prioritizeTasks } = require('../controllers/schedule.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(protect);

router.post('/generate', generateSchedule);
router.post('/prioritize', prioritizeTasks);
module.exports = router;
