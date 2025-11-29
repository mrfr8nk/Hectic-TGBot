# Render Deployment Guide for Telegram Bot API Server

This guide will help you deploy the Local Telegram Bot API Server on Render to enable 2GB file uploads.

## Step 1: Prepare Your GitHub Repository

1. Push your bot code to GitHub (if not already done)
2. Make sure `.git` folder exists locally with all files committed

## Step 2: Create Render Service for Local API Server

1. Go to [render.com](https://render.com)
2. Sign up/Login with your GitHub account
3. Click **"New +"** → **"Web Service"**
4. Select your GitHub repository with the bot code
5. Configure:
   - **Name:** `telegram-bot-api-server` (or any name)
   - **Runtime:** `Docker`
   - **Build Command:** (leave empty)
   - **Start Command:** (leave empty - Dockerfile handles it)
   - **Instance Type:** `Free`

6. **Environment Variables** - Add these:
   - `TELEGRAM_API_ID`: Get from [my.telegram.org](https://my.telegram.org)
   - `TELEGRAM_API_HASH`: Get from [my.telegram.org](https://my.telegram.org)

7. Click **"Create Web Service"**

## Step 3: Get Your Telegram API Credentials

1. Visit https://my.telegram.org
2. Log in with your phone number
3. Click **"API Development Tools"**
4. Fill the form to create an app
5. You'll get `api_id` and `api_hash` - copy these values

## Step 4: Add Environment Variables to Render

1. Go to your Render service dashboard
2. Click **"Environment"** in the left sidebar
3. Add:
   - `TELEGRAM_API_ID` = (your api_id from my.telegram.org)
   - `TELEGRAM_API_HASH` = (your api_hash from my.telegram.org)
4. Click **"Save"**

## Step 5: Wait for Deployment

- Render will start building your Dockerfile
- Initial build takes **10-15 minutes** (compiling from source)
- Subsequent deployments are faster
- Once done, you'll see a URL like: `https://telegram-bot-api-server.onrender.com`

## Step 6: Update Your Bot on Replit

1. Go to your Replit project
2. In Secrets (top left), add:
   - `TELEGRAM_BOT_API_SERVER` = `https://telegram-bot-api-server.onrender.com`
   (Replace with your actual Render URL)

3. Or in your `.env` file:
```
TELEGRAM_BOT_API_SERVER=https://your-service-name.onrender.com
```

## Step 7: Test the Connection

Your bot will automatically use the local API server. You should see in bot logs:
```
🌐 Using Local Telegram Bot API Server: https://your-service-name.onrender.com
```

## Step 8: First Time Bot Setup

When you switch to the local API server, you need to:

1. Run this command to log out from the official API:
```bash
curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/logOut
```

2. Restart your Replit bot

3. The bot will now use the local server

## Important Notes

- **Free Tier Limits:** Render's free tier spins down after 15 minutes of inactivity
- **Keep-Alive:** You may want to ping the server every 10 minutes to keep it alive
- **Build Time:** First deployment takes 10-15 minutes due to compilation
- **File Size:** Now supports up to **2GB file uploads** directly to Telegram!

## Troubleshooting

**Server not responding:**
- Check Render dashboard for build/runtime errors
- Verify environment variables are set correctly
- Check Telegram API ID/Hash are correct

**Bot still using old API:**
- Restart the Replit bot
- Verify `TELEGRAM_BOT_API_SERVER` environment variable is set
- Check bot logs for the 🌐 indicator

**Compilation errors in Render:**
- Usually due to missing dependencies in Dockerfile
- Check Render build logs for details
- Restart the deployment

## What's Included

- ✅ Docker-based build
- ✅ Automatic local mode enabled (`--local` flag)
- ✅ 2GB file upload support
- ✅ HTTP webhook support
- ✅ Direct file path support

## Next Steps

After deployment, your bot will:
- Upload files up to **2GB** without size limits
- Download files of any size
- Support HTTP webhooks with custom IPs/ports
- Have direct access to local file paths

Enjoy unlimited file transfers! 🚀
