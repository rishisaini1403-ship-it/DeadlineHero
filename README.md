# 🦸 DeadlineHero - AI-Powered Student Productivity Platform

A full-stack MERN web application that helps students manage assignments, deadlines, tasks, and study schedules with AI-powered recommendations.

## ✨ Features

### Core Features
- **Task Management**: Create, update, and track tasks with priority levels
- **Deadline Tracking**: Set deadlines with automated email reminders
- **AI Task Prioritization**: Smart algorithm ranks tasks by urgency, priority, and effort
- **Schedule Generation**: AI creates optimal study schedules
- **Progress Analytics**: Visual charts showing completion rates and productivity trends
- **Email Reminders**: Automated notifications via Resend (24h and 1h before deadlines)

### Gamification
- **Points System**: Earn points for creating and completing tasks
- **Level Progression**: Level up as you accumulate points
- **Streak Tracking**: Maintain daily activity streaks
- **Achievement Badges**: Unlock badges for milestones

### Additional Features
- **Study Templates**: Pre-built templates for common assignment types
- **Calendar Integration**: Visual deadline and task calendar
- **User Authentication**: Secure JWT-based auth with bcrypt
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **Email Service**: Resend
- **Task Scheduling**: node-cron
- **Validation**: Joi

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Notifications**: react-hot-toast
- **State Management**: Context API

## 📁 Project Structure

```
deadlinehero/
├── backend/
│   ├── src/
│   │   ├── config/           # Database & email configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, error, validation
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic (AI, email, gamification)
│   │   ├── utils/            # Helper functions
│   │   └── index.ts          # Express app entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React contexts (Auth, etc.)
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # React entry point
│   │   └── index.css         # Tailwind styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone the Repository

```bash
cd "c:\Users\PC\Desktop\hackathon project\deadlinehero"
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env with your configuration
# - Set MONGODB_URI to your MongoDB connection string
# - Set JWT_SECRET to a secure random string
# - Set RESEND_API_KEY (get from https://resend.com)
```

**Backend .env Configuration:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/deadlinehero
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
RESEND_API_KEY=re_your-api-key-here
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
```

**Frontend .env Configuration:**
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Tasks
- `POST /api/tasks` - Create task (protected)
- `GET /api/tasks` - Get all tasks with filters (protected)
- `GET /api/tasks/recommended` - Get AI-recommended tasks (protected)
- `GET /api/tasks/:id` - Get single task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

### Deadlines
- `POST /api/deadlines` - Create deadline (protected)
- `GET /api/deadlines` - Get deadlines (protected)
- `PUT /api/deadlines/:id` - Update deadline (protected)
- `DELETE /api/deadlines/:id` - Delete deadline (protected)

### Schedule & AI
- `POST /api/schedule/generate` - Generate AI schedule (protected)
- `POST /api/schedule/prioritize` - Prioritize tasks with AI (protected)

### Analytics
- `GET /api/analytics` - Get analytics data (protected)
- `GET /api/analytics/weekly` - Get weekly progress (protected)

## 🎯 Development Roadmap

### Week 1: Backend Core
- ✅ Project setup and configuration
- ✅ Database models and connections
- ✅ Authentication system
- ✅ CRUD controllers and routes
- ⏳ Unit testing

### Week 2: AI & Services
- ✅ AI prioritization algorithm
- ✅ Email notification service
- ✅ Gamification system
- ⏳ Notification scheduling
- ⏳ Integration testing

### Week 3: Frontend Setup
- ✅ React + Vite + TypeScript setup
- ✅ Authentication flow
- ✅ Protected routing
- ⏳ Layout components
- ⏳ Task management UI

### Week 4: Advanced Features
- ⏳ Calendar integration
- ⏳ Analytics dashboard with charts
- ⏳ Study templates
- ⏳ Gamification UI
- ⏳ Responsive design

### Week 5: Polish & Deploy
- ⏳ Error handling improvements
- ⏳ Loading states and animations
- ⏳ Performance optimization
- ⏳ Production build
- ⏳ Deployment (Vercel + Railway/Render)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configured allowed origins
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data protection

## 📊 AI Prioritization Algorithm

The AI calculates a priority score (0-100) based on:

1. **Time Urgency (40 points)**: How close the deadline is
2. **Priority Level (30 points)**: User-assigned priority
3. **Effort Required (20 points)**: Estimated hours
4. **Workload Balance (10 points)**: Current task load

## 🎮 Gamification System

### Points
- Create task: +5 points
- Complete task: +20 points
- Level up: Every 100 points

### Badges
- 🎯 First Steps: Create first task
- ✅ Getting Started: Complete 10 tasks
- 🏆 Task Master: Complete 50 tasks
- 👑 Legend: Complete 100 tasks
- ⭐ Rising Star: Earn 100 points
- 🔥 3-Day Streak: Stay active 3 days
- And more...

## 📧 Email Notifications

Powered by Resend:
- **24-hour reminder**: Sent based on user preference
- **1-hour reminder**: Urgent notification
- **Welcome email**: Sent on registration
- **Customizable**: Users can disable in settings

## 🚢 Production Deployment

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Connect to Vercel
3. Set VITE_API_URL to production backend URL
4. Deploy

### Database (MongoDB Atlas)
1. Create free cluster at mongodb.com/cloud/atlas
2. Get connection string
3. Update MONGODB_URI in backend environment

## 🐛 Troubleshooting

**Backend won't start:**
- Check MongoDB is running
- Verify .env file exists and is configured
- Check port 5000 is available

**Frontend won't start:**
- Run `npm install` in frontend directory
- Check port 5173 is available
- Verify VITE_API_URL in .env

**Email not sending:**
- Verify RESEND_API_KEY is set
- Check Resend account is active
- Review logs for error messages

**Database connection failed:**
- Verify MongoDB is accessible
- Check MONGODB_URI format
- Ensure network access is allowed (Atlas)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - feel free to use this project for learning or production.

## 🙏 Acknowledgments

- Built for hackathon projects and student productivity
- Inspired by the need for better deadline management tools
- AI algorithm designed for practical task prioritization

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check the troubleshooting section
- Review API documentation

---

**Built with ❤️ for students who want to stay on top of their deadlines!**
