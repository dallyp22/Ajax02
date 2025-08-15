# 🔑 Get Google Cloud Credentials for Railway

Your Railway deployment needs a properly encoded Google Cloud service account JSON file.

## 🚀 Quick Fix Steps

### Step 1: Download Service Account JSON
1. **Go to Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Select Project**: `rentroll-ai`
3. **Navigate to**: IAM & Admin → Service Accounts
4. **Find your service account** (should have BigQuery permissions)
5. **Click**: ⋮ (3 dots) → **Manage Keys**
6. **Add Key** → **Create New Key** → **JSON**
7. **Download** the JSON file (e.g., `rentroll-ai-12345.json`)

### Step 2: Encode for Railway
Run this command on your local machine:

```bash
# Navigate to where you downloaded the JSON file
cd ~/Downloads  # or wherever you saved it

# Encode the file (replace with your actual filename)
base64 -i rentroll-ai-12345.json | tr -d '\n'
```

This will output a long base64 string like:
```
eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InJlbnRyb2xsLWFpIiwicHJpdmF0ZV9rZXlfaWQiOiIxMjM0NTY3ODkwYWJjZGVmIiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUVwQUlCQUFLQ0FRRUEzSDR4...
```

**⚠️ Important**: The string should be 1500+ characters long!

### Step 3: Update Railway
1. **Go to Railway Dashboard** → Your Project → **Variables**
2. **Find**: `GOOGLE_APPLICATION_CREDENTIALS_BASE64`
3. **Replace** with the new base64 string
4. **Save** → Railway will auto-redeploy

## ✅ Verification

After updating, your Railway logs should show:
```
🔑 Using base64-encoded credentials
✅ Credentials validated for project: rentroll-ai
🚀 Starting RentRoll AI Optimizer...
```

## 🚨 Common Issues

**"Invalid base64" Error:**
- ❌ Base64 string too short (you copied template instead of real data)
- ✅ Should be 1500+ characters

**"Project not found" Error:**
- ❌ Wrong project ID in service account
- ✅ Ensure service account is for `rentroll-ai` project

**"Access denied" Error:**
- ❌ Service account missing BigQuery permissions
- ✅ Add BigQuery Data Viewer and BigQuery Job User roles

## 🔧 Alternative: Use the Helper Script

If you have Python available, you can also use our helper script:

```bash
# Download your service account JSON first, then:
cd /path/to/Ajax01
python encode_credentials_for_railway.py /path/to/your-service-account.json
```

This will give you the exact base64 string with detailed instructions.

---

## 🎯 After You Fix Credentials

1. **Update Railway** with correct base64
2. **Check deployment logs** for success
3. **Test endpoint**: `https://your-app.railway.app/auth/test`
4. **Deploy frontend** to Vercel next

Your multi-tenant SaaS platform is almost live! 🚀
