# 🚂 Railway Environment Variables Setup

## ⚠️ IMPORTANT: Railway PORT Configuration

**DO NOT** set the `PORT` environment variable in Railway dashboard. Railway automatically provides this variable.

---

## 🔧 Required Environment Variables for Railway

Copy these **exact** variables to your Railway dashboard:

### Authentication & Security
```
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_API_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER=https://your-auth0-domain.auth0.com/
```

### Google Cloud Configuration  
```
GOOGLE_APPLICATION_CREDENTIALS_BASE64=your-base64-encoded-service-account-json
GCP_PROJECT_ID=rentroll-ai
GCP_LOCATION=US
```

### Application Settings
```
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
API_PREFIX=/api/v1
```

### CORS Configuration (update after Vercel deployment)
```
CORS_ORIGINS=["https://your-app.vercel.app", "https://*.vercel.app"]
```

### Optional: BigQuery Settings
```
BIGQUERY_DATASET_STAGING=staging
BIGQUERY_DATASET_MART=mart
BIGQUERY_LOCATION=US
```

### Optional: Pricing Engine
```
MAX_PRICE_ADJUSTMENT=0.15
DEFAULT_DEMAND_ELASTICITY=2.0
```

---

## 🚀 Railway Deployment Steps

1. **Go to Railway Dashboard**: [railway.app](https://railway.app)
2. **Create New Project** → **Deploy from GitHub repo**
3. **Select Ajax02 repository**
4. **Set Root Directory**: `backend`
5. **Add Environment Variables**: Copy the variables above (one by one)
6. **Deploy**: Railway will automatically build with Nixpacks

---

## ✅ What Railway Provides Automatically

- ✅ `PORT` - Automatically set by Railway (usually 8000-9000)
- ✅ Build configuration via `railway.toml`
- ✅ Python environment via Nixpacks
- ✅ HTTPS termination
- ✅ Domain name (your-app.railway.app)

---

## 🔍 Troubleshooting

**"PORT variable must be integer" Error:**
- ❌ Remove any `PORT` variable from Railway dashboard
- ✅ Railway provides this automatically

**Build Fails:**
- ✅ Ensure `backend` is selected as root directory
- ✅ Check all required environment variables are set
- ✅ Verify base64 encoding of Google Cloud credentials

**Auth0 Issues:**
- ✅ Double-check AUTH0_DOMAIN format
- ✅ Ensure API audience matches Auth0 setup
- ✅ Verify issuer URL format

---

## 🎯 Next Steps After Railway Deployment

1. **Copy Railway URL** (e.g., `https://your-app.railway.app`)
2. **Test health endpoint**: `https://your-app.railway.app/auth/test`
3. **Deploy frontend to Vercel** using this Railway URL
4. **Update CORS_ORIGINS** with Vercel domain
5. **Configure Auth0** with production URLs
