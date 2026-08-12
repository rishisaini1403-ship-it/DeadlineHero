import express from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../utils/validators';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/password', protect, validate(changePasswordSchema), changePassword);

export default router;
