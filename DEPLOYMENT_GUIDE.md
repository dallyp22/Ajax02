# 🚀 Deployment Guide: Railway + Vercel

This guide will help you deploy your AI Rent Optimizer to production using Railway (backend) and Vercel (frontend).

## 📋 Prerequisites

- ✅ Google Cloud service account JSON file with BigQuery access
- ✅ GitHub repository with your code
- ✅ Railway account (free tier available)
- ✅ Vercel account (free tier available)

## 🔑 Step 1: Prepare Google Cloud Credentials

### Encode Your Service Account for Railway

```bash
# Run this from your project root
python scripts/encode-credentials.py path/to/your-service-account.json
```

This will output a base64-encoded string. **Copy this** - you'll need it for Railway.

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `BigQuery_6` repository
5. Railway will detect it's a Python app

### 2.2 Configure Environment Variables

In your Railway dashboard, add these environment variables:

```bash
# Required - Google Cloud Authentication
GOOGLE_APPLICATION_CREDENTIALS_BASE64=<paste-your-base64-string-here>

# Required - BigQuery Configuration
BIGQUERY_PROJECT_ID=your-google-cloud-project-id
RENTROLL_TABLE_ID=your-project.dataset.rentroll_table
COMPETITION_TABLE_ID=your-project.dataset.competition_table

# Optional - Application Settings
DEBUG=false
LOG_LEVEL=INFO
```

### 2.3 Deploy

1. Railway will automatically deploy your backend
2. Wait for deployment to complete
3. Note your Railway URL (e.g., `https://your-app-name.up.railway.app`)

## ⚡ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Framework Preset: **Vite**

### 3.2 Configure Environment Variables

In Vercel dashboard, add these environment variables:

```bash
# Required - API Configuration  
VITE_API_URL=https://your-railway-app.up.railway.app/api/v1

# Required - Application Settings
VITE_DEMO_MODE=false
VITE_APP_NAME=AI Rent Optimizer
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

### 3.3 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Note your Vercel URL (e.g., `https://your-app.vercel.app`)

## 🔧 Step 4: Update CORS Settings

Once you have your Vercel URL, update the backend CORS settings:

1. In Railway dashboard, add environment variable:
   ```bash
   CORS_ORIGINS=https://your-actual-vercel-domain.vercel.app
   ```

2. Or update the code in `backend/app/main.py` and redeploy.

## ✅ Step 5: Test Your Deployment

### 5.1 Health Check

Visit: `https://your-railway-app.up.railway.app/health`

You should see:
```json
{
  "status": "healthy",
  "bigquery_connection": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 5.2 Frontend Test

1. Visit your Vercel URL
2. Log in with demo credentials
3. Go to Settings page and test BigQuery connections
4. Verify data loads in Dashboard and Units pages

## 🛠️ Troubleshooting

### Backend Issues

**"BigQuery connection failed"**
- Verify your base64 credentials are correct
- Check BigQuery table IDs match your actual tables
- Ensure service account has BigQuery Data Viewer permissions

**"Internal Server Error"**
- Check Railway logs for detailed error messages
- Verify all required environment variables are set

### Frontend Issues

**"Failed to fetch from API"**
- Check that VITE_API_URL points to your Railway domain
- Verify CORS is configured correctly
- Check Railway backend is healthy

**"Charts not loading"**
- Usually means API calls are timing out
- Check BigQuery query performance
- Verify your data tables have reasonable row counts

## 🔄 Making Updates

### Backend Updates
1. Push changes to GitHub
2. Railway auto-deploys from your main branch

### Frontend Updates  
1. Push changes to GitHub
2. Vercel auto-deploys from your main branch

## 💡 Production Tips

### Security
- Update CORS origins to only include your actual domains
- Set `DEBUG=false` in production
- Monitor Railway and Vercel logs

### Performance
- Railway: Consider upgrading to paid plan for better performance
- Vercel: Free tier is usually sufficient for frontends
- BigQuery: Monitor query costs and optimize if needed

### Monitoring
- Set up Railway notifications for deployment failures
- Monitor Vercel analytics for frontend performance
- Use Google Cloud Console to monitor BigQuery usage

## 🎯 Final Configuration

After successful deployment, your architecture will be:

```
[Users] → [Vercel Frontend] → [Railway Backend] → [Google BigQuery]
```

**Frontend**: `https://your-app.vercel.app`  
**Backend**: `https://your-app.up.railway.app`  
**Health Check**: `https://your-app.up.railway.app/health`

## 📞 Need Help?

- **Railway Issues**: Check Railway docs and Discord
- **Vercel Issues**: Check Vercel docs and GitHub discussions
- **BigQuery Issues**: Check Google Cloud documentation
- **Application Issues**: Check the logs in both Railway and Vercel dashboards 