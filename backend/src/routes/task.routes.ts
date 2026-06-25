import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getRecommendedTasks,
} from '../controllers/task.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import { taskSchema } from '../utils/validators';

const router = express.Router();

router.use(protect); // All routes require authentication

router.post('/', validate(taskSchema), createTask);
router.get('/', getTasks);
router.get('/recommended', getRecommendedTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
