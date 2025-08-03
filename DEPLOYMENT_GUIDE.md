# 🚀 Production Deployment Guide

Deploy **RentRoll AI Optimizer** with Railway (backend) and Vercel (frontend) for a production-ready setup.

## 📋 Prerequisites

- **Railway Account**: [railway.app](https://railway.app)
- **Vercel Account**: [vercel.com](https://vercel.com)
- **Google Cloud Service Account** with BigQuery access
- **GitHub Repository** (for automatic deployments)

## 🔧 Part 1: Railway Backend Deployment

### Step 1: Prepare Service Account Credentials

1. **Download your Google Cloud service account JSON file**
2. **Encode it to base64**:
   ```bash
   cd scripts
   python encode-credentials.py path/to/your-service-account.json
   ```
3. **Copy the base64 string** (you'll need this for Railway)

### Step 2: Deploy to Railway

1. **Push your code to GitHub** (if not already done)
2. **Go to Railway Dashboard**: [railway.app](https://railway.app)
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your repository** and choose the `backend` folder
5. **Set Environment Variables** in Railway dashboard:

   ```env
   # Required Variables
   GOOGLE_APPLICATION_CREDENTIALS_BASE64=<your-base64-encoded-json>
   BIGQUERY_PROJECT_ID=rentroll-ai
   RENTROLL_TABLE_ID=rentroll-ai.rentroll.Update_7_8_native
   COMPETITION_TABLE_ID=rentroll-ai.rentroll.Competition
   ARCHIVE_TABLE_ID=rentroll-ai.rentroll.ArchiveAptMain
   
   # API Configuration
   API_PREFIX=/api/v1
   DEBUG=false
   LOG_LEVEL=INFO
   
   # Server Configuration
   PORT=$PORT
   HOST=0.0.0.0
   
   # Pricing Configuration
   MAX_PRICE_ADJUSTMENT=0.15
   DEFAULT_DEMAND_ELASTICITY=2.0
   
   # CORS (update with your Vercel domain)
   CORS_ORIGINS=https://*.vercel.app,https://your-app-name.vercel.app
   ```

6. **Deploy** - Railway will automatically build and deploy
7. **Copy your Railway domain** (e.g., `https://your-app.railway.app`)

### Step 3: Test Railway Deployment

```bash
# Test health endpoint
curl https://your-app.railway.app/health

# Test API endpoint
curl https://your-app.railway.app/api/v1/properties
```

## 🌐 Part 2: Vercel Frontend Deployment

### Step 1: Update Frontend Environment

1. **Create/update `frontend/.env.production`**:
   ```env
   VITE_API_URL=https://your-app.railway.app/api/v1
   VITE_DEMO_MODE=false
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**: [vercel.com](https://vercel.com)
2. **Import Project** → **Import Git Repository**
3. **Select your repository**
4. **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Set Environment Variables** in Vercel dashboard:
   ```env
   VITE_API_URL=https://your-app.railway.app/api/v1
   VITE_DEMO_MODE=false
   ```

6. **Deploy** - Vercel will build and deploy automatically
7. **Copy your Vercel domain** (e.g., `https://your-app.vercel.app`)

### Step 3: Update CORS Settings

1. **Go back to Railway dashboard**
2. **Update the `CORS_ORIGINS` environment variable**:
   ```env
   CORS_ORIGINS=https://*.vercel.app,https://your-app.vercel.app
   ```
3. **Redeploy Railway backend**

## ✅ Part 3: Verification

### Test Complete System

1. **Open your Vercel URL**: `https://your-app.vercel.app`
2. **Login** with demo credentials or your auth system
3. **Test each page**:
   - ✅ Dashboard loads with real data
   - ✅ Units page shows filtered data
   - ✅ Analytics page displays charts
   - ✅ Market Research page works
   - ✅ Settings page can test connections

### Check API Health

```bash
# Health check
curl https://your-app.railway.app/health

# Properties endpoint
curl https://your-app.railway.app/api/v1/properties

# Settings test
curl -X POST https://your-app.railway.app/api/v1/settings/test \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "rentroll-ai",
    "rentroll_table": "rentroll-ai.rentroll.Update_7_8_native",
    "competition_table": "rentroll-ai.rentroll.Competition",
    "archive_table": "rentroll-ai.rentroll.ArchiveAptMain"
  }'
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `CORS_ORIGINS` includes your exact Vercel domain
   - Check browser developer tools for specific CORS messages

2. **BigQuery Connection Issues**:
   - Verify `GOOGLE_APPLICATION_CREDENTIALS_BASE64` is correctly encoded
   - Test table access using Settings page
   - Check Railway logs for authentication errors

3. **Environment Variable Issues**:
   - Use Railway/Vercel dashboard to verify all variables are set
   - Restart deployments after changing environment variables

### Viewing Logs

- **Railway**: Dashboard → Your Service → Deployments → View Logs
- **Vercel**: Dashboard → Your Project → Functions → View Function Logs

## 🚀 Production Optimizations

### Security
- [ ] Enable Railway private networking if needed
- [ ] Set up custom domains with SSL
- [ ] Review and limit BigQuery access permissions
- [ ] Enable API rate limiting if needed

### Performance
- [ ] Enable Vercel analytics
- [ ] Set up Railway metrics monitoring
- [ ] Configure caching headers
- [ ] Optimize BigQuery queries for cost

### Monitoring
- [ ] Set up uptime monitoring (Pingdom, etc.)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up log aggregation
- [ ] Monitor BigQuery usage and costs

## 📞 Support

If you encounter issues:
1. Check the logs in Railway/Vercel dashboards
2. Test individual API endpoints
3. Verify environment variables
4. Check this guide for troubleshooting steps

---

**🎉 Your RentRoll AI Optimizer is now live in production!**

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`
- **API Health**: `https://your-app.railway.app/health` 