# Environment Configuration Guide

## Overview
This file documents environment-specific configuration for the Day Tracker application.

## Local Development (.env)

The `.env` file in the `server` directory is configured for **local development**:

```bash
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

This is **correct for local development** where the server runs on `http://localhost:5000`.

## Production (Render)

For production deployment on Render, you **must** set different environment variables.

### GOOGLE_REDIRECT_URI Configuration

| Environment | Value |
|------------|-------|
| **Local Development** | `http://localhost:5000/auth/google/callback` |
| **Production (Render)** | `https://day-tracker-93ly.onrender.com/api/auth/google/callback` |

### How to Update on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your `day-tracker-api` service
3. Navigate to the **Environment** tab
4. Find or add `GOOGLE_REDIRECT_URI`
5. Set value to: `https://day-tracker-93ly.onrender.com/api/auth/google/callback`
6. Save and redeploy

### Why the Difference?

- **Local:** Your server runs at `http://localhost:5000`, no `/api` prefix
- **Production:** Render serves your app at `https://day-tracker-93ly.onrender.com` with `/api` routing

## Complete Production Configuration

See [`RENDER_ENV_VARS.md`](./RENDER_ENV_VARS.md) for the complete list of environment variables needed on Render, including:
- DATABASE_URL (Neon database connection)
- JWT secrets
- Google OAuth credentials with **production redirect URI**

## Important Notes

⚠️ **Never commit** actual secrets to git - they should only exist in:
- Local `.env` file (gitignored)
- Render environment variables dashboard

✅ **The current local `.env` is correct** - no changes needed for local development

❌ **Production requires different GOOGLE_REDIRECT_URI** - must be set in Render dashboard
