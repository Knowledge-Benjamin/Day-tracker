# Day Tracker - Full Stack Application

## 🎯 Overview

A comprehensive **offline-first** day tracker application for tracking long-term goals (like 10-year journeys) with:
- ✨ **Stunning 3D Visualizations** - Glassmorphic bin that fills with colored blocks
- 📱 **Full Stack** - React Native mobile + Node.js/Express backend
- 🔄 **Offline-First** - Works completely offline, syncs when online
- 🎨 **Minimalist Design** - Black & white glassmorphic iPhone-style UI

---

## 📸 Features

### Backend (Node.js/Express/PostgreSQL)
- REST API with JWT authentication
- File uploads (photos/attachments)
- Offline sync endpoints
- Rate limiting & security

### Mobile App (React Native)
- Multiple goal tracking with custom dates
- Rich daily logging (notes, activities, photos, good things, future plans)
- **3D glassmorphic bin visualization** (blocks shrink as bin fills)
- Calendar view showing logged days
- Offline-first with automatic sync
- Progress tracking (countdown/count-up)

---

## 🚀 Quick Start

### 1. Database Setup
```bash
# Create database
createdb day_tracker_db

# OR using psql
psql -U postgres
CREATE DATABASE day_tracker_db;
\q

# Run schema
psql -U postgres -d day_tracker_db -f server/database/schema.sql
```

### 2. Backend Server
```bash
cd server
npm install

# Configure .env (copy from .env.example and update DATABASE_URL)
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Mobile App
```bash
cd mobile
npm install

# Update API URL in src/services/api.ts
# Change: const API_BASE_URL = 'http://YOUR_IP:5000/api';

# For Android
npm run android

# For iOS
npm run ios
```

---

## 📁 Project Structure
```
Day-Tracker/
├── server/              # Backend API
│   ├── database/        # PostgreSQL schema
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   └── uploads/         # File storage
└── mobile/              # React Native app
    └── src/
        ├── components/  # UI components (Glass design)
        ├── screens/     # App screens
        ├── store/       # Redux state
        ├── services/    # API & sync
        └── theme/       # Design system
```

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Mobile** | React Native 0.76.5, TypeScript, Redux Toolkit |
| **Backend** | Node.js, Express 4.21, PostgreSQL 8.13 |
| **Auth** | JWT, bcrypt |
| **3D** | React Three Fiber |
| **Offline** | Redux Persist, AsyncStorage |
| **Design** | Glassmorphism, Linear Gradients |

---

## 📝 Environment Variables

### Server `.env`
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/day_tracker_db
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/goals` | Get all goals |
| POST | `/api/goals` | Create goal |
| GET | `/api/daily-logs/goal/:id` | Get logs for goal |
| POST | `/api/daily-logs` | Create daily log |
| POST | `/api/sync/sync` | Batch sync |

See `server/README.md` for full API docs.

---

## 🎨 Design Philosophy

**Minimalist Glassmorphic** - Inspired by modern iPhone UI:
- Black & white color palette with accent grays
- Glass-like cards with blur effects
- Smooth animations and transitions
- Clean, spacious layouts

---

## 🌟 Google Calendar Integration (Optional)

To enable future plans sync with Google Calendar:

1. Create OAuth credentials in Google Cloud Console (Project: `day-tracker-479521`)
2. Add to server `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_secret
   ```
3. Uncomment Google Calendar code in `syncService.ts`

---

## 📱 Screenshots

> **3D Bin Visualization**: Colored blocks fill a glassmorphic bin as you log days
> **Progress Tracking**: Count-up (days elapsed) and count-down (days remaining)
> **Calendar View**: Visual calendar with marked logged days

---

## 📄 License

MIT

## 👤 Author

Built for tracking **3650-day (10-year) journeys** and beyond! 🚀

---

**Happy Tracking! 🎯**
