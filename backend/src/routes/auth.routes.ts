import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validators';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);

export default router;
