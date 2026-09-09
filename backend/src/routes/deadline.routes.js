const express = require('express');
const { createDeadline, getDeadlines, updateDeadline, deleteDeadline,  } = require('../controllers/deadline.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator.middleware');
const { deadlineSchema } = require('../utils/validators');
const router = express.Router();

router.use(protect);

router.post('/', validate(deadlineSchema), createDeadline);
router.get('/', getDeadlines);
router.put('/:id', updateDeadline);
router.delete('/:id', deleteDeadline);
module.exports = router;
