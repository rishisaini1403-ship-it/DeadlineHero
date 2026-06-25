import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDatabase from './config/database';
import { initializeEmail } from './config/email';
import { errorHandler, notFound } from './middleware/error.middleware';
import { notificationService } from './services/notification.service';

// Import routes
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import deadlineRoutes from './routes/deadline.routes';
import scheduleRoutes from './routes/schedule.routes';
import analyticsRoutes from './routes/analytics.routes';
import dashboardRoutes from "./routes/dashboard.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDatabase();

// Initialize email service
initializeEmail();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'DeadlineHero API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start notification services
notificationService.start();

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`🦸 DeadlineHero Server`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🚀 ========================================\n`);
});

export default app;
