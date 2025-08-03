# Technical Design Document (TDD)
## AI Rent Optimizer

**Document Version:** 1.0  
**Last Updated:** August 2024  
**Author:** Engineering Team  

---

## 1. Executive Summary

This Technical Design Document provides detailed technical specifications for the AI Rent Optimizer system, including module responsibilities, algorithms, database schemas, API interfaces, and implementation details. The document serves as a blueprint for developers working on system components.

## 2. System Modules & Responsibilities

### 2.1 Frontend Module Structure

```typescript
// Frontend Module Hierarchy
src/
├── components/           # Reusable UI components
│   ├── Layout.tsx       # Main navigation shell
│   ├── LoginPage.tsx    # Authentication interface
│   ├── OptimizationModal.tsx  # Unit optimization dialog
│   └── BatchOptimizationDialog.tsx  # Bulk operations
├── pages/               # Route-based page components
│   ├── DashboardPage.tsx     # Portfolio analytics dashboard
│   ├── UnitsPage.tsx         # Unit management grid
│   ├── AnalyticsPage.tsx     # NuStyle vs Competition
│   ├── MarketResearchPage.tsx # Archive data analysis
│   └── SettingsPage.tsx      # Configuration management
├── services/            # External service integrations
│   └── api.ts          # HTTP client and endpoints
├── types/              # TypeScript type definitions
│   └── api.ts          # API request/response interfaces
├── contexts/           # React context providers
│   └── AuthContext.tsx # Authentication state management
└── theme/              # UI styling and theming
    └── theme.ts        # Material-UI theme configuration
```

#### Key Frontend Responsibilities:

**Layout.tsx**
- Navigation menu management
- User authentication state display
- Responsive sidebar with route switching
- Dark industrial theme application

**DashboardPage.tsx**
- Portfolio-wide KPI display
- Property comparison analytics
- Market positioning visualization
- Revenue opportunity tracking

**UnitsPage.tsx**
- Unit data grid with pagination (25-50 units per page)
- Individual unit optimization workflow
- Batch operation management
- Status and urgency filtering

**AnalyticsPage.tsx**
- NuStyle vs Competition benchmarking
- Market rent clustering analysis
- Vacancy performance tracking
- Rent spread optimization

### 2.2 Backend Module Structure

```python
# Backend Module Hierarchy
app/
├── main.py              # FastAPI application and routing
├── config.py            # Configuration and settings
├── models.py            # Pydantic data models
├── database.py          # BigQuery service layer
├── pricing.py           # Optimization algorithms
└── utils.py             # Utility functions and JSON handling
```

#### Key Backend Responsibilities:

**main.py - API Layer**
```python
class FastAPIApplication:
    """Main application with endpoint routing"""
    
    @app.get("/api/v1/units")
    async def get_units(
        page: int = 1,
        page_size: int = 25,
        status: Optional[UnitStatus] = None,
        needs_pricing_only: bool = False
    ) -> UnitsListResponse
    
    @app.post("/api/v1/units/{unit_id}/optimize")
    async def optimize_unit(
        unit_id: str,
        request: OptimizeRequest
    ) -> OptimizeResponse
    
    @app.get("/api/v1/analytics/portfolio")
    async def get_portfolio_analytics() -> Dict
```

**database.py - Data Service Layer**
```python
class BigQueryService:
    """Centralized BigQuery data access"""
    
    def __init__(self):
        self.client = bigquery.Client()
        self._rentroll_table = "rentroll-ai.rentroll.Update_7_8_native"
        self._competition_table = "rentroll-ai.rentroll.Competition"
    
    async def get_units(self, filters) -> pd.DataFrame:
        """Fetch units with filtering and pagination"""
        
    async def get_unit_comparables(self, unit_id) -> pd.DataFrame:
        """Find similar units for pricing analysis"""
        
    async def get_portfolio_analytics(self) -> Dict:
        """Portfolio-wide KPI calculations"""
```

**pricing.py - Optimization Engine**
```python
class PricingOptimizer:
    """Core pricing optimization algorithms"""
    
    def __init__(self, elasticity: float = -0.02):
        self.demand_curve = DemandCurve(elasticity)
        self.max_adjustment = 0.20  # ±20% pricing bounds
    
    def revenue_optimization(self, unit_data, comps_data) -> Tuple[float, float]:
        """Revenue maximization strategy"""
        
    def lease_speed_optimization(self, unit_data, comps_data) -> Tuple[float, float]:
        """Lease-up time minimization strategy"""
        
    def balanced_optimization(self, unit_data, comps_data, weights) -> Tuple[float, float]:
        """Weighted combination strategy"""
```

## 3. Core Algorithms

### 3.1 Pricing Optimization Algorithm

```python
# Revenue Maximization Algorithm
def revenue_optimization(self, unit_data: Dict, comps_data: pd.DataFrame) -> Tuple[float, float]:
    """
    Optimize price to maximize expected annual revenue.
    
    Algorithm:
    1. Calculate baseline market price from comparables
    2. Define demand probability function P(price) = 1 + elasticity * price_ratio
    3. Define revenue function R(price) = price * P(price) * 12 months
    4. Use scipy.optimize.minimize_scalar to find optimal price
    5. Apply business constraints (±20% adjustment limits)
    
    Returns:
        Tuple of (optimal_price, demand_probability)
    """
    if comps_data.empty:
        return unit_data['advertised_rent'], None
    
    base_price = comps_data['comp_price'].median()
    current_rent = unit_data['advertised_rent']
    
    # Objective function (negative for minimization)
    def negative_revenue(price: float) -> float:
        demand_prob = self.demand_curve.probability(price, base_price)
        expected_revenue = price * demand_prob * 12
        return -expected_revenue
    
    # Optimization bounds
    min_price = max(base_price * 0.8, current_rent * 0.8)
    max_price = min(base_price * 1.2, current_rent * 1.3)
    
    # Scipy optimization
    result = minimize_scalar(
        negative_revenue,
        bounds=(min_price, max_price),
        method='bounded'
    )
    
    optimal_price = result.x
    demand_prob = self.demand_curve.probability(optimal_price, base_price)
    
    return optimal_price, demand_prob
```

### 3.2 Demand Curve Modeling

```python
class DemandCurve:
    """
    Demand probability modeling based on price elasticity.
    
    Mathematical Model:
    P(price) = 1 + elasticity * ((price - base_price) / base_price)
    
    Where:
    - P(price): Probability of leasing within 30 days
    - elasticity: Price sensitivity coefficient (typically -0.02 to -0.05)
    - base_price: Market baseline from comparable units
    """
    
    def __init__(self, elasticity: float = -0.02):
        self.elasticity = elasticity  # Default 2% demand decrease per 1% price increase
    
    def probability(self, price: float, base_price: float) -> float:
        """Calculate leasing probability for given price"""
        if base_price <= 0:
            return 0.5  # Default probability
            
        price_ratio = (price - base_price) / base_price
        prob = 1 + self.elasticity * price_ratio * 100
        
        # Clip to reasonable bounds [5%, 95%]
        return np.clip(prob, 0.05, 0.95)
    
    def expected_days_to_lease(self, price: float, base_price: float) -> float:
        """Expected days to lease based on demand probability"""
        prob = self.probability(price, base_price)
        return 30 / prob  # Inverse relationship
```

### 3.3 Comparable Unit Matching

```python
# Comparable Unit Selection Algorithm
def get_unit_comparables(self, unit_id: str) -> pd.DataFrame:
    """
    Find 5 most similar units for pricing analysis.
    
    Similarity Criteria:
    1. Exact bedroom/bathroom match (required)
    2. Square footage within ±20% (required)
    3. Price per sqft within ±30% (required)
    4. Similarity score ≥ 0.8 (required)
    5. Rank by composite similarity score
    
    Similarity Score Calculation:
    score = (sqft_similarity * 0.4) + (price_similarity * 0.6)
    
    Where:
    sqft_similarity = 1 - abs(sqft_delta_pct)
    price_similarity = 1 - abs(price_delta_pct)
    """
    
    query = f"""
    WITH unit_info AS (
        SELECT bed, bath, sqft, advertised_rent, rent_per_sqft
        FROM {self._get_table_name('mart', 'unit_snapshot')}
        WHERE unit_id = '{unit_id}'
    ),
    comparable_candidates AS (
        SELECT 
            c.*,
            u.sqft as our_sqft,
            u.rent_per_sqft as our_rent_per_sqft,
            ABS(c.sqft - u.sqft) / u.sqft AS sqft_delta_pct,
            ABS(c.comp_price_per_sqft - u.rent_per_sqft) / u.rent_per_sqft AS price_delta_pct
        FROM {self._get_table_name('staging', 'comps')} c
        CROSS JOIN unit_info u
        WHERE c.bed = u.bed 
          AND c.bath = u.bath
          AND ABS(c.sqft - u.sqft) / u.sqft <= 0.20  -- ±20% sqft
          AND ABS(c.comp_price_per_sqft - u.rent_per_sqft) / u.rent_per_sqft <= 0.30  -- ±30% price
    )
    SELECT *,
        (1 - sqft_delta_pct) * 0.4 + (1 - price_delta_pct) * 0.6 AS similarity_score
    FROM comparable_candidates
    WHERE (1 - sqft_delta_pct) * 0.4 + (1 - price_delta_pct) * 0.6 >= 0.8
    ORDER BY similarity_score DESC
    LIMIT 5
    """
```

## 4. Database Schema & Design

### 4.1 BigQuery Table Structure

```sql
-- Raw Data Tables (Source)
rentroll.Update_7_8_native
├── Unit (STRING)              -- Unique unit identifier
├── Property (STRING)          -- Property name
├── Bedroom (INT64)            -- Number of bedrooms
├── Bathrooms (FLOAT64)        -- Number of bathrooms
├── Sqft (INT64)              -- Square footage
├── Advertised_Rent (INT64)    -- Current advertised rent
├── Market_Rent (INT64)        -- Market rate estimate
├── Status (STRING)            -- OCCUPIED/VACANT/NOTICE
├── Move_out (DATE)            -- Move-out date
└── Lease_To (DATE)            -- Lease end date

rentroll.Competition
├── Property (STRING)          -- Competitor property name
├── Unit (STRING)              -- Unit identifier
├── Bed (STRING)               -- "1 Bed", "2 Beds", etc.
├── Bath (STRING)              -- " 1 Bath", " 2 Baths", etc.
├── Sq_Ft (INT64)             -- Square footage
├── Base_Price (INT64)         -- Listed rent price
└── Availability (STRING)      -- Availability status

-- Staging Views (Normalized)
staging.our_units
├── unit_id (STRING)           -- Normalized Unit
├── property (STRING)          -- Normalized Property
├── bed (INT64)               -- Bedroom count
├── bath (FLOAT64)            -- Bathroom count
├── sqft (INT64)              -- Square footage
├── advertised_rent (INT64)    -- Current rent
├── market_rent (INT64)        -- Market estimate
├── status (STRING)            -- OCCUPIED/VACANT/NOTICE
├── needs_pricing (BOOLEAN)    -- Requires pricing review
├── rent_per_sqft (FLOAT64)   -- Calculated PSF
└── days_to_lease_end (INT64) -- Days until lease expires

staging.comps
├── comp_id (STRING)           -- Unique competitor unit ID
├── property (STRING)          -- Competitor property
├── bed (INT64)               -- Bedroom count (normalized)
├── bath (INT64)              -- Bathroom count (normalized)
├── sqft (INT64)              -- Square footage
├── comp_price (INT64)         -- Listed price
├── comp_price_per_sqft (FLOAT64) -- Calculated PSF
└── is_available (BOOLEAN)     -- Availability flag

-- Data Mart (Analytics-Ready)
mart.unit_snapshot
├── [All staging.our_units columns] +
├── rent_premium_pct (FLOAT64) -- % above/below market
├── pricing_urgency (STRING)   -- IMMEDIATE/HIGH/MEDIUM/LOW
├── unit_type (STRING)         -- 1BR/2BR/3BR/4BR+/STUDIO
├── size_category (STRING)     -- SMALL/MEDIUM/LARGE
├── annual_revenue_potential (INT64) -- Projected annual revenue
└── has_complete_data (BOOLEAN) -- Data quality flag
```

### 4.2 Data Transformation Logic

```sql
-- mart.unit_snapshot Creation Logic
CREATE OR REPLACE VIEW `rentroll-ai.mart.unit_snapshot` AS
SELECT
    u.*,
    -- Market positioning metrics
    CASE 
        WHEN u.market_rent > 0 THEN 
            (u.advertised_rent - u.market_rent) / u.market_rent * 100
        ELSE NULL
    END AS rent_premium_pct,
    
    -- Urgency classification
    CASE 
        WHEN u.status = 'VACANT' THEN 'IMMEDIATE'
        WHEN u.days_to_lease_end <= 30 THEN 'HIGH'
        WHEN u.days_to_lease_end <= 60 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS pricing_urgency,
    
    -- Unit type standardization
    CASE 
        WHEN u.bed = 0 THEN 'STUDIO'
        WHEN u.bed = 1 THEN '1BR'
        WHEN u.bed = 2 THEN '2BR'
        WHEN u.bed = 3 THEN '3BR'
        ELSE '4BR+'
    END AS unit_type,
    
    -- Size categorization
    CASE 
        WHEN u.sqft < 600 THEN 'SMALL'
        WHEN u.sqft < 1000 THEN 'MEDIUM'
        ELSE 'LARGE'
    END AS size_category,
    
    -- Revenue potential calculation
    CASE 
        WHEN u.market_rent > 0 THEN u.market_rent * 12
        ELSE u.advertised_rent * 12
    END AS annual_revenue_potential,
    
    -- Data quality assessment
    CASE 
        WHEN u.sqft > 0 AND u.advertised_rent > 0 AND u.market_rent > 0 
        THEN TRUE 
        ELSE FALSE 
    END AS has_complete_data

FROM `rentroll-ai.staging.our_units` u
WHERE u.sqft > 0 AND u.advertised_rent > 0;
```

## 5. API Interface Definitions

### 5.1 Request/Response Models

```python
# Pydantic Models for Type Safety
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

class UnitStatus(str, Enum):
    OCCUPIED = "OCCUPIED"
    VACANT = "VACANT"
    NOTICE = "NOTICE"

class OptimizationStrategy(str, Enum):
    REVENUE_MAX = "revenue_maximization"
    LEASE_SPEED = "lease_up_time_minimization"
    BALANCED = "balanced"

class Unit(BaseModel):
    unit_id: str
    property: str
    bed: int
    bath: float
    sqft: int
    advertised_rent: int
    market_rent: Optional[int]
    status: UnitStatus
    pricing_urgency: str
    rent_per_sqft: float
    annual_revenue_potential: int

class ComparableUnit(BaseModel):
    comp_id: str
    property: str
    bed: int
    bath: int
    sqft: int
    comp_price: int
    comp_price_per_sqft: float
    similarity_score: float
    sqft_delta_pct: float
    price_gap_pct: float
    is_available: bool

class OptimizeRequest(BaseModel):
    strategy: OptimizationStrategy
    weights: Optional[Dict[str, float]] = None  # For balanced strategy

class OptimizationResult(BaseModel):
    original_price: int
    recommended_price: int
    price_change: int
    price_change_pct: float
    demand_probability: float
    expected_days_to_lease: int
    annual_revenue_impact: int
    strategy_used: OptimizationStrategy

class OptimizeResponse(BaseModel):
    unit: Unit
    comparables_summary: Dict[str, Any]
    optimization: OptimizationResult
```

### 5.2 Core API Endpoints

```python
# Unit Management Endpoints
@app.get("/api/v1/units", response_model=UnitsListResponse)
async def get_units(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[UnitStatus] = None,
    needs_pricing_only: bool = False
):
    """
    Fetch paginated list of units with optional filtering.
    
    Query Parameters:
    - page: Page number (1-based)
    - page_size: Items per page (1-100)
    - status: Filter by unit status
    - needs_pricing_only: Show only units requiring pricing review
    
    Returns:
    - units: List of Unit objects
    - total_count: Total units matching criteria
    - page_info: Pagination metadata
    """

@app.get("/api/v1/units/{unit_id}/comparables", response_model=ComparablesResponse)
async def get_unit_comparables(unit_id: str):
    """
    Get comparable units for pricing analysis.
    
    Path Parameters:
    - unit_id: Unique unit identifier
    
    Returns:
    - unit: Target unit details
    - comparables: List of 5 most similar units
    - summary: Aggregate statistics
    """

@app.post("/api/v1/units/{unit_id}/optimize", response_model=OptimizeResponse)
async def optimize_unit(unit_id: str, request: OptimizeRequest):
    """
    Generate pricing optimization recommendation.
    
    Path Parameters:
    - unit_id: Unit to optimize
    
    Request Body:
    - strategy: Optimization strategy to use
    - weights: Strategy weights (for balanced approach)
    
    Returns:
    - Comprehensive optimization analysis and recommendation
    """

# Analytics Endpoints
@app.get("/api/v1/analytics/portfolio")
async def get_portfolio_analytics():
    """
    Portfolio-wide KPI dashboard data.
    
    Returns:
    - occupancy_rate: Current occupancy percentage
    - vacant_units: Count of vacant units
    - revenue_potential: Total optimization opportunity
    - pricing_urgency_breakdown: Units by urgency level
    - top_opportunities: Highest-impact optimization targets
    """

@app.get("/api/v1/analytics/property/{property_name}/competition")
async def get_property_competition_analysis(property_name: str):
    """
    Property-specific competitive intelligence.
    
    Path Parameters:
    - property_name: URL-encoded property name
    
    Returns:
    - rent_comparison_by_bedrooms: Market positioning by unit type
    - performance_metrics: Occupancy and revenue KPIs
    - competitive_positioning: Relative market position
    """
```

## 6. Data Structures & Algorithms

### 6.1 In-Memory Data Structures

```python
# Key Data Structures for Processing
class OptimizationCache:
    """Cache for optimization results and comparable units"""
    
    def __init__(self):
        self._comparables_cache: Dict[str, List[ComparableUnit]] = {}
        self._optimization_cache: Dict[str, OptimizationResult] = {}
        self._cache_ttl = 3600  # 1 hour TTL
    
    def get_comparables(self, unit_id: str) -> Optional[List[ComparableUnit]]:
        """Retrieve cached comparables for unit"""
        
    def set_comparables(self, unit_id: str, comparables: List[ComparableUnit]):
        """Cache comparables with TTL"""

class AnalyticsAggregator:
    """Aggregate analytics calculations"""
    
    def __init__(self, units_df: pd.DataFrame):
        self.units_df = units_df
        
    def calculate_portfolio_kpis(self) -> Dict[str, Any]:
        """Calculate portfolio-wide KPIs"""
        return {
            'total_units': len(self.units_df),
            'occupied_units': len(self.units_df[self.units_df['status'] == 'OCCUPIED']),
            'vacant_units': len(self.units_df[self.units_df['status'] == 'VACANT']),
            'occupancy_rate': self._calculate_occupancy_rate(),
            'avg_rent': self.units_df['advertised_rent'].mean(),
            'revenue_potential': self.units_df['annual_revenue_potential'].sum()
        }
```

### 6.2 BigQuery Query Optimization

```python
# Optimized Query Patterns
class QueryOptimizer:
    """BigQuery query optimization strategies"""
    
    @staticmethod
    def get_units_with_pagination(page: int, page_size: int, filters: Dict) -> str:
        """
        Optimized pagination query with filtering.
        
        Optimizations:
        1. Use LIMIT/OFFSET for pagination
        2. Apply filters in WHERE clause early
        3. Select only required columns
        4. Use table clustering for performance
        """
        base_query = """
        SELECT 
            unit_id, property, bed, bath, sqft, 
            advertised_rent, market_rent, status, 
            pricing_urgency, rent_per_sqft, annual_revenue_potential
        FROM `{table_name}`
        WHERE 1=1
        """
        
        # Dynamic filter application
        if filters.get('status'):
            base_query += f" AND status = '{filters['status']}'"
        if filters.get('needs_pricing_only'):
            base_query += " AND needs_pricing = TRUE"
            
        # Pagination
        offset = (page - 1) * page_size
        base_query += f" ORDER BY unit_id LIMIT {page_size} OFFSET {offset}"
        
        return base_query
```

## 7. Sequence Diagrams

### 7.1 Unit Optimization Flow

```
User → Frontend → Backend → BigQuery → Optimization Engine → Response

┌──────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐    ┌──────────────┐
│ User │    │ Frontend │    │ Backend │    │BigQuery │    │Optimization  │
│      │    │          │    │         │    │         │    │Engine        │
└──┬───┘    └────┬─────┘    └────┬────┘    └────┬────┘    └──────┬───────┘
   │             │               │              │                │
   │ Click       │               │              │                │
   │ Optimize    │               │              │                │
   │────────────▶│               │              │                │
   │             │ POST          │              │                │
   │             │ /optimize     │              │                │
   │             │──────────────▶│              │                │
   │             │               │ Query Unit   │                │
   │             │               │ Details      │                │
   │             │               │─────────────▶│                │
   │             │               │              │                │
   │             │               │ Query        │                │
   │             │               │ Comparables  │                │
   │             │               │─────────────▶│                │
   │             │               │              │                │
   │             │               │ Execute      │                │
   │             │               │ Optimization │                │
   │             │               │──────────────┼───────────────▶│
   │             │               │              │                │
   │             │               │              │  Calculate     │
   │             │               │              │  Optimal Price │
   │             │               │              │◀───────────────│
   │             │               │              │                │
   │             │ Optimization  │              │                │
   │             │ Results       │              │                │
   │             │◀──────────────│              │                │
   │             │               │              │                │
   │ Display     │               │              │                │
   │ Results     │               │              │                │
   │◀────────────│               │              │                │
```

### 7.2 Data Refresh Pipeline

```
Scheduler → BigQuery → Materialized Views → Cache Invalidation

┌─────────┐    ┌─────────┐    ┌────────────────┐    ┌───────────┐
│Scheduler│    │BigQuery │    │Materialized    │    │Application│
│         │    │         │    │Views           │    │Cache      │
└────┬────┘    └────┬────┘    └───────┬────────┘    └─────┬─────┘
     │              │                 │                   │
     │ Nightly      │                 │                   │
     │ Refresh      │                 │                   │
     │─────────────▶│                 │                   │
     │              │ Refresh         │                   │
     │              │ unit_snapshot   │                   │
     │              │────────────────▶│                   │
     │              │                 │                   │
     │              │ Refresh         │                   │
     │              │ competitor_pairs│                   │
     │              │────────────────▶│                   │
     │              │                 │                   │
     │              │                 │ Invalidate Cache  │
     │              │                 │──────────────────▶│
     │              │                 │                   │
     │              │ Completion      │                   │
     │              │ Notification    │                   │
     │◀─────────────│                 │                   │
```

## 8. Error Handling & Validation

### 8.1 Input Validation

```python
# Pydantic Validation Examples
class OptimizeRequest(BaseModel):
    strategy: OptimizationStrategy
    weights: Optional[Dict[str, float]] = Field(None, description="Strategy weights for balanced approach")
    
    @validator('weights')
    def validate_weights(cls, v, values):
        """Validate weights for balanced strategy"""
        if values.get('strategy') == OptimizationStrategy.BALANCED:
            if not v:
                raise ValueError("Weights required for balanced strategy")
            if not all(0 <= weight <= 1 for weight in v.values()):
                raise ValueError("Weights must be between 0 and 1")
            if abs(sum(v.values()) - 1.0) > 0.01:
                raise ValueError("Weights must sum to 1.0")
        return v

class UnitFilters(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(25, ge=1, le=100, description="Items per page")
    status: Optional[UnitStatus] = None
    min_sqft: Optional[int] = Field(None, ge=0)
    max_sqft: Optional[int] = Field(None, le=10000)
    
    @validator('max_sqft')
    def validate_sqft_range(cls, v, values):
        """Ensure max_sqft > min_sqft"""
        if v and values.get('min_sqft') and v <= values['min_sqft']:
            raise ValueError("max_sqft must be greater than min_sqft")
        return v
```

### 8.2 Error Response Structure

```python
# Standardized Error Responses
class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error type or category")
    detail: Optional[str] = Field(None, description="Detailed error message")
    code: Optional[str] = Field(None, description="Application-specific error code")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# Error Handler Implementation
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            error="Validation Error",
            detail=str(exc),
            code="VALIDATION_FAILED"
        ).dict()
    )

@app.exception_handler(BigQueryException)
async def bigquery_error_handler(request: Request, exc: BigQueryException):
    logger.error(f"BigQuery error: {exc}")
    return JSONResponse(
        status_code=503,
        content=ErrorResponse(
            error="Database Error",
            detail="Unable to process request due to database issues",
            code="DATABASE_UNAVAILABLE"
        ).dict()
    )
```

## 9. Performance Considerations

### 9.1 Query Optimization Strategies

```python
# BigQuery Performance Optimizations
class PerformanceOptimizer:
    
    @staticmethod
    def optimize_unit_queries():
        """Optimization strategies for unit queries"""
        return {
            'clustering': 'CLUSTER BY property, status',
            'partitioning': 'PARTITION BY DATE(lease_end_date)',
            'materialization': 'CREATE MATERIALIZED VIEW',
            'caching': 'Use query result caching',
            'indexing': 'Optimize WHERE clause columns'
        }
    
    @staticmethod
    def batch_processing():
        """Batch processing for large datasets"""
        return {
            'chunk_size': 1000,  # Process 1000 units at a time
            'parallel_queries': 5,  # 5 concurrent BigQuery jobs
            'connection_pooling': True,
            'result_caching': 3600  # 1 hour cache TTL
        }
```

### 9.2 Memory Management

```python
# Memory-Efficient Data Processing
class DataProcessor:
    
    def __init__(self, chunk_size: int = 1000):
        self.chunk_size = chunk_size
    
    async def process_units_in_chunks(self, unit_ids: List[str]) -> List[Dict]:
        """Process large unit lists in memory-efficient chunks"""
        results = []
        
        for i in range(0, len(unit_ids), self.chunk_size):
            chunk = unit_ids[i:i + self.chunk_size]
            chunk_results = await self._process_chunk(chunk)
            results.extend(chunk_results)
            
            # Optional: Clear intermediate results
            gc.collect()
        
        return results
    
    async def _process_chunk(self, chunk: List[str]) -> List[Dict]:
        """Process a single chunk of units"""
        # Implement chunk processing logic
        pass
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | August 2024 | Engineering Team | Initial technical design |

---

**Document Classification:** Internal Technical Documentation  
**Review Cycle:** Monthly  
**Next Review:** September 2024 