# Vercel Frontend Deployment Guide

## 🚀 Quick Deployment Steps

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your `Ajax02` repository: `https://github.com/dallyp22/Ajax02.git`

### Step 2: Configure Project Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Set Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
VITE_API_URL=https://ajax02-production.up.railway.app/api/v1
VITE_AUTH0_DOMAIN=dev-d1w8phhvyhdbv0wi.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_from_auth0_dashboard
VITE_AUTH0_AUDIENCE=https://rentroll-ai-api
VITE_AUTH0_REDIRECT_URI=https://your-vercel-url.vercel.app/callback
VITE_APP_NAME=RentRoll AI Optimizer
VITE_ENVIRONMENT=production
VITE_BYPASS_AUTH=false
```

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Get your Vercel URL (e.g., `https://ajax02-xxxx.vercel.app`)

### Step 5: Update Auth0
After deployment, update Auth0 with your Vercel URL:
1. Go to Auth0 Dashboard → Applications → Your SPA
2. Update **Allowed Callback URLs**: `https://your-vercel-url.vercel.app/callback`
3. Update **Allowed Web Origins**: `https://your-vercel-url.vercel.app`
4. Update **Allowed Logout URLs**: `https://your-vercel-url.vercel.app`

### Step 6: Update Vercel Environment
1. Go back to Vercel → Settings → Environment Variables
2. Update `VITE_AUTH0_REDIRECT_URI` with your actual Vercel URL
3. Redeploy

## 🎯 Expected Result
- Frontend deployed and accessible via Vercel URL
- Auth0 authentication working
- Backend API calls routing to Railway
- Super Admin interface functional

## 🧪 Test URLs
- Health: `https://your-vercel-url.vercel.app`
- Admin: `https://your-vercel-url.vercel.app/admin`
- Login: Should redirect to Auth0
