import express from 'express';
import {
  calculateRisk,
  generateDailyPlan,
  breakdownTask,
  getNextAction,
  checkBurnout,
  simulateDeadlineChange,
  generateWeeklyReport,
  activateEmergencyMode,
  chatWithAI,
} from '../controllers/ai.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Risk Predictor
router.post('/risk-predictor', calculateRisk);

// Daily Planner
router.post('/daily-plan', generateDailyPlan);

// Task Breakdown
router.post('/breakdown-task', breakdownTask);

// Next Action Recommendation
router.get('/next-action', getNextAction);

// Burnout Detection
router.get('/burnout-check', checkBurnout);

// Deadline Simulator
router.post('/deadline-simulator', simulateDeadlineChange);

// Weekly Report
router.get('/weekly-report', generateWeeklyReport);

// Emergency Mode
router.post('/emergency-mode', activateEmergencyMode);

// AI Chat Assistant
router.post('/chat', chatWithAI);

export default router;
