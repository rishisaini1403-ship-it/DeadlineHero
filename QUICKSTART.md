# 🚀 Quick Start Guide - DeadlineHero

## Prerequisites Checklist
- [ ] Node.js v18+ installed
- [ ] MongoDB installed locally OR MongoDB Atlas account
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/Command Prompt access

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies

Open TWO terminals:

**Terminal 1 (Backend):**
```powershell
cd "c:\Users\PC\Desktop\hackathon project\deadlinehero\backend"
npm install
```

**Terminal 2 (Frontend):**
```powershell
cd "c:\Users\PC\Desktop\hackathon project\deadlinehero\frontend"
npm install
```

### Step 2: Configure Environment Variables

**Backend (.env):**
```powershell
cd backend
copy .env.example .env
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/deadlinehero
JWT_SECRET=my-super-secret-key-12345
RESEND_API_KEY=re_get-from-resend-com
```

**Frontend (.env):**
```powershell
cd ../frontend
copy .env.example .env
```

Frontend `.env` is already configured with default values.

### Step 3: Start MongoDB

**Option A - Local MongoDB:**
```powershell
# Windows (if MongoDB is installed as service)
net start MongoDB

# Or start manually
mongod
```

**Option B - MongoDB Atlas (Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update MONGODB_URI in backend/.env

### Step 4: Run the Application

**Terminal 1 (Backend):**
```powershell
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🦸 DeadlineHero Server
📡 Server running on port 5000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms
➜  Local:   http://localhost:5173/
```

### Step 5: Open in Browser

Visit: **http://localhost:5173**

1. Click "Sign up"
2. Create an account
3. Start adding tasks!

## 🧪 Test the Application

1. **Register**: Create a new account
2. **Login**: Sign in with your credentials
3. **Dashboard**: View your stats
4. **Tasks**: Create a new task with a deadline
5. **Check Email**: If Resend is configured, you'll get reminders

## 📝 Get Resend API Key (Optional - for email features)

1. Go to https://resend.com
2. Sign up for free account
3. Go to API Keys
4. Copy your API key
5. Add to `backend/.env`: `RESEND_API_KEY=re_your-key-here`

**Free tier**: 100 emails/day, 3,000 emails/month

## 🔧 Common Issues

### "Cannot find module" errors
```powershell
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

### MongoDB connection failed
- Check MongoDB is running: `net start MongoDB`
- Verify MONGODB_URI in .env
- For Atlas: check IP whitelist includes your IP

### Port already in use
```powershell
# Kill process on port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Frontend can't connect to backend
- Check backend is running on port 5000
- Verify VITE_API_URL=http://localhost:5000/api in frontend/.env
- Check browser console for CORS errors

## 📦 Build for Production

**Backend:**
```powershell
cd backend
npm run build
npm start
```

**Frontend:**
```powershell
cd frontend
npm run build
# Preview production build
npm run preview
```

## 🎯 Next Steps

After getting the app running:

1. **Explore Features**: Try creating tasks, setting deadlines
2. **Customize**: Modify colors in tailwind.config.js
3. **Add Features**: Enhance the stub pages (Calendar, Analytics)
4. **Deploy**: Follow deployment guide in README.md

## 📚 Project Files Overview

### Key Backend Files
- `backend/src/models/` - Database schemas
- `backend/src/controllers/` - API logic
- `backend/src/services/ai.service.ts` - AI prioritization
- `backend/src/services/email.service.ts` - Email sending
- `backend/src/index.ts` - Server entry point

### Key Frontend Files
- `frontend/src/pages/` - Route pages
- `frontend/src/context/AuthContext.tsx` - Auth state
- `frontend/src/services/` - API calls
- `frontend/src/App.tsx` - Routing setup
- `frontend/src/index.css` - Tailwind styles

## 💡 Tips

- **Development**: Use `npm run dev` for hot reload
- **Database**: Use MongoDB Compass for visual DB management
- **API Testing**: Use Postman or Thunder Client to test endpoints
- **Debugging**: Check browser console and terminal logs

## 🆘 Need Help?

1. Check the main README.md
2. Review error messages in terminal
3. Check browser DevTools console
4. Verify all environment variables are set

---

**Happy coding! 🎉**
