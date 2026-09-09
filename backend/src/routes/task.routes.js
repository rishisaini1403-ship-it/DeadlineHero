const express = require('express');
const { createTask, getTasks, getTask, updateTask, deleteTask, getRecommendedTasks,  } = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator.middleware');
const { taskSchema } = require('../utils/validators');
const router = express.Router();

router.use(protect); // All routes require authentication

router.post('/', validate(taskSchema), createTask);
router.get('/', getTasks);
router.get('/recommended', getRecommendedTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
module.exports = router;
