# Render Configuration for Calos AI

## Update Build Command on Render

Go to your Calos AI service on Render and update:

**Build Command:**
```bash
npm install && npm run migrate
```

This will:
1. Install dependencies
2. **Automatically run database migration** (creates 4 AI tables)

---

## Current Render Settings

**Service:** calos-ai  
**URL:** https://calos-ai.onrender.com

### Commands

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run migrate` |
| **Start Command** | `npm run dev` |

### Environment Variables Required

```bash
# Server
PORT=3002
NODE_ENV=production

# Database (Shared with Day Tracker - Neon)
DATABASE_URL=<YOUR_DATABASE_URL>

# JWT (MUST MATCH Day Tracker)
JWT_SECRET=<COPY_FROM_DAY_TRACKER_RENDER>
JWT_REFRESH_SECRET=<COPY_FROM_DAY_TRACKER_RENDER>

# Gemini AI
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-2.5-flash-preview-09-2025

# Google Cloud (for Voice)
GOOGLE_CLOUD_PROJECT_ID=<YOUR_PROJECT_ID>

# Day Tracker API
DAY_TRACKER_API_URL=https://day-tracker-93ly.onrender.com/api

# CORS
CORS_ORIGIN=*

# File Upload
MAX_AUDIO_SIZE=10485760
UPLOAD_DIR=./uploads
```

---

## How It Works

When you deploy/redeploy Calos AI on Render:

1. **Build phase:** `npm install && npm run migrate`
   - Installs packages
   - Runs `src/scripts/applyMigration.ts`
   - Creates tables: `ai_conversations`, `ai_context`, `ai_pending_actions`, `ai_external_sync`
   - Migration is **idempotent** (safe to run multiple times)

2. **Start phase:** `npm run dev`
   - Starts Express server with `ts-node-dev`

---

## Updating Render Now

**Steps:**

1. Go to https://dashboard.render.com/
2. Select **calos-ai** service
3. Click **Settings** tab
4. Scroll to **Build & Deploy**
5. Update **Build Command** to: `npm install && npm run migrate`
6. Click **Save Changes**
7. Go to **Manual Deploy** → **Deploy latest commit**

The migration will run automatically!

---

## Verification

After deployment, check logs for:
```
✅ Database migration completed successfully
```

Or manually verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'ai_%';
```

Should return:
- ai_context
- ai_conversations  
- ai_external_sync
- ai_pending_actions

---

## Next: Mobile App Integration

Once migration runs successfully:
1. ✅ Calos deployed
2. ✅ DB tables created
3. ➡️ Start Phase 2: Install mobile dependencies
