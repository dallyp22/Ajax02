# Engineering Runbook / Operational Playbook
## AI Rent Optimizer

**Document Version:** 1.0  
**Last Updated:** August 2024  
**Author:** DevOps & SRE Team  

---

## 1. Deployment Procedures

### 1.1 Production Deployment Checklist

```bash
# Pre-Deployment Checklist
□ Code review completed and approved
□ All tests passing (unit, integration, e2e)
□ Security scan completed (no critical vulnerabilities)
□ Database migrations tested (if applicable)
□ Environment variables configured
□ Monitoring alerts configured
□ Rollback plan documented
□ Stakeholders notified

# Deployment Steps
□ Deploy to staging environment
□ Run smoke tests on staging
□ Deploy to production
□ Verify health checks
□ Run post-deployment tests
□ Monitor system metrics
□ Update deployment logs
```

### 1.2 Deployment Scripts

#### Railway Backend Deployment

```bash
#!/bin/bash
# scripts/deploy-backend-railway.sh

set -e  # Exit on any error

echo "🚀 Deploying backend to Railway..."

# Validate environment
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS_BASE64" ]; then
    echo "❌ GOOGLE_APPLICATION_CREDENTIALS_BASE64 not set"
    exit 1
fi

# Pre-deployment tests
echo "🧪 Running pre-deployment tests..."
cd backend
poetry run pytest tests/ -v
if [ $? -ne 0 ]; then
    echo "❌ Tests failed, aborting deployment"
    exit 1
fi

# Security check
echo "🔒 Running security checks..."
poetry run safety check
poetry run bandit -r app/

# Build and deploy
echo "📦 Building application..."
git add .
git commit -m "deploy: backend updates $(date +%Y%m%d-%H%M%S)"
git push origin main

# Railway auto-deploys on push
echo "⏳ Waiting for Railway deployment..."
sleep 30

# Health check
echo "🏥 Checking application health..."
BACKEND_URL="https://your-railway-app.up.railway.app"
for i in {1..10}; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Backend deployment successful!"
        echo "🌐 Backend URL: $BACKEND_URL"
        exit 0
    fi
    echo "⏳ Attempt $i: HTTP $HTTP_STATUS, retrying in 10s..."
    sleep 10
done

echo "❌ Deployment failed - health check timeout"
exit 1
```

#### Vercel Frontend Deployment

```bash
#!/bin/bash
# scripts/deploy-frontend-vercel.sh

set -e

echo "🚀 Deploying frontend to Vercel..."

cd frontend

# Build verification
echo "🔨 Testing build process..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed, aborting deployment"
    exit 1
fi

# Type checking
echo "🔍 Running type checks..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type errors found, aborting deployment"
    exit 1
fi

# Deploy to Vercel
echo "📤 Deploying to Vercel..."
npx vercel --prod

# Get deployment URL
FRONTEND_URL=$(npx vercel ls | grep "✅" | head -1 | awk '{print $2}')
echo "✅ Frontend deployment successful!"
echo "🌐 Frontend URL: https://$FRONTEND_URL"
```

#### Google Cloud Run Deployment

```bash
#!/bin/bash
# scripts/deploy-cloud-run.sh

set -e

PROJECT_ID="rentroll-ai"
REGION="us-central1"
SERVICE_ACCOUNT="rentroll-ai-assistant@rentroll-ai.iam.gserviceaccount.com"

echo "🚀 Deploying to Google Cloud Run..."

# Set project
gcloud config set project $PROJECT_ID

# Backend deployment
echo "📦 Building and deploying backend..."
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/rentroll-backend:latest .

gcloud run deploy rentroll-backend \
  --image gcr.io/$PROJECT_ID/rentroll-backend:latest \
  --platform managed \
  --region $REGION \
  --service-account $SERVICE_ACCOUNT \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID" \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 1000 \
  --timeout 900 \
  --allow-unauthenticated \
  --port 8000

# Get backend URL
BACKEND_URL=$(gcloud run services describe rentroll-backend --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# Frontend deployment
echo "📦 Building and deploying frontend..."
cd ../frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/rentroll-frontend:latest .

gcloud run deploy rentroll-frontend \
  --image gcr.io/$PROJECT_ID/rentroll-frontend:latest \
  --platform managed \
  --region $REGION \
  --set-env-vars "VITE_API_URL=$BACKEND_URL/api/v1" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --allow-unauthenticated \
  --port 80

FRONTEND_URL=$(gcloud run services describe rentroll-frontend --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed: $FRONTEND_URL"

echo "🎉 Deployment complete!"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
```

### 1.3 Environment Configuration

```bash
# Production Environment Variables

# Backend (.env)
GOOGLE_APPLICATION_CREDENTIALS_BASE64=<base64-encoded-service-account-json>
BIGQUERY_PROJECT_ID=rentroll-ai
RENTROLL_TABLE_ID=rentroll-ai.rentroll.Update_7_8_native
COMPETITION_TABLE_ID=rentroll-ai.rentroll.Competition
ARCHIVE_TABLE_ID=rentroll-ai.rentroll.ArchiveAptMain
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://your-frontend-domain.com
MAX_PRICE_ADJUSTMENT=0.30
DEFAULT_ELASTICITY=-0.02

# Frontend (.env)
VITE_API_URL=https://your-backend-url.com/api/v1
VITE_APP_NAME=AI Rent Optimizer
VITE_DEMO_MODE=false
NODE_ENV=production
```

## 2. Monitoring & Alerting

### 2.1 Health Check Monitoring

```python
# Enhanced Health Check Implementation
@app.get("/health/detailed")
async def detailed_health_check():
    """
    Comprehensive health check for monitoring systems.
    
    Returns:
    - Overall system status
    - Component-specific health
    - Performance metrics
    - Resource utilization
    """
    health_report = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': app_version,
        'uptime_seconds': time.time() - start_time,
        'components': {}
    }
    
    # Database connectivity
    try:
        start = time.time()
        test_query = "SELECT 1 as test_connection"
        result = db_service.client.query(test_query).result()
        response_time = (time.time() - start) * 1000
        
        health_report['components']['bigquery'] = {
            'status': 'healthy',
            'response_time_ms': round(response_time, 2),
            'last_successful_query': datetime.utcnow().isoformat()
        }
    except Exception as e:
        health_report['components']['bigquery'] = {
            'status': 'unhealthy',
            'error': str(e),
            'last_error_time': datetime.utcnow().isoformat()
        }
        health_report['status'] = 'degraded'
    
    # Memory usage
    memory = psutil.virtual_memory()
    health_report['components']['memory'] = {
        'status': 'healthy' if memory.percent < 85 else 'warning',
        'usage_percent': memory.percent,
        'available_gb': round(memory.available / (1024**3), 2)
    }
    
    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=1)
    health_report['components']['cpu'] = {
        'status': 'healthy' if cpu_percent < 80 else 'warning',
        'usage_percent': cpu_percent,
        'load_average': os.getloadavg()[0] if hasattr(os, 'getloadavg') else None
    }
    
    # Disk usage
    disk = psutil.disk_usage('/')
    health_report['components']['disk'] = {
        'status': 'healthy' if disk.percent < 90 else 'warning',
        'usage_percent': disk.percent,
        'free_gb': round(disk.free / (1024**3), 2)
    }
    
    # Application-specific metrics
    health_report['application_metrics'] = {
        'optimization_success_rate': get_optimization_success_rate(),
        'average_response_time_ms': get_average_response_time(),
        'active_connections': get_active_connection_count(),
        'cache_hit_ratio': get_cache_hit_ratio()
    }
    
    return health_report
```

### 2.2 Logging Standards

```python
# Logging Configuration
import logging
import json
from datetime import datetime

class StructuredFormatter(logging.Formatter):
    """
    Structured JSON logging formatter for production.
    
    Log Format:
    {
        "timestamp": "2024-08-01T10:30:00Z",
        "level": "INFO",
        "logger": "app.pricing",
        "message": "Optimization completed successfully",
        "request_id": "req-123456",
        "user_id": "user-789",
        "unit_id": "unit-456",
        "duration_ms": 1234,
        "extra": {...}
    }
    """
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields from LoggerAdapter
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'duration_ms'):
            log_entry['duration_ms'] = record.duration_ms
        
        return json.dumps(log_entry)

# Logger setup
def setup_logging():
    """Configure application logging."""
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(console_handler)
    
    # Application-specific loggers
    app_logger = logging.getLogger('app')
    app_logger.setLevel(logging.INFO)
    
    # Third-party library log levels
    logging.getLogger('uvicorn').setLevel(logging.WARNING)
    logging.getLogger('google.cloud').setLevel(logging.WARNING)

# Usage in application
logger = logging.getLogger(__name__)

async def optimize_unit(unit_id: str, request: OptimizeRequest):
    """Example with structured logging."""
    
    # Create logger adapter with context
    request_logger = logging.LoggerAdapter(logger, {
        'request_id': generate_request_id(),
        'unit_id': unit_id,
        'strategy': request.strategy
    })
    
    start_time = time.time()
    
    try:
        request_logger.info("Starting unit optimization")
        
        # ... optimization logic ...
        
        duration_ms = (time.time() - start_time) * 1000
        request_logger.info(
            "Optimization completed successfully", 
            extra={'duration_ms': duration_ms}
        )
        
        return result
        
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        request_logger.error(
            f"Optimization failed: {e}",
            extra={'duration_ms': duration_ms},
            exc_info=True
        )
        raise
```

### 2.3 Alerting Configuration

```yaml
# monitoring/alerts.yaml - Example alerting rules

alerts:
  # High-priority alerts
  - name: "Backend Service Down"
    condition: "http_status != 200"
    threshold: "failure_rate > 50% for 2 minutes"
    severity: "critical"
    notification_channels: ["pager_duty", "slack_critical"]
    
  - name: "Database Connection Failed"
    condition: "bigquery_connection_error"
    threshold: "error_count > 5 in 5 minutes"
    severity: "critical"
    notification_channels: ["pager_duty", "slack_critical"]
    
  - name: "High Response Time"
    condition: "response_time_95th_percentile"
    threshold: "> 10 seconds for 5 minutes"
    severity: "warning"
    notification_channels: ["slack_alerts"]
    
  - name: "High Error Rate"
    condition: "error_rate"
    threshold: "> 5% for 10 minutes"
    severity: "warning"
    notification_channels: ["slack_alerts"]
    
  # Resource alerts
  - name: "High Memory Usage"
    condition: "memory_usage_percent"
    threshold: "> 90% for 15 minutes"
    severity: "warning"
    notification_channels: ["slack_alerts"]
    
  - name: "High CPU Usage"
    condition: "cpu_usage_percent"
    threshold: "> 85% for 15 minutes"
    severity: "warning"
    notification_channels: ["slack_alerts"]
    
  # Business logic alerts
  - name: "Optimization Failure Rate High"
    condition: "optimization_success_rate"
    threshold: "< 90% for 30 minutes"
    severity: "warning"
    notification_channels: ["slack_alerts"]
    
  - name: "No Data Updates"
    condition: "last_data_update"
    threshold: "> 24 hours ago"
    severity: "warning"
    notification_channels: ["slack_alerts"]

notification_channels:
  slack_critical:
    webhook_url: "https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK"
    channel: "#alerts-critical"
    
  slack_alerts:
    webhook_url: "https://hooks.slack.com/services/YOUR/ALERTS/WEBHOOK"
    channel: "#alerts"
    
  pager_duty:
    integration_key: "YOUR_PAGER_DUTY_INTEGRATION_KEY"
```

## 3. Maintenance Procedures

### 3.1 Regular Maintenance Tasks

```bash
# Weekly Maintenance Checklist

# 1. System Health Review
echo "📊 Weekly System Health Review - $(date)"

# Check error rates
echo "🔍 Checking error rates (last 7 days)..."
# Query your logging system for error statistics

# Review performance metrics
echo "⚡ Performance metrics review..."
curl -s https://your-api-url/health/detailed | jq '.application_metrics'

# Check disk usage
echo "💾 Disk usage check..."
df -h

# Review BigQuery costs
echo "💰 BigQuery cost review..."
# Check BigQuery usage and costs in GCP Console

# Security updates
echo "🔒 Security updates check..."
cd backend
poetry update --dry-run
cd ../frontend
npm audit

# Database maintenance
echo "🗄️ Database optimization..."
# Check BigQuery slot usage and query performance

# Log rotation and cleanup
echo "🧹 Log cleanup..."
# Clean up old log files if storing locally

echo "✅ Weekly maintenance complete!"
```

### 3.2 Database Maintenance

```sql
-- BigQuery Maintenance Queries

-- 1. Check table sizes and costs
SELECT 
  table_name,
  ROUND(size_bytes / (1024*1024*1024), 2) as size_gb,
  row_count,
  creation_time
FROM `rentroll-ai.INFORMATION_SCHEMA.TABLES`
WHERE table_schema IN ('staging', 'mart', 'rentroll')
ORDER BY size_bytes DESC;

-- 2. Query performance analysis
SELECT
  query,
  user_email,
  start_time,
  end_time,
  TIMESTAMP_DIFF(end_time, start_time, MILLISECOND) as duration_ms,
  total_bytes_processed,
  total_slot_ms
FROM `rentroll-ai.INFORMATION_SCHEMA.JOBS_BY_PROJECT`
WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND state = 'DONE'
  AND total_slot_ms > 1000  -- Focus on expensive queries
ORDER BY total_slot_ms DESC
LIMIT 20;

-- 3. Data freshness check
SELECT 
  'unit_snapshot' as table_name,
  MAX(CAST(data_last_modified AS TIMESTAMP)) as last_modified
FROM `rentroll-ai.mart.INFORMATION_SCHEMA.TABLES`
WHERE table_name = 'unit_snapshot'

UNION ALL

SELECT
  'Competition' as table_name,
  MAX(CAST(data_last_modified AS TIMESTAMP)) as last_modified  
FROM `rentroll-ai.rentroll.INFORMATION_SCHEMA.TABLES`
WHERE table_name = 'Competition';

-- 4. Refresh materialized views (if using)
-- Run this during low-traffic periods
CALL BQ.REFRESH_MATERIALIZED_VIEW('rentroll-ai.mart.unit_competitor_pairs');
```

### 3.3 Performance Optimization

```python
# Performance Monitoring and Optimization

class PerformanceOptimizer:
    """Tools for monitoring and optimizing system performance."""
    
    def __init__(self):
        self.metrics_collector = MetricsCollector()
        
    async def analyze_slow_queries(self) -> List[Dict]:
        """
        Identify and analyze slow BigQuery queries.
        
        Returns:
            List of slow queries with analysis
        """
        slow_queries = []
        
        # Query BigQuery job history
        query = """
        SELECT
            query,
            start_time,
            end_time,
            TIMESTAMP_DIFF(end_time, start_time, MILLISECOND) as duration_ms,
            total_bytes_processed,
            total_slot_ms
        FROM `rentroll-ai.INFORMATION_SCHEMA.JOBS_BY_PROJECT`
        WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
          AND state = 'DONE'
          AND TIMESTAMP_DIFF(end_time, start_time, MILLISECOND) > 5000  -- > 5 seconds
        ORDER BY duration_ms DESC
        LIMIT 10
        """
        
        result = db_service.client.query(query).to_dataframe()
        
        for _, row in result.iterrows():
            slow_queries.append({
                'query': row['query'][:200] + '...',  # Truncate for readability
                'duration_ms': row['duration_ms'],
                'bytes_processed': row['total_bytes_processed'],
                'slot_ms': row['total_slot_ms'],
                'optimization_suggestions': self._suggest_optimizations(row['query'])
            })
        
        return slow_queries
    
    def _suggest_optimizations(self, query: str) -> List[str]:
        """Suggest query optimizations based on patterns."""
        suggestions = []
        
        if 'SELECT *' in query:
            suggestions.append("Avoid SELECT *, specify only needed columns")
        
        if 'WHERE' not in query and 'FROM' in query:
            suggestions.append("Add WHERE clause to filter data")
        
        if 'LIMIT' not in query:
            suggestions.append("Consider adding LIMIT for large result sets")
        
        if 'JOIN' in query and 'ON' not in query:
            suggestions.append("Ensure JOINs have proper ON conditions")
        
        return suggestions
    
    async def optimize_cache_settings(self):
        """Optimize application caching based on usage patterns."""
        
        # Analyze cache hit rates
        cache_stats = await self.get_cache_statistics()
        
        recommendations = []
        
        if cache_stats['hit_rate'] < 0.8:
            recommendations.append("Consider increasing cache TTL")
        
        if cache_stats['eviction_rate'] > 0.1:
            recommendations.append("Consider increasing cache size")
        
        return {
            'current_stats': cache_stats,
            'recommendations': recommendations
        }
```

## 4. Debugging & Troubleshooting

### 4.1 Common Issues & Solutions

#### Issue: Backend Service Not Responding

```bash
# Debugging Steps

# 1. Check service status
curl -I https://your-backend-url/health
# Expected: HTTP/200

# 2. Check logs
# Railway: Check deployment logs in Railway dashboard
# Cloud Run: gcloud logs read --service=rentroll-backend --limit=100

# 3. Check environment variables
# Verify all required env vars are set correctly

# 4. Test database connection
curl -s https://your-backend-url/health/detailed | jq '.components.bigquery'
# Expected: {"status": "healthy", ...}

# 5. Check resource usage
# Railway: Monitor CPU/Memory in dashboard  
# Cloud Run: Check metrics in GCP Console

# Common Solutions:
# - Restart the service
# - Check for memory leaks
# - Verify BigQuery credentials
# - Scale up resources if needed
```

#### Issue: BigQuery Connection Errors

```python
# BigQuery Debugging Tools

async def diagnose_bigquery_connection():
    """
    Comprehensive BigQuery connection diagnosis.
    
    Returns:
        Detailed diagnosis report
    """
    diagnosis = {
        'timestamp': datetime.utcnow().isoformat(),
        'tests': {}
    }
    
    # Test 1: Client initialization
    try:
        client = bigquery.Client()
        diagnosis['tests']['client_init'] = {
            'status': 'pass',
            'project_id': client.project
        }
    except Exception as e:
        diagnosis['tests']['client_init'] = {
            'status': 'fail',
            'error': str(e)
        }
        return diagnosis
    
    # Test 2: Authentication
    try:
        datasets = list(client.list_datasets(max_results=1))
        diagnosis['tests']['authentication'] = {
            'status': 'pass',
            'dataset_count': len(datasets)
        }
    except Exception as e:
        diagnosis['tests']['authentication'] = {
            'status': 'fail',
            'error': str(e)
        }
    
    # Test 3: Query execution
    try:
        query = "SELECT 1 as test_value"
        result = client.query(query).result()
        diagnosis['tests']['query_execution'] = {
            'status': 'pass',
            'result_count': result.total_rows
        }
    except Exception as e:
        diagnosis['tests']['query_execution'] = {
            'status': 'fail',
            'error': str(e)
        }
    
    # Test 4: Table access
    try:
        table_id = settings.rentroll_table_id
        table = client.get_table(table_id)
        diagnosis['tests']['table_access'] = {
            'status': 'pass',
            'table_rows': table.num_rows,
            'last_modified': table.modified.isoformat()
        }
    except Exception as e:
        diagnosis['tests']['table_access'] = {
            'status': 'fail',
            'error': str(e)
        }
    
    return diagnosis

# Usage
@app.get("/debug/bigquery")
async def debug_bigquery():
    """Debug endpoint for BigQuery issues."""
    return await diagnose_bigquery_connection()
```

#### Issue: Frontend Not Loading Data

```typescript
// Frontend Debugging Tools

// Debug API connectivity
const debugApiConnection = async () => {
  const tests = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: Network connectivity
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
    tests.tests.network = {
      status: response.ok ? 'pass' : 'fail',
      http_status: response.status,
      url: `${import.meta.env.VITE_API_URL}/health`
    };
  } catch (error) {
    tests.tests.network = {
      status: 'fail',
      error: error.message
    };
  }
  
  // Test 2: CORS configuration
  try {
    const response = await apiService.getPortfolioAnalytics();
    tests.tests.cors = {
      status: 'pass',
      data_received: !!response
    };
  } catch (error) {
    tests.tests.cors = {
      status: 'fail',
      error: error.message,
      is_cors_error: error.message.includes('CORS')
    };
  }
  
  // Test 3: Authentication
  const token = localStorage.getItem('auth_token');
  tests.tests.authentication = {
    status: token ? 'pass' : 'warning',
    token_present: !!token,
    token_length: token?.length || 0
  };
  
  console.log('API Debug Results:', tests);
  return tests;
};

// Add to window for console debugging
if (typeof window !== 'undefined') {
  window.debugApiConnection = debugApiConnection;
}
```

### 4.2 Performance Debugging

```python
# Performance Profiling Tools

import cProfile
import pstats
import time
from functools import wraps

def profile_performance(func):
    """Decorator to profile function performance."""
    
    @wraps(func)
    async def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
        finally:
            profiler.disable()
            end_time = time.time()
            
            # Log performance stats
            stats = pstats.Stats(profiler)
            stats.sort_stats('cumulative')
            
            logger.info(f"Performance profile for {func.__name__}", extra={
                'function': func.__name__,
                'duration_ms': (end_time - start_time) * 1000,
                'stats': stats.get_stats_profile()
            })
        
        return result
    
    return wrapper

# Usage
@profile_performance
async def optimize_unit_with_profiling(unit_id: str, request: OptimizeRequest):
    """Optimized unit with performance profiling."""
    return await optimize_unit(unit_id, request)

# Memory profiling
import tracemalloc

class MemoryProfiler:
    """Context manager for memory profiling."""
    
    def __init__(self, description: str):
        self.description = description
        
    def __enter__(self):
        tracemalloc.start()
        self.start_memory = tracemalloc.get_traced_memory()[0]
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        current_memory, peak_memory = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        memory_used = current_memory - self.start_memory
        
        logger.info(f"Memory profile: {self.description}", extra={
            'memory_used_mb': memory_used / (1024 * 1024),
            'peak_memory_mb': peak_memory / (1024 * 1024)
        })

# Usage
async def memory_intensive_operation():
    with MemoryProfiler("BigQuery data processing"):
        # ... memory-intensive code ...
        pass
```

### 4.3 Error Investigation Tools

```bash
#!/bin/bash
# scripts/investigate-error.sh

echo "🔍 Error Investigation Tool"

# Function to check logs
check_logs() {
    echo "📋 Checking recent error logs..."
    
    # Railway logs (if using Railway)
    if command -v railway &> /dev/null; then
        echo "Railway Backend Logs (last 100 lines):"
        railway logs --tail 100
    fi
    
    # Local logs
    if [ -f "logs/app.log" ]; then
        echo "Local Error Logs (last 20 errors):"
        grep -i "error\|exception\|failed" logs/app.log | tail -20
    fi
}

# Function to check system resources
check_resources() {
    echo "💻 System Resource Check..."
    
    echo "Memory Usage:"
    free -h
    
    echo "Disk Usage:"
    df -h
    
    echo "CPU Usage:"
    top -bn1 | grep "Cpu(s)"
    
    echo "Network Connectivity:"
    ping -c 3 8.8.8.8
}

# Function to test external dependencies
test_dependencies() {
    echo "🔗 Testing External Dependencies..."
    
    # BigQuery connectivity
    echo "BigQuery Test:"
    python3 -c "
from google.cloud import bigquery
try:
    client = bigquery.Client()
    query = 'SELECT 1 as test'
    result = client.query(query).result()
    print('✅ BigQuery connection successful')
except Exception as e:
    print(f'❌ BigQuery connection failed: {e}')
"
    
    # API endpoint test
    echo "API Health Check:"
    BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}, Response Time: %{time_total}s\n" "$BACKEND_URL/health"
}

# Function to analyze error patterns
analyze_error_patterns() {
    echo "📊 Error Pattern Analysis..."
    
    if [ -f "logs/app.log" ]; then
        echo "Most Common Errors (last 1000 lines):"
        tail -1000 logs/app.log | grep -i "error" | cut -d' ' -f6- | sort | uniq -c | sort -nr | head -10
        
        echo "Error Timeline (last 24 hours):"
        tail -1000 logs/app.log | grep -i "error" | grep "$(date '+%Y-%m-%d')" | wc -l
        echo "errors in the last 24 hours"
    fi
}

# Main execution
case "${1:-all}" in
    "logs")
        check_logs
        ;;
    "resources")
        check_resources
        ;;
    "dependencies")
        test_dependencies
        ;;
    "patterns")
        analyze_error_patterns
        ;;
    "all")
        check_logs
        echo ""
        check_resources
        echo ""
        test_dependencies
        echo ""
        analyze_error_patterns
        ;;
    *)
        echo "Usage: $0 {logs|resources|dependencies|patterns|all}"
        exit 1
        ;;
esac
```

## 5. Backup & Recovery

### 5.1 Backup Procedures

```bash
#!/bin/bash
# scripts/backup-system.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$BACKUP_DATE"

echo "💾 Starting system backup - $BACKUP_DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# 1. Code backup (Git repository)
echo "📁 Backing up code repository..."
git archive --format=tar.gz --output="$BACKUP_DIR/code_backup.tar.gz" HEAD

# 2. Configuration backup
echo "⚙️ Backing up configuration..."
cp backend/.env "$BACKUP_DIR/backend_env_backup" 2>/dev/null || echo "No backend .env found"
cp frontend/.env "$BACKUP_DIR/frontend_env_backup" 2>/dev/null || echo "No frontend .env found"

# 3. BigQuery schema backup
echo "🗄️ Backing up BigQuery schema..."
bq show --schema --format=prettyjson rentroll-ai:staging.our_units > "$BACKUP_DIR/schema_our_units.json"
bq show --schema --format=prettyjson rentroll-ai:staging.comps > "$BACKUP_DIR/schema_comps.json"
bq show --schema --format=prettyjson rentroll-ai:mart.unit_snapshot > "$BACKUP_DIR/schema_unit_snapshot.json"

# 4. Export sample data for testing
echo "📊 Exporting sample data..."
bq extract --destination_format=CSV rentroll-ai:mart.unit_snapshot "gs://your-backup-bucket/sample_data_$BACKUP_DATE.csv"

# 5. Application logs backup
echo "📋 Backing up logs..."
if [ -d "logs" ]; then
    tar -czf "$BACKUP_DIR/logs_backup.tar.gz" logs/
fi

# 6. Create backup manifest
echo "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/backup_manifest.json" << EOF
{
  "backup_date": "$BACKUP_DATE",
  "backup_type": "full_system",
  "components": {
    "code": "code_backup.tar.gz",
    "backend_config": "backend_env_backup",
    "frontend_config": "frontend_env_backup",
    "bigquery_schemas": ["schema_*.json"],
    "sample_data": "gs://your-backup-bucket/sample_data_$BACKUP_DATE.csv",
    "logs": "logs_backup.tar.gz"
  },
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git branch --show-current)"
}
EOF

echo "✅ Backup completed: $BACKUP_DIR"
echo "📦 Backup size: $(du -sh $BACKUP_DIR | cut -f1)"
```

### 5.2 Disaster Recovery Plan

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

echo "🚨 Disaster Recovery Procedure"
echo "==============================="

# Recovery steps checklist
cat << 'EOF'
DISASTER RECOVERY CHECKLIST:

Phase 1: Assessment
□ Identify the scope of the outage
□ Determine if this is a partial or complete failure
□ Estimate data loss timeframe
□ Notify stakeholders

Phase 2: Immediate Response  
□ Switch to maintenance mode page
□ Stop incoming traffic if necessary
□ Assess data integrity
□ Identify root cause

Phase 3: Recovery Execution
□ Restore from backup if needed
□ Redeploy services
□ Validate data consistency
□ Test critical functionality

Phase 4: Verification & Monitoring
□ Run full system health check
□ Monitor error rates and performance
□ Validate all features working
□ Resume normal operations

Phase 5: Post-Incident
□ Document incident timeline
□ Analyze root cause
□ Implement preventive measures
□ Update runbooks
EOF

echo ""
echo "Select recovery action:"
echo "1) Quick service restart"
echo "2) Restore from latest backup"
echo "3) Full disaster recovery"
echo "4) Exit"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🔄 Performing quick service restart..."
        # Railway restart
        railway service restart || echo "Railway restart failed"
        
        # Verify health
        sleep 30
        curl -f https://your-backend-url/health && echo "✅ Service restored" || echo "❌ Service still unhealthy"
        ;;
        
    2)
        echo "💾 Restoring from latest backup..."
        LATEST_BACKUP=$(ls -t backups/ | head -1)
        echo "Latest backup: $LATEST_BACKUP"
        
        read -p "Proceed with restore? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            # Restore procedure
            echo "Implementing restore from $LATEST_BACKUP..."
            # Add specific restore commands here
        fi
        ;;
        
    3)
        echo "🆘 Full disaster recovery procedure..."
        echo "This will:"
        echo "- Restore all services from backup"
        echo "- Recreate BigQuery tables"
        echo "- Redeploy all components"
        
        read -p "Are you sure? This is destructive. (yes/NO): " confirm
        if [[ $confirm == "yes" ]]; then
            echo "Implementing full disaster recovery..."
            # Add full recovery procedure
        fi
        ;;
        
    4)
        echo "Exiting disaster recovery tool"
        exit 0
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
```

## 6. Resource Consumption Profiles

### 6.1 Normal Operation Baseline

```yaml
# Resource Consumption Profiles

normal_operation:
  backend:
    cpu_usage: "10-30%"
    memory_usage: "200-400 MB"
    disk_io: "Low (< 10 IOPS)"
    network: "1-10 Mbps"
    bigquery_queries: "10-50 per hour"
    
  frontend:
    cpu_usage: "5-15% (build time)"
    memory_usage: "100-200 MB (build time)"
    bandwidth: "CDN cached (< 1 MB/user)"
    concurrent_users: "5-25"
    
  database:
    query_response_time: "< 2 seconds (95th percentile)"
    data_processed: "10-100 GB per day"
    slot_usage: "< 100 slot-seconds per hour"
    cost: "$5-20 per day"

peak_operation:
  backend:
    cpu_usage: "60-80%"
    memory_usage: "600-800 MB"
    disk_io: "Medium (20-50 IOPS)"
    network: "50-100 Mbps"
    bigquery_queries: "100-200 per hour"
    
  frontend:
    bandwidth: "10-50 Mbps"
    concurrent_users: "50-100"
    
  database:
    query_response_time: "< 5 seconds (95th percentile)"
    data_processed: "100-500 GB per day"
    slot_usage: "< 500 slot-seconds per hour"
    cost: "$20-100 per day"

alert_thresholds:
  backend:
    cpu_usage: "> 85%"
    memory_usage: "> 1 GB"
    response_time: "> 10 seconds"
    error_rate: "> 5%"
    
  database:
    query_timeout: "> 30 seconds"
    error_rate: "> 1%"
    cost: "> $200 per day"
```

### 6.2 Resource Monitoring Scripts

```python
# Resource monitoring implementation
import psutil
import time
from datetime import datetime, timedelta

class ResourceMonitor:
    """Monitor and report system resource usage."""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.metrics_history = []
    
    def collect_metrics(self) -> Dict[str, Any]:
        """Collect current system metrics."""
        
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()
        
        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'uptime_hours': (datetime.utcnow() - self.start_time).total_seconds() / 3600,
            'cpu': {
                'usage_percent': cpu_percent,
                'load_average': os.getloadavg()[0] if hasattr(os, 'getloadavg') else None,
                'core_count': psutil.cpu_count()
            },
            'memory': {
                'usage_percent': memory.percent,
                'used_mb': memory.used / (1024 * 1024),
                'available_mb': memory.available / (1024 * 1024),
                'total_mb': memory.total / (1024 * 1024)
            },
            'disk': {
                'usage_percent': disk.percent,
                'used_gb': disk.used / (1024 ** 3),
                'free_gb': disk.free / (1024 ** 3),
                'total_gb': disk.total / (1024 ** 3)
            },
            'network': {
                'bytes_sent': network.bytes_sent,
                'bytes_recv': network.bytes_recv,
                'packets_sent': network.packets_sent,
                'packets_recv': network.packets_recv
            }
        }
        
        self.metrics_history.append(metrics)
        
        # Keep only last 24 hours of metrics
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        self.metrics_history = [
            m for m in self.metrics_history 
            if datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00')) > cutoff_time
        ]
        
        return metrics
    
    def get_resource_summary(self) -> Dict[str, Any]:
        """Get resource usage summary over time."""
        
        if not self.metrics_history:
            return {'error': 'No metrics collected yet'}
        
        recent_metrics = self.metrics_history[-12:]  # Last 12 samples
        
        cpu_values = [m['cpu']['usage_percent'] for m in recent_metrics]
        memory_values = [m['memory']['usage_percent'] for m in recent_metrics]
        
        return {
            'sample_count': len(recent_metrics),
            'time_range_hours': 1,  # Last hour
            'cpu': {
                'average': sum(cpu_values) / len(cpu_values),
                'maximum': max(cpu_values),
                'minimum': min(cpu_values)
            },
            'memory': {
                'average': sum(memory_values) / len(memory_values),
                'maximum': max(memory_values),
                'minimum': min(memory_values)
            },
            'alerts': self._check_alerts(recent_metrics[-1])
        }
    
    def _check_alerts(self, current_metrics: Dict) -> List[str]:
        """Check current metrics against alert thresholds."""
        
        alerts = []
        
        if current_metrics['cpu']['usage_percent'] > 85:
            alerts.append(f"High CPU usage: {current_metrics['cpu']['usage_percent']:.1f}%")
        
        if current_metrics['memory']['usage_percent'] > 90:
            alerts.append(f"High memory usage: {current_metrics['memory']['usage_percent']:.1f}%")
        
        if current_metrics['disk']['usage_percent'] > 95:
            alerts.append(f"High disk usage: {current_metrics['disk']['usage_percent']:.1f}%")
        
        return alerts

# Global resource monitor instance
resource_monitor = ResourceMonitor()

# Endpoint for monitoring
@app.get("/monitoring/resources")
async def get_resource_metrics():
    """Get current resource usage metrics."""
    current_metrics = resource_monitor.collect_metrics()
    summary = resource_monitor.get_resource_summary()
    
    return {
        'current': current_metrics,
        'summary': summary
    }
```

---

## Emergency Contacts

### On-Call Engineers
- **Primary:** engineering-team@company.com
- **Secondary:** devops-team@company.com  
- **Manager:** engineering-manager@company.com

### External Services
- **Railway Support:** https://railway.app/help
- **Vercel Support:** https://vercel.com/support
- **Google Cloud Support:** https://cloud.google.com/support

### Escalation Matrix
1. **Level 1** (0-30 min): On-call engineer
2. **Level 2** (30-60 min): Engineering manager
3. **Level 3** (60+ min): CTO/VP Engineering

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | August 2024 | DevOps Team | Initial runbook |

---

**Document Classification:** Internal Operations Documentation  
**Review Cycle:** Monthly  
**Next Review:** September 2024 