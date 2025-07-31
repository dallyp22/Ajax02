# 🚀 Railway Deployment Guide

## Quick Railway Backend Deployment

### Step 1: Prepare Your Service Account JSON

1. **Get your service account JSON** (the one you already have)
2. **Minify it** - Remove all whitespace and newlines to make it a single line:
   ```json
   {"type":"service_account","project_id":"rentroll-ai","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
   ```

### Step 2: Deploy to Railway

1. **Sign up for Railway** at [railway.app](https://railway.app)

2. **Connect GitHub**: Link your GitHub account

3. **New Project**: 
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `Ajax` repository
   - Select the `backend` folder as root directory

4. **Set Environment Variables** in Railway dashboard:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...your minified JSON...}
   GOOGLE_CLOUD_PROJECT=rentroll-ai
   BIGQUERY_RENTROLL_TABLE=rentroll-ai.rentroll.Update_7_8_native
   BIGQUERY_COMPETITION_TABLE=rentroll-ai.rentroll.Competition
   BIGQUERY_STAGING_DATASET=rentroll-ai.staging
   BIGQUERY_MART_DATASET=rentroll-ai.mart
   API_PREFIX=/api/v1
   DEBUG=false
   LOG_LEVEL=info
   SECRET_KEY=your-secure-random-secret-key
   ```

5. **Deploy**: Railway will automatically detect Python and deploy your FastAPI app

### Step 3: Update Frontend for Railway Backend

1. **Get your Railway URL** (e.g., `https://your-app-production.up.railway.app`)

2. **Update Vercel Environment Variables**:
   - `VITE_API_URL`: `https://your-app-production.up.railway.app/api/v1`
   - `VITE_DEMO_MODE`: `false`

3. **Redeploy Vercel**: This will connect your frontend to the Railway backend

### Step 4: Test Your Deployment

1. **Health Check**: Visit `https://your-app-production.up.railway.app/health`
2. **API Docs**: Visit `https://your-app-production.up.railway.app/docs`
3. **Frontend**: Your Vercel app should now show real BigQuery data!

## 🎯 Why Railway?

- ✅ **Simple deployment** from GitHub
- ✅ **Automatic redeploys** on git push
- ✅ **Built-in environment variables**
- ✅ **Great for Python/FastAPI**
- ✅ **Affordable pricing**
- ✅ **No complex configuration**

## 🔐 Security Notes

- Keep your `GOOGLE_APPLICATION_CREDENTIALS_JSON` secure
- Use a strong `SECRET_KEY`
- Railway encrypts environment variables

## 📱 Once Deployed

Your team will have:
- **Real-time BigQuery data** in the frontend
- **Full optimization functionality** 
- **Live updates** when you push to GitHub
- **Production-ready deployment**

The complete AI Rent Optimizer with your actual rental data! 🏠✨ 