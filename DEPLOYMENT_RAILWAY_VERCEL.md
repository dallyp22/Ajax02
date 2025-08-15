# 🚀 Ajax02 Production Deployment Guide

Deploy your **Multi-Tenant AI Rent Optimizer** to Railway (backend) and Vercel (frontend).

## 📋 Prerequisites

- ✅ **Railway Account**: [railway.app](https://railway.app)
- ✅ **Vercel Account**: [vercel.com](https://vercel.com) 
- ✅ **Auth0 Account**: [auth0.com](https://auth0.com)
- ✅ **Google Cloud Service Account** with BigQuery access
- ✅ **GitHub Repository**: Ajax02 pushed and ready

## 🔧 Part 1: Railway Backend Deployment

### Step 1: Prepare Google Cloud Credentials

1. **Download your service account JSON file**
2. **Encode to base64**:
   ```bash
   # On macOS/Linux
   base64 -i /path/to/service-account.json | tr -d '\n'
   
   # On Windows
   certutil -encode service-account.json temp.b64 && findstr /v /c:- temp.b64
   ```
3. **Copy the base64 string** for Railway configuration

### Step 2: Deploy Backend to Railway

1. **Go to Railway**: [railway.app](https://railway.app)
2. **Create New Project** → **Deploy from GitHub repo**
3. **Select Ajax02 repository**
4. **Choose backend folder** as root directory
5. **Set Environment Variables** in Railway Dashboard:

```env
# REQUIRED: Authentication
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_API_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER=https://your-domain.auth0.com/

# REQUIRED: Google Cloud
GOOGLE_APPLICATION_CREDENTIALS_BASE64=your-base64-string-here
GCP_PROJECT_ID=rentroll-ai
GCP_LOCATION=US

# REQUIRED: Application
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
API_PREFIX=/api/v1

# NOTE: PORT is automatically provided by Railway - DO NOT SET IT

# REQUIRED: CORS (update after Vercel deployment)
CORS_ORIGINS=["https://your-app.vercel.app"]

# Optional: BigQuery
BIGQUERY_DATASET_STAGING=staging
BIGQUERY_DATASET_MART=mart
BIGQUERY_LOCATION=US

# Optional: Pricing Engine
MAX_PRICE_ADJUSTMENT=0.15
DEFAULT_DEMAND_ELASTICITY=2.0
```

6. **Deploy** - Railway will automatically build
7. **Copy Railway URL** (e.g., `https://your-app.railway.app`)

### Step 3: Test Railway Deployment

```bash
# Test health check
curl https://your-app.railway.app/auth/test

# Test admin API (requires Auth0 token)
curl https://your-app.railway.app/api/v1/admin/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Part 2: Vercel Frontend Deployment

### Step 1: Deploy Frontend to Vercel

1. **Go to Vercel**: [vercel.com](https://vercel.com)
2. **Import Ajax02 repository**
3. **Set Root Directory**: `frontend`
4. **Framework Preset**: Vite
5. **Set Environment Variables**:

```env
# REQUIRED: API Configuration
VITE_API_URL=https://your-app.railway.app/api/v1

# REQUIRED: Auth0 Configuration  
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-frontend-client-id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
VITE_AUTH0_REDIRECT_URI=https://your-app.vercel.app/callback

# REQUIRED: Application Settings
VITE_ENVIRONMENT=production
VITE_APP_NAME=AI Rent Optimizer
VITE_DEMO_MODE=false
VITE_BYPASS_AUTH=false
```

6. **Deploy** - Vercel will build and deploy automatically
7. **Copy Vercel URL** (e.g., `https://your-app.vercel.app`)

### Step 2: Update CORS in Railway

1. **Go back to Railway Dashboard**
2. **Update CORS_ORIGINS environment variable**:
   ```
   CORS_ORIGINS=["https://your-app.vercel.app", "https://*.vercel.app"]
   ```
3. **Redeploy backend**

## 🔐 Part 3: Auth0 Configuration

### Step 1: Update Auth0 Applications

**Backend API (Machine to Machine):**
- ✅ **Identifier**: `https://your-api-identifier` 
- ✅ **Signing Algorithm**: RS256
- ✅ **Scopes**: Configure as needed

**Frontend SPA (Single Page Application):**
- ✅ **Allowed Callback URLs**: `https://your-app.vercel.app/callback`
- ✅ **Allowed Logout URLs**: `https://your-app.vercel.app`
- ✅ **Allowed Web Origins**: `https://your-app.vercel.app`
- ✅ **Application Type**: Single Page Application

### Step 2: Configure Auth0 Roles

Create these roles in Auth0:
- ✅ **super_admin**: Full platform access
- ✅ **client_admin**: Client management access  
- ✅ **client_user**: Basic client access

## 🧪 Part 4: Testing Production Deployment

### Test Authentication Flow

1. **Visit**: `https://your-app.vercel.app`
2. **Click Login** → Should redirect to Auth0
3. **Login** → Should redirect back with authentication
4. **Access Super Admin** → `/admin` (requires super_admin role)

### Test Multi-Tenant Features

1. **Create a client** via Super Admin interface
2. **Verify BigQuery dataset creation**
3. **Test data uploads** for the new client
4. **Verify data isolation** between clients

## 🎉 Success Checklist

- [ ] **Railway backend deployed** and health check passes
- [ ] **Vercel frontend deployed** and loads correctly  
- [ ] **Auth0 login flow** working end-to-end
- [ ] **Super Admin interface** accessible with proper role
- [ ] **Client creation** working and creating BigQuery datasets
- [ ] **Data uploads** functional for new clients
- [ ] **Multi-tenant isolation** verified

## 🛠️ Troubleshooting

### Common Issues

**Auth0 400 Bad Request:**
- Verify callback URLs match exactly
- Check application type is "Single Page Application"
- Ensure HTTPS is used in production

**CORS Errors:**
- Update CORS_ORIGINS in Railway with exact Vercel URL
- Include both specific URL and wildcard pattern

**BigQuery Access Denied:**
- Verify service account has proper permissions
- Check base64 encoding is correct
- Ensure GCP_PROJECT_ID matches your project

**Railway Build Failures:**
- Check all required environment variables are set
- Verify Python dependencies in requirements.txt
- Review Railway build logs for specific errors

---

## 🚀 Your Multi-Tenant SaaS Platform is Now Live!

Each new client will get their own isolated BigQuery dataset and complete data environment. Ready for production use! 🎯
