# 🔐 Environment Variables for Render

Copy these into your Render Web Service environment variables section.

## Required Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database (Get from Render PostgreSQL Internal URL)
DATABASE_URL=postgresql://user:password@hostname.region.render.com/database_name

# JWT Authentication (Generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_DIFFERENT_GENERATED_SECRET_HERE

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## Optional Variables (Google Calendar Integration)

```bash
# Google OAuth (If using calendar integration)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/api/auth/google/callback
```

---

## 📋 Setup Checklist

- [ ] Create PostgreSQL database on Render
- [ ] Run `schema.sql` against the database
- [ ] Copy Internal Database URL to `DATABASE_URL`
- [ ] Generate `JWT_SECRET` with `openssl rand -base64 32`
- [ ] Generate `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- [ ] Add all variables to Render Web Service
- [ ] Deploy and test: `https://your-app.onrender.com/api/health`

---

## 🔧 Generate JWT Secrets

Run these commands to generate secure random secrets:

```bash
# JWT Secret
openssl rand -base64 32

# JWT Refresh Secret (run again for different value)
openssl rand -base64 32
```

---

## 🌐 After Deployment

Update your mobile app's `.env`:

```bash
API_BASE_URL=https://day-tracker-api.onrender.com/api
NODE_ENV=production
```

Then rebuild the mobile app to connect to your live backend!
