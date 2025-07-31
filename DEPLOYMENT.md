# 🚀 AI Rent Optimizer - Deployment Guide

## Quick Vercel Deployment

### Step 1: Deploy to Vercel

1. **Fork or Import** this repository to your GitHub account
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

3. **Configure Environment Variables** (if needed):
   ```env
   VITE_API_URL=your-backend-url
   VITE_DEMO_MODE=true
   VITE_APP_NAME=AI Rent Optimizer
   ```

4. **Deploy**: Click "Deploy" and Vercel will build and deploy your application

### Step 2: Team Access

**Demo Credentials for your team:**
```
🔐 LOGIN CREDENTIALS:
• admin / rentroll2024 (Administrator)
• dallas / optimizer (Manager) 
• team / demo123 (Analyst)
• demo / demo (Viewer)
```

### Step 3: Share with Team

After deployment, share the Vercel URL with your team:
- `https://your-app-name.vercel.app`

## Features Available in Demo Mode

✅ **Full UI Experience:**
- Dark Industrial Command Center theme
- Interactive analytics dashboard
- Portfolio KPI metrics
- User authentication and roles
- All navigation and layouts

✅ **Mock Data Demonstrations:**
- 2,998+ units portfolio simulation
- $13.3M revenue optimization potential
- Real-time analytics visualizations
- Market positioning insights

⚠️ **Limited Backend Features:**
- Uses demo/mock data instead of live BigQuery
- Settings changes won't persist
- No real optimization calculations

## Production Backend Setup (Optional)

To connect to a real BigQuery backend:

1. **Deploy Backend** separately (Railway, Heroku, Google Cloud Run)
2. **Update Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend-api.com/api/v1
   VITE_DEMO_MODE=false
   ```
3. **Configure BigQuery** credentials on backend server
4. **Redeploy Frontend** with new environment variables

## Local Development

For local development with full backend:

```bash
# Clone repository
git clone https://github.com/dallyp22/Ajax.git
cd Ajax

# Start backend (requires BigQuery setup)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python dev.py

# Start frontend
cd ../frontend
npm install
npm run dev
```

## Architecture

```
📱 Frontend (Vercel)     🔗 API Gateway     🗄️ Backend (Optional)
├── React + TypeScript   ├── Vercel Edge     ├── FastAPI + Python
├── Material-UI Theme    ├── Mock Data       ├── BigQuery Integration
├── Recharts Analytics   ├── Demo Mode       ├── ML Optimization
└── Authentication       └── Fallback        └── Real-time Data
```

## Team Collaboration Features

🔐 **Role-Based Access:**
- **Administrator**: Full system access
- **Manager**: Portfolio oversight
- **Analyst**: Data analysis focus  
- **Viewer**: Read-only dashboard

📊 **Dashboard Capabilities:**
- Real-time portfolio metrics
- Interactive charts and visualizations
- Market positioning analysis
- Revenue optimization insights

🎨 **Professional UI:**
- Command center aesthetics
- Glass morphism design
- Responsive across devices
- Dark industrial theme

---

## 🎯 Perfect for Team Demos!

This deployment gives your team immediate access to:
- **Professional rental optimization interface**
- **Interactive analytics and insights**
- **Role-based user management**
- **Production-quality UI/UX**

**Ready to showcase your AI-powered rent optimization platform!** ✨ 