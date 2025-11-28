# Day Tracker Server - Render Deployment Guide

## 🚀 Quick Deploy to Render

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `day-tracker-db`
   - **Database**: `day_tracker_db`
   - **User**: `day_tracker_user` (or auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: Free (or appropriate tier)
4. Click **Create Database**
5. **Copy the Internal Database URL** (it will look like `postgresql://user:pass@hostname/database`)

### Step 2: Run Database Schema

After the database is created:

1. Go to your database on Render
2. Click **Connect** → Copy the **PSQL Command**
3. Run locally:
   ```bash
   psql <PASTE_CONNECTION_STRING_HERE> -f server/database/schema.sql
   ```

### Step 3: Create Web Service

1. Click **New +** → **Web Service**
2. **Connect your GitHub repository**: `Knowledge-Benjamin/Day-tracker`
3. Configure:
   - **Name**: `day-tracker-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or appropriate tier)

### Step 4: Add Environment Variables

In the **Environment** section, add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | Render will override this |
| `DATABASE_URL` | `<Your Internal Database URL>` | From Step 1 |
| `JWT_SECRET` | `<Generate random string>` | Use: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | `<Generate random string>` | Different from JWT_SECRET |
| `UPLOAD_DIR` | `./uploads` | |
| `MAX_FILE_SIZE` | `10485760` | 10MB in bytes |
| `GOOGLE_CLIENT_ID` | `<Your Google Client ID>` | Optional - for calendar |
| `GOOGLE_CLIENT_SECRET` | `<Your Google Secret>` | Optional - for calendar |
| `GOOGLE_REDIRECT_URI` | `https://your-app.onrender.com/api/auth/google/callback` | Optional |

### Step 5: Deploy

1. Click **Create Web Service**
2. Render will automatically deploy from your GitHub repo
3. Wait for build to complete (~2-5 minutes)
4. Your API will be live at: `https://day-tracker-api.onrender.com`

---

## 📱 Update Mobile App

After deployment, update your mobile app's `.env`:

```bash
API_BASE_URL=https://day-tracker-api.onrender.com/api
```

Then rebuild your mobile app.

---

## 🔒 Security Best Practices

1. **JWT Secrets**: Generate strong random strings
   ```bash
   # Generate strong secrets
   openssl rand -base64 32
   ```

2. **Database**: Use Render's internal connection string (faster and more secure)

3. **Environment Variables**: Never commit `.env` to git (already in `.gitignore`)

4. **File Uploads**: For production, consider upgrading to cloud storage (AWS S3, Google Cloud Storage)

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure `package.json` in `server/` directory is correct
- Verify Node version compatibility

### Database Connection Issues
- Ensure `DATABASE_URL` is the **Internal Database URL**
- Check database is in same region as web service
- Verify schema was applied correctly

### App Crashes on Start
- Check environment variables are set correctly
- View logs in Render dashboard
- Ensure `PORT` is not hardcoded (Render overrides it)

---

## 📊 Monitoring

- **Logs**: View in Render Dashboard → Your Service → Logs
- **Metrics**: Dashboard shows CPU, memory, and request metrics
- **Health Check**: Render pings `GET /` endpoint

---

## 💰 Cost Estimates

**Free Tier:**
- Web Service: Free (spins down after 15 min inactivity)
- PostgreSQL: Free (limited to 1GB storage)

**Paid Tier (Recommended for production):**
- Web Service: $7/month (always on)
- PostgreSQL: $7/month (1GB) to $20/month (10GB)

---

## 🔄 Auto-Deploy from GitHub

Render automatically deploys when you push to the `main` branch. To disable:
1. Go to your service settings
2. Under **Auto-Deploy**, toggle off

---

## 📝 Notes

- Free tier databases sleep after 30 days of inactivity
- Free tier web services spin down after 15 minutes of inactivity (first request takes ~30s)
- Use paid tier for production apps with consistent traffic
- File uploads are stored in ephemeral storage (lost on redeploy) - use cloud storage for production

---

**Your backend is now live! 🎉**

Test it: `https://day-tracker-api.onrender.com/api/health`
