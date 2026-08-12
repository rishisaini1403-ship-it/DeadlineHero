import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow(''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'archived').default('pending'),
  category: Joi.string().trim().default('general'),
  estimatedHours: Joi.number().min(0).default(0),
  dueDate: Joi.date().required(),
  tags: Joi.array().items(Joi.string()).default([]),
});

export const deadlineSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow(''),
  dueDate: Joi.date().required(),
  relatedTasks: Joi.array().items(Joi.string()).default([]),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  avatar: Joi.string()
    .allow('')
    .max(4000000)
    .pattern(/^data:image\/(png|jpe?g|gif|webp);base64,/),
  preferences: Joi.object({
    emailNotifications: Joi.boolean(),
    reminderTime: Joi.number().min(1).max(168),
    theme: Joi.string().valid('light', 'dark'),
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
});
