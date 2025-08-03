# Software Architecture Document (SAD)
## AI Rent Optimizer

**Document Version:** 1.0  
**Last Updated:** August 2024  
**Author:** System Architecture Team  

---

## 1. Executive Summary

The AI Rent Optimizer is a cloud-native, microservice-oriented rental property pricing optimization platform built using modern web technologies. The system employs a clear separation of concerns with a React-based frontend, FastAPI backend, and Google BigQuery data warehouse, designed for scalability, maintainability, and real-time analytics.

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (TypeScript)                                   │
│  ├── Material-UI Components                                    │
│  ├── React Query (State Management)                            │
│  ├── Recharts (Data Visualization)                             │
│  └── React Router (Navigation)                                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
                               HTTPS/REST API
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI Backend (Python 3.11+)                               │
│  ├── API Endpoints (/api/v1/*)                                 │
│  ├── Authentication Middleware                                 │
│  ├── CORS Configuration                                        │
│  ├── Error Handling & Logging                                  │
│  └── Custom JSON Serialization                                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
                            Service Layer API
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Core Services                                                  │
│  ├── Pricing Optimization Engine                               │
│  ├── Competitive Analysis Service                              │
│  ├── Portfolio Analytics Engine                                │
│  ├── BigQuery Data Service                                     │
│  └── Settings Management Service                               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                              BigQuery Client
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Google BigQuery Data Warehouse                                │
│  ├── Raw Data (rentroll.*, competition.*)                      │
│  ├── Staging Views (staging.our_units, staging.comps)          │
│  ├── Data Mart (mart.unit_snapshot, mart.unit_competitor_pairs)│
│  └── Analytics Tables (SvSN, ArchiveAptMain)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Overview

| Component | Technology | Purpose | Deployment |
|-----------|------------|---------|------------|
| Frontend SPA | React 18 + TypeScript + Vite | User Interface & Experience | Vercel / Static Hosting |
| Backend API | FastAPI + Python 3.11 + Poetry | Business Logic & Data Processing | Railway / Cloud Run |
| Data Warehouse | Google BigQuery | Data Storage & Analytics | Google Cloud Platform |
| Infrastructure | Docker + Cloud Services | Containerization & Deployment | Multi-cloud Strategy |

## 3. Architectural Patterns

### 3.1 Frontend Architecture Pattern

**Pattern:** Single Page Application (SPA) with Component-Based Architecture

```typescript
// Component Hierarchy
App (AuthProvider)
├── Layout (Navigation & Shell)
│   ├── DashboardPage (Portfolio Analytics)
│   ├── UnitsPage (Unit Management)
│   ├── AnalyticsPage (NuStyle vs Competition)
│   ├── MarketResearchPage (Archive Analysis)
│   └── SettingsPage (Configuration)
├── Shared Components
│   ├── OptimizationModal
│   ├── BatchOptimizationDialog
│   └── DataGrids & Charts
└── Services & Types
    ├── API Client (Axios + React Query)
    ├── Authentication Context
    └── TypeScript Interfaces
```

**Key Architectural Decisions:**
- **State Management:** React Query for server state, React Context for auth
- **Routing:** React Router for client-side navigation
- **Styling:** Material-UI with custom "Dark Industrial" theme
- **Data Fetching:** React Query with caching and background refetch

### 3.2 Backend Architecture Pattern

**Pattern:** Layered Architecture with Dependency Injection

```python
# Service Layer Architecture
main.py (FastAPI Application)
├── Presentation Layer
│   ├── API Endpoints (/api/v1/*)
│   ├── Request/Response Models (Pydantic)
│   ├── Authentication Middleware
│   └── Error Handling
├── Business Logic Layer
│   ├── pricing.py (Optimization Algorithms)
│   ├── database.py (Data Service)
│   ├── models.py (Domain Models)
│   └── utils.py (Shared Utilities)
└── Infrastructure Layer
    ├── config.py (Settings Management)
    ├── BigQuery Client Integration
    └── Logging & Monitoring
```

**Key Architectural Decisions:**
- **Framework:** FastAPI for high performance and automatic OpenAPI docs
- **Dependency Management:** Poetry for reproducible builds
- **Data Access:** Direct BigQuery client with custom service layer
- **Configuration:** Pydantic Settings with environment variable injection

### 3.3 Data Architecture Pattern

**Pattern:** Multi-Layered Data Warehouse with ELT Pipeline

```sql
-- Data Flow Architecture
Raw Data Sources
├── rentroll.Update_7_8_native (Units Data)
├── rentroll.Competition (Market Data)
└── rentroll.SvSN, ArchiveAptMain (Analytics Data)
         │
         ▼ (Views & Transformations)
Staging Layer
├── staging.our_units (Normalized Units)
└── staging.comps (Normalized Competition)
         │
         ▼ (Feature Engineering)
Data Mart Layer
├── mart.unit_snapshot (Analytics-Ready Units)
└── mart.unit_competitor_pairs (Pre-computed Comparisons)
         │
         ▼ (Real-time Queries)
Application Layer (FastAPI BigQuery Service)
```

## 4. Communication Patterns

### 4.1 Frontend-Backend Communication

**Pattern:** RESTful API with JSON over HTTPS

```typescript
// API Communication Pattern
const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Request/Response Flow
Frontend Component
  → React Query Hook
  → Axios HTTP Client
  → FastAPI Endpoint
  → Pydantic Validation
  → Service Layer
  → BigQuery Client
  → Data Response
  → JSON Serialization
  → HTTP Response
  → React Query Cache
  → Component Re-render
```

**API Endpoints Structure:**
```
/api/v1/
├── /health                          # Health checks
├── /units                           # Unit management
│   ├── /{unit_id}/comparables      # Comparable analysis
│   └── /{unit_id}/optimize         # Price optimization
├── /analytics/                      # Portfolio analytics
│   ├── /portfolio                  # Portfolio KPIs
│   ├── /market-position            # Market analysis
│   └── /property/{name}/*          # Property-specific
├── /svsn/*                         # NuStyle analytics
├── /archive/*                      # Archive analytics
└── /settings                       # Configuration
```

### 4.2 Backend-Database Communication

**Pattern:** Direct Database Client with Connection Pooling

```python
# BigQuery Communication Pattern
async def get_units_data(self, filters):
    # Query construction with parameterization
    query = f"""
    SELECT unit_id, property, bed, bath, sqft, advertised_rent
    FROM {self._get_table_name('mart', 'unit_snapshot')}
    WHERE property = @property_name
    """
    
    # Async query execution
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("property_name", "STRING", property_name)
        ]
    )
    result = self.client.query(query, job_config=job_config)
    return result.to_dataframe()
```

### 4.3 Authentication Flow

**Pattern:** Token-Based Authentication with Local Storage

```typescript
// Authentication Flow
User Login
  → Credential Validation (Client-side)
  → JWT Token Generation (Client-side)
  → Local Storage Persistence
  → Authorization Header Injection
  → Protected Route Access
  → Token Validation (Server-side)
  → Session Management
```

## 5. Deployment Architecture

### 5.1 Production Deployment Options

#### Option A: Split Microservice Deployment (Recommended)

```
Internet
    │
    ├── Vercel CDN (Frontend)
    │   ├── React SPA Hosting
    │   ├── Edge Caching
    │   └── SSL Termination
    │
    └── Railway (Backend)
        ├── FastAPI Container
        ├── Auto-scaling
        ├── Health Monitoring
        └── Environment Management
                │
                ▼
        Google Cloud BigQuery
        ├── Data Warehouse
        ├── Query Processing
        └── Service Account Auth
```

#### Option B: Google Cloud Run (Enterprise)

```
Google Cloud Platform
├── Cloud Run Frontend Service
│   ├── React Container
│   ├── HTTPS Load Balancer
│   └── CDN Integration
├── Cloud Run Backend Service
│   ├── FastAPI Container
│   ├── Auto-scaling (0-100 instances)
│   ├── VPC Connector
│   └── IAM Service Account
└── BigQuery Native Integration
    ├── Workload Identity
    ├── Query Caching
    └── Cost Optimization
```

### 5.2 Development Environment

```
Local Development
├── Frontend: npm run dev (Vite Dev Server)
├── Backend: poetry run uvicorn main:app --reload
├── Database: BigQuery (Cloud)
└── Infrastructure: Docker Compose (Optional)
```

### 5.3 Container Architecture

```dockerfile
# Backend Container Structure
FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev
COPY app/ ./app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Container Structure  
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 6. Security Architecture

### 6.1 Security Layers

```
Security Layer Stack
├── Transport Security
│   ├── HTTPS/TLS 1.3
│   ├── CORS Configuration
│   └── Content Security Policy
├── Application Security
│   ├── Input Validation (Pydantic)
│   ├── SQL Injection Prevention
│   └── XSS Protection
├── Authentication & Authorization
│   ├── JWT Token Management
│   ├── Role-Based Access Control
│   └── Session Management
└── Infrastructure Security
    ├── Service Account Minimal Permissions
    ├── Environment Variable Encryption
    └── Network Security Groups
```

### 6.2 Data Security

```python
# BigQuery Security Model
Service Account Permissions:
├── bigquery.dataViewer (Read-only access)
├── bigquery.jobUser (Query execution)
└── Specific dataset/table permissions

# Environment Security
Credential Management:
├── Google Application Credentials (Service Account JSON)
├── Base64 Encoding for Environment Variables
├── Environment-specific Configuration
└── Secret Management (Cloud Secret Manager)
```

## 7. Performance & Scalability

### 7.1 Performance Characteristics

| Component | Response Time | Throughput | Scalability |
|-----------|---------------|------------|-------------|
| Frontend | <100ms (cached) | N/A (client-side) | CDN + Browser cache |
| Backend API | <3s (complex queries) | 1000 req/min | Horizontal scaling |
| BigQuery | <5s (large datasets) | Concurrent queries | Auto-scaling |

### 7.2 Scalability Patterns

```python
# Horizontal Scaling Strategy
Load Balancer
├── Backend Instance 1 (Railway/Cloud Run)
├── Backend Instance 2 (Auto-scaled)
└── Backend Instance N (On-demand)
        │
        ▼ (Shared State)
BigQuery Data Warehouse
├── Query Result Caching
├── Materialized Views
└── Scheduled Data Processing
```

## 8. Technology Stack Summary

### 8.1 Frontend Stack
```json
{
  "runtime": "Node.js 18+",
  "framework": "React 18 + TypeScript",
  "bundler": "Vite 4.x",
  "ui": "Material-UI 5.x",
  "state": "React Query + Context API",
  "charts": "Recharts 2.x",
  "routing": "React Router 6.x",
  "http": "Axios",
  "deployment": "Vercel / Static hosting"
}
```

### 8.2 Backend Stack
```json
{
  "runtime": "Python 3.11+",
  "framework": "FastAPI 0.104+",
  "server": "Uvicorn (ASGI)",
  "dependencies": "Poetry",
  "database": "Google BigQuery",
  "ml": "SciPy + NumPy + Pandas",
  "validation": "Pydantic 2.x",
  "deployment": "Railway / Google Cloud Run"
}
```

### 8.3 Infrastructure Stack
```json
{
  "containers": "Docker + Docker Compose",
  "cloud": "Google Cloud Platform + Railway + Vercel",
  "data": "Google BigQuery",
  "monitoring": "Cloud Logging + Health Checks",
  "ci_cd": "Git-based deployments",
  "security": "Service Account + IAM"
}
```

## 9. Future Architectural Considerations

### 9.1 Planned Enhancements
- **Event-Driven Architecture:** Real-time notifications and updates
- **Caching Layer:** Redis for improved performance
- **Message Queues:** Background job processing
- **API Gateway:** Centralized routing and rate limiting
- **Microservice Split:** Separate analytics and optimization services

### 9.2 Scalability Roadmap
- **Database Sharding:** Horizontal BigQuery partitioning
- **Service Mesh:** Inter-service communication management
- **Edge Computing:** Global content distribution
- **Auto-scaling Policies:** Predictive scaling based on usage patterns

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | August 2024 | Architecture Team | Initial version |

---

**Document Classification:** Internal Technical Documentation  
**Review Cycle:** Quarterly  
**Next Review:** November 2024 