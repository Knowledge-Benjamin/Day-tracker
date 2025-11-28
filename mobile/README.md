# Day Tracker - React Native App

A full-stack day tracker application for Android with offline-first architecture, 3D visualizations, and glassmorphic design.

## Features

- 📱 **Multiple Goal Tracking**: Track unlimited long-term goals with custom durations
- 📝 **Rich Daily Logging**: Notes, activities, good things, future plans with photos
- 🎨 **3D Bin Visualization**: Beautiful glassmorphic bin that fills with colored blocks
- 📅 **Calendar View**: Visual calendar showing all logged days
- 🔄 **Offline-First**: Works completely offline, syncs when online
- 🎯 **Progress Tracking**: Countdown and count-up displays with statistics
- 🌑 **Minimalist Design**: Black & white glassmorphic iPhone-style UI

## Tech Stack

- **Frontend**: React Native 0.76.5 with TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **Navigation**: React Navigation v7
- **3D Graphics**: React Three Fiber
- **Offline Storage**: AsyncStorage + Redux Persist
- **Styling**: Glassmorphic design with Linear Gradients & Blur

## Setup

### Prerequisites
- Node.js >= 20
- React Native development environment
- Android Studio (for Android)
- PostgreSQL database running

### Installation

1. **Install dependencies**:
```bash
cd mobile
npm install
```

2. **Configure API endpoint**:
Edit `src/services/api.ts` and set your server URL:
```typescript
const API_BASE_URL = 'http://YOUR_SERVER_IP:5000/api';
```

3. **Run on Android**:
```bash
# Start Metro bundler
npm start

# In another terminal
npm run android
```

### Linking Native Modules

For some native features, you may need to:

```bash
cd android
./gradlew clean

cd ..
npx react-native link
```

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── BinVisualization.tsx  # 3D bin visualization
│   │   ├── GlassCard.tsx
│   │   ├── GlassButton.tsx
│   │   └── GlassInput.tsx
│   ├── screens/         # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── GoalsListScreen.tsx
│   │   ├── CreateGoalScreen.tsx
│   │   ├── GoalDetailScreen.tsx
│   │   ├── DailyLogScreen.tsx
│   │   └── CalendarScreen.tsx
│   ├── store/           # Redux state management
│   │   ├── slices/
│   │   └── index.ts
│   ├── services/        # API and sync services
│   │   ├── api.ts
│   │   └── syncService.ts
│   └── theme/           # Design system
│       └── theme.ts
├── App.tsx
└── package.json
```

## Usage

1. **Register/Login**: Create an account or login
2. **Create a Goal**: Set title, description, start date, and duration
3. **View Progress**: See 3D bin visualization fill with colored blocks
4. **Log Daily**: Add notes, activities, good things, and future plans
5. **Track Progress**: View statistics and calendar

## Offline Functionality

The app works completely offline:
- All data is stored locally using Redux Persist
- Changes are queued for sync
- Automatic sync when internet is available
- Network status indicator shows sync progress

## Google Calendar Integration

To enable Google Calendar integration for future plans:
1. Set up OAuth in Google Cloud Console
2. Add credentials to `.env`
3. Enable Google Calendar API

## License

MIT
