# Day Tracker API Server

Backend server for the Day Tracker mobile application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create database:
```bash
psql -U postgres
CREATE DATABASE day_tracker_db;
\q
```

3. Run database schema:
```bash
psql -U postgres -d day_tracker_db -f database/schema.sql
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Goals
- `GET /api/goals` - Get all goals
- `GET /api/goals/:id` - Get single goal
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `PATCH /api/goals/:id/toggle` - Toggle goal active status

### Daily Logs
- `GET /api/daily-logs/goal/:goalId` - Get all logs for a goal
- `GET /api/daily-logs/:id` - Get single log
- `POST /api/daily-logs` - Create daily log
- `POST /api/daily-logs/:id/upload` - Upload attachment
- `DELETE /api/daily-logs/:id` - Delete log

### Sync
- `POST /api/sync/sync` - Batch sync from mobile
- `GET /api/sync/status` - Get sync status

## Tech Stack

- Express.js
- PostgreSQL
- JWT Authentication
- Multer (File uploads)
- Bcrypt (Password hashing)
