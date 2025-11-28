# Day Tracker - Setup Guide

## ✅ Installation Complete

### Backend
- ✅ Dependencies installed successfully
- ✅ All packages up to date (Express 4.21, PostgreSQL 8.13, Helmet 8.0)

### Mobile
- ✅ Dependencies installing with `--legacy-peer-deps`
- Added `.npmrc` file to handle React Native peer dependency conflicts

---

## 🚀 Next Steps

### 1. Setup Database

```bash
# Create the database
createdb day_tracker_db

# OR using psql
psql -U postgres
CREATE DATABASE day_tracker_db;
\q

# Run the schema
cd server
psql -U postgres -d day_tracker_db -f database/schema.sql
```

### 2. Start the Backend Server

```bash
cd server
npm run dev
```

Server will start on `http://localhost:5000`

### 3. Configure Mobile App

Update the API URL in `mobile/src/services/api.ts`:

```typescript
// Change this line:
const API_BASE_URL = 'http://localhost:5000/api';

// To your computer's IP address:
const API_BASE_URL = 'http://192.168.1.XXX:5000/api';
```

> **How to find your IP:**
> - Windows: Run `ipconfig` and look for IPv4 Address
> - Mac/Linux: Run `ifconfig` or `ip addr`

### 4. Run the Mobile App

```bash
cd mobile

# For Android
npm run android

# For iOS (Mac only)
npm run ios
```

---

## 🔧 Troubleshooting

### If npm install fails again:
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### If React Native linking issues:
```bash
cd mobile/android
./gradlew clean
cd ..
npx react-native link
```

### If Metro bundler issues:
```bash
cd mobile
npm start -- --reset-cache
```

---

## 📱 Using the App

1. **Register** - Create an account
2. **Create a Goal** - Set title, start date, and duration (e.g., 3650 days for 10 years)
3. **View Progress** - See the 3D bin visualization fill with colored blocks
4. **Add Daily Logs** - Log notes, activities, good things, and future plans
5. **Track Everything** - View calendar and progress stats

---

## 🎨 Features Ready to Use

✅ Offline-first (works without internet)
✅ 3D glassmorphic bin visualization
✅ Multiple goal tracking
✅ Rich daily logging
✅ Calendar view
✅ Progress tracking
✅ Auto-sync when online

---

## 📝 Notes

- The app works offline and will sync when you have internet
- Photos and attachments are supported
- Future plans are ready for Google Calendar integration (requires OAuth setup)

Enjoy tracking your journey! 🚀
