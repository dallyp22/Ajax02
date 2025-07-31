# RentRoll AI Optimizer

> **AI-powered rent optimization for rental properties**

A comprehensive web application that connects live to BigQuery data sources, compares rental units with comparable properties, and provides optimized rent recommendations using three distinct strategies: Revenue Maximization, Lease-Up Time Minimization, and Balanced optimization.

## 🏗️ Architecture

| Layer          | Technology                    | Purpose                                    |
| -------------- | ----------------------------- | ------------------------------------------ |
| **Frontend**   | React + TypeScript + Vite    | Interactive UI with Material-UI DataGrid  |
| **Backend**    | FastAPI + Python 3.11        | REST API with async operations             |
| **Analytics**  | SciPy + NumPy + Scikit-learn | Pricing optimization algorithms            |
| **Database**   | Google BigQuery               | Data warehouse with staging and mart layers|
| **Deployment** | Google Cloud Run + Docker     | Serverless container deployment            |

## 📊 Features

### Core Functionality
- **Unit Management**: View and filter 3,000+ rental units with comprehensive details
- **Comparable Analysis**: Automatically match units with similar competitor properties
- **Optimization Strategies**:
  - **Revenue Maximization**: Maximize rental income using demand curves
  - **Lease-Up Minimization**: Minimize vacancy time with competitive pricing
  - **Balanced**: User-weighted combination of both strategies
- **Batch Processing**: Optimize multiple vacant units simultaneously

### User Interface
- **Interactive DataGrid**: Sortable, filterable units table with status indicators
- **Optimization Modal**: Detailed unit analysis with strategy selection and results visualization
- **Price Comparison Charts**: Visual comparison of current, suggested, and competitor pricing
- **Real-time Updates**: Live data from BigQuery with scheduled refreshes

### Data Pipeline
- **Staging Views**: Normalized schemas from raw BigQuery tables
- **Feature Engineering**: Automated calculation of pricing urgency, revenue potential, etc.
- **Similarity Matching**: ML-powered comparable unit identification
- **Nightly Refresh**: Automated data pipeline with scheduled queries

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** and **Poetry** (for backend)
- **Node.js 18+** and **npm** (for frontend)
- **Google Cloud SDK** (for deployment)
- **BigQuery access** to `rentroll-ai` project

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BigQuery_6
   ```

2. **Set up BigQuery**
   ```bash
   # Run the SQL setup script
   bq query --use_legacy_sql=false < sql/setup_bigquery.sql
   ```

3. **Start the backend**
   ```bash
   cd backend
   poetry install
   python dev.py
   ```
   Backend will be available at http://localhost:8000

4. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will be available at http://localhost:3000

### Using Docker Compose

```bash
cd infra
docker-compose up -d
```

This will start both frontend and backend services with proper networking.

## 📁 Project Structure

```
BigQuery_6/
├── sql/                          # BigQuery SQL scripts
│   ├── staging/                  # Normalized views
│   ├── mart/                     # Feature-engineered tables
│   ├── scheduled_queries/        # Automated refresh queries
│   └── setup_bigquery.sql        # Complete setup script
├── backend/                      # FastAPI Python backend
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Pydantic request/response models
│   │   ├── pricing.py           # Optimization algorithms
│   │   ├── database.py          # BigQuery service layer
│   │   └── config.py            # Application configuration
│   ├── tests/                   # Unit tests
│   ├── Dockerfile               # Backend container
│   └── pyproject.toml           # Poetry dependencies
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API client
│   │   ├── types/               # TypeScript definitions
│   │   └── main.tsx             # Application entry point
│   ├── Dockerfile               # Frontend container
│   └── package.json             # NPM dependencies
├── infra/                       # Infrastructure configuration
│   ├── docker-compose.yml       # Local development
│   └── deploy-cloud-run.sh      # Cloud deployment
└── docs/                        # Documentation
```

## 🔧 API Endpoints

### Units Management
- `GET /api/v1/units` - List units with pagination and filters
- `GET /api/v1/units/{unit_id}/comparables` - Get comparable units

### Optimization
- `POST /api/v1/units/{unit_id}/optimize` - Optimize single unit
- `POST /api/v1/batch/optimize` - Batch optimize multiple units

### Metadata
- `GET /api/v1/properties` - List all properties
- `GET /api/v1/summary` - Portfolio statistics
- `GET /health` - Health check endpoint

### Example API Usage

```bash
# Get units needing pricing
curl "http://localhost:8000/api/v1/units?needs_pricing_only=true&page=1&page_size=10"

# Optimize a unit with revenue strategy
curl -X POST "http://localhost:8000/api/v1/units/UNIT_001/optimize" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "revenue"}'

# Batch optimize vacant units
curl -X POST "http://localhost:8000/api/v1/batch/optimize" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "balanced", "weight": 0.6, "max_units": 50}'
```

## 🧮 Pricing Algorithms

### Demand Curve Modeling
The optimization engine uses a demand elasticity model to predict rental probability:

```python
def demand_probability(price, base_price, elasticity=-0.003):
    price_ratio = (price - base_price) / base_price
    return max(0.05, min(0.95, 1 + elasticity * price_ratio * 100))
```

### Revenue Maximization
Optimizes for maximum expected annual revenue:
```
Revenue = Price × Demand_Probability × 12_months
```

### Lease-Up Minimization
Optimizes for minimum expected vacancy time:
```
Expected_Days_Vacant = 30 / Demand_Probability
```

### Balanced Strategy
Weighted combination of both strategies:
```
Optimal_Price = Revenue_Price × weight + LeaseUp_Price × (1 - weight)
```

## 🚀 Deployment

### Google Cloud Run

1. **Set up Google Cloud**
   ```bash
   gcloud auth login
   gcloud config set project rentroll-ai
   ```

2. **Deploy to Cloud Run**
   ```bash
   cd infra
   chmod +x deploy-cloud-run.sh
   ./deploy-cloud-run.sh production
   ```

### Environment Variables

**Backend Configuration:**
```env
GCP_PROJECT_ID=rentroll-ai
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
BIGQUERY_DATASET_STAGING=staging
BIGQUERY_DATASET_MART=mart
DEFAULT_ELASTICITY=-0.003
MAX_PRICE_ADJUSTMENT=0.25
```

**Frontend Configuration:**
```env
VITE_API_BASE_URL=https://your-backend-url.run.app
```

## 📈 Data Schema

### Source Tables
- `rentroll-ai.rentroll.Update_7_8_native` - Our rental units
- `rentroll-ai.rentroll.Competition` - Competitor units

### Staging Views
- `staging.our_units` - Normalized unit data with computed fields
- `staging.comps` - Normalized competitor data

### Data Mart
- `mart.unit_snapshot` - Feature-engineered unit view
- `mart.unit_competitor_pairs` - Pre-computed similar unit matches

## 🧪 Testing

### Backend Tests
```bash
cd backend
poetry run pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Integration Tests
```bash
# Start the backend locally
cd backend && python dev.py

# Test health endpoint
curl http://localhost:8000/health

# Test API documentation
open http://localhost:8000/docs
```

## 🔍 Monitoring & Observability

### Health Checks
- Backend: `GET /health` - Returns BigQuery connectivity status
- Frontend: Nginx health check on port 3000

### Logging
- **Backend**: Structured logging with configurable levels
- **BigQuery**: Query job monitoring in Google Cloud Console
- **Cloud Run**: Centralized logging in Google Cloud Logging

### Performance Metrics
- API response times via FastAPI middleware
- Concurrent optimization tracking
- BigQuery query performance monitoring

## 🛡️ Security

### Authentication
- Service account authentication for BigQuery access
- CORS configuration for cross-origin requests

### Data Access
- Row-level security in BigQuery (configurable)
- IAM-based access control to Google Cloud resources

### Input Validation
- Pydantic models for request validation
- SQL injection prevention through parameterized queries

## 🔄 Next Steps

### Phase 2 Enhancements
1. **ML Model Calibration**: Train demand elasticity on historical leasing data
2. **A/B Testing Framework**: Validate optimization strategies
3. **Approval Workflow**: Integration with property management systems
4. **Advanced Analytics**: Market trend analysis and forecasting

### Scaling Considerations
1. **BigQuery ML Migration**: Move optimization logic to BigQuery for serverless scaling
2. **Caching Layer**: Redis for frequently accessed data
3. **Rate Limiting**: API throttling for production use
4. **Multi-tenancy**: Support for multiple property management companies

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test` and `poetry run pytest`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support:
- 📧 Email: support@rentroll-ai.com
- 📖 Documentation: [Internal Wiki](https://wiki.rentroll-ai.com)
- 🐛 Issues: Create a GitHub issue

---

Built with ❤️ by the RentRoll AI Team 