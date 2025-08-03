# 🚀 Production Deployment Checklist

Use this checklist to ensure a smooth deployment to Railway + Vercel.

## 🔧 Pre-Deployment Setup

### Google Cloud Preparation
- [ ] **Service Account Created** with BigQuery Data Viewer permissions
- [ ] **Service Account JSON Downloaded** to local machine
- [ ] **Credentials Encoded** using `scripts/encode-credentials.py`
- [ ] **BigQuery Tables Accessible** (test with current setup)

### Repository Preparation  
- [ ] **Code Committed** to GitHub repository
- [ ] **Branch Clean** (all changes committed)
- [ ] **.env files excluded** from git (in .gitignore)
- [ ] **Deployment files present**:
  - [ ] `backend/railway.toml`
  - [ ] `backend/requirements.txt`
  - [ ] `frontend/vercel.json`
  - [ ] `DEPLOYMENT_GUIDE.md`

## 🚂 Railway Backend Deployment

### Setup Railway Project
- [ ] **Railway Account** created/logged in
- [ ] **New Project** created from GitHub repo
- [ ] **Backend folder** selected as root directory
- [ ] **Nixpacks builder** detected automatically

### Configure Environment Variables
Copy these exact variables to Railway dashboard:

```env
# Authentication (REQUIRED)
GOOGLE_APPLICATION_CREDENTIALS_BASE64=<your-base64-string>

# BigQuery Configuration (REQUIRED)
BIGQUERY_PROJECT_ID=rentroll-ai
RENTROLL_TABLE_ID=rentroll-ai.rentroll.Update_7_8_native
COMPETITION_TABLE_ID=rentroll-ai.rentroll.Competition
ARCHIVE_TABLE_ID=rentroll-ai.rentroll.ArchiveAptMain

# API Settings
API_PREFIX=/api/v1
DEBUG=false
LOG_LEVEL=INFO

# Server Configuration
PORT=$PORT
HOST=0.0.0.0

# Pricing Engine
MAX_PRICE_ADJUSTMENT=0.15
DEFAULT_DEMAND_ELASTICITY=2.0

# CORS (update after Vercel deployment)
CORS_ORIGINS=https://*.vercel.app
```

### Deploy & Test Backend
- [ ] **Railway Build** completed successfully
- [ ] **Railway Deploy** completed successfully
- [ ] **Health Check** passes: `https://your-app.railway.app/health`
- [ ] **API Test** works: `https://your-app.railway.app/api/v1/properties`
- [ ] **Railway URL** copied for frontend configuration

## 🌐 Vercel Frontend Deployment

### Setup Vercel Project
- [ ] **Vercel Account** created/logged in
- [ ] **Import Project** from GitHub
- [ ] **Frontend folder** selected as root directory
- [ ] **Vite framework** detected

### Configure Deployment Settings
- [ ] **Framework Preset**: Vite
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`
- [ ] **Install Command**: `npm install`

### Configure Environment Variables
```env
VITE_API_URL=https://your-app.railway.app/api/v1
VITE_DEMO_MODE=false
```

### Deploy & Test Frontend
- [ ] **Vercel Build** completed successfully
- [ ] **Vercel Deploy** completed successfully
- [ ] **Frontend loads** at Vercel URL
- [ ] **Login page** displays correctly
- [ ] **Vercel URL** copied for CORS update

## 🔗 Final Integration

### Update CORS Settings
- [ ] **Return to Railway** dashboard
- [ ] **Update CORS_ORIGINS** to include exact Vercel domain:
  ```env
  CORS_ORIGINS=https://*.vercel.app,https://your-specific-app.vercel.app
  ```
- [ ] **Redeploy Railway** backend

### Complete System Test
- [ ] **Open Frontend** at Vercel URL
- [ ] **Login Works** (demo credentials or real auth)
- [ ] **Dashboard Loads** with real data from BigQuery
- [ ] **Units Page** shows units filtered by properties
- [ ] **Analytics Page** displays charts with SvSN data
- [ ] **Market Research** shows archive data
- [ ] **Settings Page** can test all table connections
- [ ] **Property Filtering** works across all pages
- [ ] **No CORS errors** in browser console
- [ ] **No API errors** in network tab

## 📊 Production Validation

### Performance Checks
- [ ] **Page Load Times** < 3 seconds
- [ ] **API Response Times** < 5 seconds for most endpoints
- [ ] **Chart Rendering** smooth and responsive
- [ ] **Mobile Responsive** layout works

### Data Validation
- [ ] **Unit Counts** match expected numbers from BigQuery
- [ ] **Property Names** display correctly
- [ ] **Revenue Calculations** are accurate
- [ ] **Filtering Logic** works as expected
- [ ] **Chart Data** matches table data

### Security Checks
- [ ] **Environment Variables** not exposed in frontend
- [ ] **API Endpoints** require proper authentication
- [ ] **CORS** limited to your domains only
- [ ] **BigQuery Access** limited to required tables only

## 🎯 Go-Live Checklist

### Documentation
- [ ] **Deployment URLs** recorded:
  - Frontend: `https://________.vercel.app`
  - Backend: `https://________.railway.app`
- [ ] **Environment Variables** documented securely
- [ ] **Access Credentials** stored safely
- [ ] **Team Members** have access to accounts

### Monitoring Setup
- [ ] **Railway Notifications** enabled
- [ ] **Vercel Notifications** enabled  
- [ ] **Uptime Monitoring** configured (optional)
- [ ] **Error Tracking** configured (optional)

### Communication
- [ ] **Team Notified** of new production URLs
- [ ] **Demo Credentials** shared if needed
- [ ] **User Training** completed if required
- [ ] **Deployment Success** confirmed

## 🚨 Rollback Plan

If issues occur:
- [ ] **Railway**: Redeploy previous version from Railway dashboard
- [ ] **Vercel**: Redeploy previous version from Vercel dashboard
- [ ] **Environment Variables**: Revert to working configuration
- [ ] **DNS**: Point back to previous working deployment

## 📞 Support Contacts

- **Railway Support**: [railway.app/help](https://railway.app/help)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)  
- **Google Cloud**: [cloud.google.com/support](https://cloud.google.com/support)

---

## ✅ Deployment Complete!

When all items are checked, your **RentRoll AI Optimizer** is live in production!

🎉 **Success URLs**:
- **Application**: `https://your-app.vercel.app`
- **API Health**: `https://your-app.railway.app/health`
- **API Docs**: `https://your-app.railway.app/docs` (if enabled) 