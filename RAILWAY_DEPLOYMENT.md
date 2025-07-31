# 🚀 Railway Deployment Guide

## Quick Railway Backend Deployment

### Step 1: Prepare Your Service Account Credentials

#### **🎯 Method 1: Base64 Encoding (RECOMMENDED)**

The most reliable way to avoid credential parsing issues:

1. **Navigate to your project directory**:
   ```bash
   cd /path/to/your/BigQuery_6
   ```

2. **Run the encoding script**:
   ```bash
   python backend/encode_credentials.py ~/.config/gcloud/rentroll-sa.json
   ```

3. **Copy the base64 output** - it will look like:
   ```
   eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InJlbnRyb2xsLWFpIiwicH...
   ```

#### **🔧 Method 2: JSON Minification (Alternative)**

If you prefer the JSON approach:

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

   **For Base64 Method (Recommended):**
   ```
   GOOGLE_APPLICATION_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...your-base64-string...
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

   **For JSON Method (Alternative):**
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

1. **Get your Railway URL** (e.g., `https://your-app.up.railway.app`)

2. **Update Vercel Environment Variables**:
   - `VITE_API_URL`: `https://your-app.up.railway.app/api/v1`
   - `VITE_DEMO_MODE`: `false`

3. **Redeploy Vercel**: This will connect your frontend to the Railway backend

### Step 4: Test Your Deployment

1. **Health Check**: Visit `https://your-app.up.railway.app/health`
2. **API Docs**: Visit `https://your-app.up.railway.app/docs`
3. **Frontend**: Your Vercel app should now show real BigQuery data!

## 🎯 Why Railway?

- ✅ **Simple deployment** from GitHub
- ✅ **Automatic redeploys** on git push
- ✅ **Built-in environment variables**
- ✅ **Great for Python/FastAPI**
- ✅ **Affordable pricing**
- ✅ **No complex configuration**

## 🔧 Dynamic Settings System

### ✨ **Best of Both Worlds!**
Your AI Rent Optimizer has a **smart settings system**:

1. **Railway Environment Variables** = **Default Tables**
   - Set sensible defaults for initial deployment
   - Ensure the app works immediately after deployment

2. **Settings Page in App** = **Override Anytime**
   - Change table IDs without redeployment
   - Test new datasets instantly
   - Perfect for multiple ownership companies

### 📊 **How It Works:**
1. **Deploy with your main tables** in Railway environment variables
2. **Use the Settings tab** in the app to switch to different tables
3. **No redeployment needed** - changes take effect immediately
4. **Settings persist** across app restarts

### 🏢 **Multi-Company Usage:**
- **Company A**: Deploy once with their BigQuery tables as defaults
- **Company B**: Same deployment, just change tables via Settings page
- **Testing**: Switch between prod/staging tables instantly

## 🔐 Security Notes

- Keep your credentials secure (base64 or JSON)
- Use a strong `SECRET_KEY`
- Railway encrypts environment variables

## 🐛 Troubleshooting

### **Credential Issues**
- ✅ **Use base64 method** - most reliable
- ⚠️ **JSON method** - ensure private key `\n` characters are preserved
- 🔍 **Check Railway logs** for specific error messages

### **Connection Issues**
- Verify BigQuery table names are correct
- Check Google Cloud permissions
- Ensure service account has BigQuery access

## 📱 Once Deployed

Your team will have:
- **Real-time BigQuery data** in the frontend
- **Full optimization functionality** 
- **Live updates** when you push to GitHub
- **Production-ready deployment**
- **Flexible table configuration** without redeployment

The complete AI Rent Optimizer with your actual rental data! 🏠✨ 