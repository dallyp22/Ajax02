# AI Rent Optimizer - Multi-Tenant SaaS Platform

A sophisticated, multi-tenant SaaS platform for rental property management that leverages Google BigQuery for real-time competitive intelligence and AI-powered pricing optimization. Built for property management companies to optimize their rental pricing strategies with data-driven insights.

## Features

### 🎯 **Core Functionality**
- **Multi-Tenant SaaS Architecture** - Complete client isolation with dedicated BigQuery datasets
- **Super Admin Interface** - Client and user management with role-based access control (super_admin, client_admin, client_user)
- **Auth0 Authentication** - Secure JWT-based authentication with role-based access
- **Data Upload System** - Monthly rent roll and competition data uploads with historical tracking
- **Real-time BigQuery Integration** - Connect to live rental and competition data
- **Competitive Intelligence** - Deep analysis against market competitors
- **Pricing Optimization** - Three strategies: Revenue Maximization, Lease-Up Speed, Balanced
- **Portfolio Analytics** - Comprehensive portfolio-wide insights
- **Property-Specific Analysis** - Detailed competitive positioning per property

### 📊 **Analytics Dashboard**
- **Portfolio Overview** - Market position, occupancy, revenue opportunities
- **Property vs Competition** - Rent comparison and market positioning by unit type
- **Unit Analysis** - Individual unit competitive analysis and revenue optimization
- **Market Trends** - Rent distribution and competitive landscape analysis

### ⚙️ **Technical Features**
- **Dark Industrial UI** - Modern command center interface
- **Real-time Data** - Live BigQuery connections with efficient caching
- **Responsive Design** - Works across desktop and mobile devices
- **Settings Management** - Configurable BigQuery table connections

## Architecture

```
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py          # API endpoints
│   │   ├── database.py      # BigQuery service layer
│   │   ├── pricing.py       # Optimization algorithms
│   │   ├── models.py        # Pydantic data models
│   │   └── config.py        # Configuration management
│   └── pyproject.toml       # Python dependencies
├── frontend/         # React TypeScript frontend
│   ├── src/
│   │   ├── pages/           # Main application pages
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API client and utilities
│   │   └── types/           # TypeScript type definitions
│   └── package.json         # Node.js dependencies
├── sql/              # BigQuery schema and queries
│   ├── staging/             # Data normalization views
│   ├── mart/                # Analytics-ready tables
│   └── setup_bigquery.sql   # Complete schema setup
└── infra/            # Infrastructure and deployment
    ├── docker-compose.yml   # Local development
    └── deploy-cloud-run.sh  # Google Cloud deployment
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+ and Poetry
- **Google Cloud Account** with BigQuery access
- **Service Account** with BigQuery Data Viewer permissions

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd BigQuery_6
```

### 2. Backend Setup
```bash
cd backend
poetry install
cp .env.example .env
# Configure your Google Cloud credentials in .env
poetry run uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure API URL in .env
npm run dev
```

### 4. BigQuery Setup
```sql
-- Run the SQL files to set up your BigQuery schema
-- 1. Execute sql/setup_bigquery.sql
-- 2. Update table IDs in the application Settings page
```

## Configuration

### Environment Variables

**Backend (.env):**
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
BIGQUERY_PROJECT_ID=your-project-id
RENTROLL_TABLE_ID=your.rentroll.table
COMPETITION_TABLE_ID=your.competition.table
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_DEMO_MODE=false
VITE_APP_NAME=AI Rent Optimizer
```

## Usage

1. **Access the Application** - Navigate to http://localhost:3000
2. **Configure Data Sources** - Use the Settings page to connect your BigQuery tables
3. **Explore Portfolio** - View portfolio-wide analytics and insights
4. **Analyze Properties** - Select specific properties for detailed competitive analysis
5. **Optimize Units** - Use the Units page for individual unit optimization

## API Endpoints

### Core Analytics
- `GET /api/v1/units` - Retrieve all rental units
- `GET /api/v1/units/{unit_id}/comparables` - Get comparable units
- `POST /api/v1/units/{unit_id}/optimize` - Optimize unit pricing

### Portfolio Analytics
- `GET /api/v1/analytics/portfolio` - Portfolio-wide metrics
- `GET /api/v1/analytics/market-position` - Market positioning analysis
- `GET /api/v1/analytics/pricing-opportunities` - Revenue opportunities

### Property-Specific Analytics
- `GET /api/v1/properties` - List all properties
- `GET /api/v1/analytics/property/{name}/competition` - Property vs competition
- `GET /api/v1/analytics/property/{name}/units` - Property unit analysis
- `GET /api/v1/analytics/property/{name}/market-trends` - Property market trends

### Configuration
- `GET /api/v1/settings` - Get current table settings
- `POST /api/v1/settings` - Update table settings
- `POST /api/v1/settings/test` - Test table connections

## Data Requirements

### Rent Roll Table Schema
Required columns: `Unit`, `Property`, `Status`, `Bed`, `Bath`, `Sq_Ft`, `Advertised_Rent`, `Move_out`, `Lease_To`

### Competition Table Schema
Required columns: `Property`, `Unit`, `Bed`, `Bath`, `Sq_Ft`, `Base_Price`, `Availability`

## Development

### Running Tests
```bash
# Backend tests
cd backend && poetry run pytest

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Backend
cd backend && poetry build

# Frontend
cd frontend && npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is proprietary software. All rights reserved. 