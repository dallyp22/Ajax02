#!/bin/bash

# Cloud Run Deployment Script for RentRoll AI Optimizer
# Usage: ./deploy-cloud-run.sh [environment]

set -e

ENVIRONMENT=${1:-development}
PROJECT_ID="rentroll-ai"
REGION="us-central1"
SERVICE_ACCOUNT="rentroll-ai-assistant@rentroll-ai.iam.gserviceaccount.com"

echo "🚀 Deploying RentRoll AI Optimizer to Cloud Run (${ENVIRONMENT})"

# Set the project
gcloud config set project $PROJECT_ID

# Build and push backend image
echo "📦 Building and pushing backend image..."
cd ../backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/rentroll-backend:latest .

# Build and push frontend image
echo "📦 Building and pushing frontend image..."
cd ../frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/rentroll-frontend:latest .

# Deploy backend service
echo "🔧 Deploying backend service..."
gcloud run deploy rentroll-backend \
  --image gcr.io/$PROJECT_ID/rentroll-backend:latest \
  --platform managed \
  --region $REGION \
  --service-account $SERVICE_ACCOUNT \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,BIGQUERY_DATASET_STAGING=staging,BIGQUERY_DATASET_MART=mart" \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 100 \
  --concurrency 1000 \
  --timeout 900 \
  --allow-unauthenticated \
  --port 8000

# Get backend URL
BACKEND_URL=$(gcloud run services describe rentroll-backend --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"

# Deploy frontend service
echo "🔧 Deploying frontend service..."
gcloud run deploy rentroll-frontend \
  --image gcr.io/$PROJECT_ID/rentroll-frontend:latest \
  --platform managed \
  --region $REGION \
  --set-env-vars "VITE_API_BASE_URL=$BACKEND_URL" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 1000 \
  --timeout 300 \
  --allow-unauthenticated \
  --port 3000

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe rentroll-frontend --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed at: $FRONTEND_URL"

echo ""
echo "🎉 Deployment completed successfully!"
echo "Backend API: $BACKEND_URL"
echo "Frontend App: $FRONTEND_URL"
echo "API Documentation: $BACKEND_URL/docs"

# Test deployment
echo ""
echo "🧪 Testing deployment..."
if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
fi

echo "📊 View logs with:"
echo "  gcloud logs tail rentroll-backend --follow"
echo "  gcloud logs tail rentroll-frontend --follow" 