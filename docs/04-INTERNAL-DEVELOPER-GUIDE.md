# Internal Developer Guide
## AI Rent Optimizer

**Document Version:** 1.0  
**Last Updated:** August 2024  
**Author:** Development Team  

---

## 1. Getting Started

### 1.1 Prerequisites

Before contributing to the AI Rent Optimizer, ensure you have the following tools installed:

```bash
# Required Tools
- Node.js 18+ and npm
- Python 3.11+ 
- Poetry (Python dependency management)
- Git
- VS Code (recommended) or your preferred IDE

# Optional Tools
- Docker Desktop (for containerized development)
- Google Cloud SDK (for BigQuery testing)
- Postman or Thunder Client (API testing)
```

### 1.2 Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ai-rent-optimizer.git
cd ai-rent-optimizer

# 2. Backend setup
cd backend
poetry install
cp .env.example .env
# Edit .env with your BigQuery credentials

# 3. Frontend setup
cd ../frontend
npm install
cp .env.example .env
# Edit .env with API configuration

# 4. Verify setup
cd ../backend && poetry run uvicorn main:app --reload &
cd ../frontend && npm run dev
```

## 2. Project Structure & Organization

### 2.1 Repository Layout

```
ai-rent-optimizer/
├── README.md                 # Project overview and quick start
├── .gitignore               # Git ignore patterns
├── docs/                    # Technical documentation
│   ├── 01-SOFTWARE-ARCHITECTURE-DOCUMENT.md
│   ├── 02-TECHNICAL-DESIGN-DOCUMENT.md
│   ├── 03-SOFTWARE-SYSTEM-SPECIFICATION.md
│   ├── 04-INTERNAL-DEVELOPER-GUIDE.md
│   └── 05-ENGINEERING-RUNBOOK.md
│
├── backend/                 # Python FastAPI backend
│   ├── app/                # Application source code
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI application entry point
│   │   ├── config.py       # Configuration management
│   │   ├── database.py     # BigQuery service layer
│   │   ├── models.py       # Pydantic data models
│   │   ├── pricing.py      # Optimization algorithms
│   │   └── utils.py        # Utility functions
│   ├── tests/              # Unit and integration tests
│   ├── pyproject.toml      # Poetry dependencies
│   ├── requirements.txt    # Railway deployment requirements
│   ├── railway.toml        # Railway configuration
│   ├── main.py             # Railway entry point
│   └── .env.example        # Environment variables template
│
├── frontend/               # React TypeScript frontend
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Route-based pages
│   │   ├── services/       # API client and utilities
│   │   ├── theme/          # Material-UI theming
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Application entry point
│   ├── package.json        # npm dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── .env.example        # Environment variables template
│
├── sql/                    # Database schema and queries
│   ├── staging/            # Staging layer views
│   │   ├── our_units.sql
│   │   └── comps.sql
│   ├── mart/               # Data mart views
│   │   ├── unit_snapshot.sql
│   │   └── unit_competitor_pairs.sql
│   └── setup_bigquery.sql  # Complete schema setup
│
├── infra/                  # Infrastructure and deployment
│   ├── docker-compose.yml  # Local development
│   └── deploy-cloud-run.sh # Google Cloud deployment
│
└── scripts/                # Utility scripts
    └── encode-credentials.py # Service account encoding
```

### 2.2 Code Organization Principles

#### Backend Architecture
```python
# Layer Separation (Dependency Direction: Top → Bottom)
Presentation Layer (main.py)
    ↓ calls
Business Logic Layer (pricing.py, database.py)
    ↓ calls  
Infrastructure Layer (config.py, utils.py)

# Module Responsibilities
main.py         # API routing, middleware, error handling
models.py       # Data contracts (Pydantic models)
database.py     # Data access and BigQuery integration
pricing.py      # Core optimization algorithms
config.py       # Configuration management
utils.py        # Shared utilities and helpers
```

#### Frontend Architecture
```typescript
// Component Hierarchy (Container/Presentational Pattern)
Pages (Smart Components)
    ↓ orchestrates
Components (Presentational Components)
    ↓ uses
Services (API/Business Logic)
    ↓ uses
Types (Data Contracts)

// Folder Responsibilities
pages/          # Route-level components (containers)
components/     # Reusable UI components (presentational)
services/       # API clients and business logic
types/          # TypeScript interfaces and types
contexts/       # Global state management
theme/          # UI styling and theming
```

## 3. Development Workflow

### 3.1 Branch Strategy

```bash
# Branch Naming Convention
main                    # Production-ready code
develop                 # Integration branch
feature/feature-name    # New features
bugfix/bug-description  # Bug fixes
hotfix/critical-fix     # Emergency production fixes

# Example Workflow
git checkout develop
git pull origin develop
git checkout -b feature/unit-batch-optimization
# ... make changes ...
git add .
git commit -m "feat: implement batch unit optimization"
git push origin feature/unit-batch-optimization
# Create Pull Request to develop
```

### 3.2 Commit Message Convention

```bash
# Format: <type>(<scope>): <description>
# Types: feat, fix, docs, style, refactor, test, chore

# Examples
feat(pricing): implement lease-speed optimization algorithm
fix(frontend): resolve unit grid pagination issue
docs(api): update endpoint documentation
refactor(database): optimize BigQuery query performance
test(pricing): add unit tests for optimization algorithms
chore(deps): update React to v18.2.0
```

### 3.3 Code Review Process

```markdown
# Pull Request Template

## Description
Brief description of changes made

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated if needed
- [ ] No breaking changes without migration plan
```

## 4. Backend Development Guide

### 4.1 FastAPI Application Structure

```python
# main.py - Application Entry Point
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Application factory pattern
def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Rent Optimizer API",
        description="Rental property pricing optimization platform",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # Middleware configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Route registration
    from app.routes import units, analytics, settings
    app.include_router(units.router, prefix="/api/v1")
    app.include_router(analytics.router, prefix="/api/v1")
    app.include_router(settings.router, prefix="/api/v1")
    
    return app

app = create_app()
```

### 4.2 Database Service Pattern

```python
# database.py - Service Layer Pattern
class BigQueryService:
    """
    Service layer for BigQuery data access.
    
    Design Principles:
    1. Single Responsibility: Only handles data access
    2. Dependency Injection: Client injected via constructor
    3. Error Handling: Wraps exceptions with context
    4. Async/Await: Non-blocking I/O operations
    """
    
    def __init__(self, client: Optional[bigquery.Client] = None):
        self.client = client or bigquery.Client()
        self._project_id = settings.bigquery_project_id
        self._rentroll_table = settings.rentroll_table_id
    
    async def get_units(
        self, 
        page: int = 1, 
        page_size: int = 25,
        filters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Fetch paginated units with optional filtering.
        
        Args:
            page: 1-based page number
            page_size: Number of units per page
            filters: Optional filter dictionary
            
        Returns:
            Dictionary with units list and pagination info
            
        Raises:
            BigQueryServiceError: If query fails
        """
        try:
            # Query construction with parameterization
            query = self._build_units_query(page, page_size, filters)
            
            # Async query execution
            job_config = bigquery.QueryJobConfig(
                query_parameters=self._build_query_parameters(filters)
            )
            
            result = self.client.query(query, job_config=job_config)
            df = result.to_dataframe()
            
            # Data transformation
            units = self._transform_units_dataframe(df)
            
            return {
                'units': units,
                'total_count': await self._get_total_count(filters),
                'page': page,
                'page_size': page_size,
                'has_next': len(units) == page_size
            }
            
        except Exception as e:
            logger.error(f"Error fetching units: {e}")
            raise BigQueryServiceError(f"Failed to fetch units: {str(e)}")
```

### 4.3 Optimization Algorithm Implementation

```python
# pricing.py - Algorithm Implementation
class PricingOptimizer:
    """
    Pricing optimization engine with multiple strategies.
    
    Algorithm Design:
    1. Strategy Pattern: Multiple optimization approaches
    2. Functional Programming: Pure functions for calculations
    3. Scientific Computing: SciPy for optimization
    4. Input Validation: Comprehensive parameter checking
    """
    
    def __init__(self, elasticity: float = -0.02):
        self.demand_curve = DemandCurve(elasticity)
        self.max_adjustment = 0.20
    
    def optimize(
        self, 
        unit_data: Dict, 
        comparables: List[Dict], 
        strategy: OptimizationStrategy,
        weights: Optional[Dict] = None
    ) -> OptimizationResult:
        """
        Main optimization entry point.
        
        Strategy Implementation:
        1. Validate inputs
        2. Select optimization strategy
        3. Execute algorithm
        4. Validate results
        5. Return structured response
        """
        
        # Input validation
        self._validate_optimization_inputs(unit_data, comparables, strategy)
        
        # Strategy selection
        if strategy == OptimizationStrategy.REVENUE_MAX:
            result = self._revenue_optimization(unit_data, comparables)
        elif strategy == OptimizationStrategy.LEASE_SPEED:
            result = self._lease_speed_optimization(unit_data, comparables)
        elif strategy == OptimizationStrategy.BALANCED:
            result = self._balanced_optimization(unit_data, comparables, weights)
        else:
            raise ValueError(f"Unknown optimization strategy: {strategy}")
        
        # Result validation
        self._validate_optimization_result(result, unit_data)
        
        return result
    
    def _revenue_optimization(
        self, 
        unit_data: Dict, 
        comparables: List[Dict]
    ) -> OptimizationResult:
        """
        Revenue maximization using scipy optimization.
        
        Mathematical Model:
        Maximize: Price × Probability(Price) × 12 months
        Subject to: Price bounds and business constraints
        """
        
        if not comparables:
            return self._fallback_optimization(unit_data)
        
        # Calculate market baseline
        market_prices = [comp['comp_price'] for comp in comparables]
        base_price = np.median(market_prices)
        current_price = unit_data['advertised_rent']
        
        # Define objective function (negative for minimization)
        def negative_revenue(price: float) -> float:
            demand_prob = self.demand_curve.probability(price, base_price)
            annual_revenue = price * demand_prob * 12
            return -annual_revenue
        
        # Optimization bounds
        min_price = max(base_price * 0.8, current_price * 0.8)
        max_price = min(base_price * 1.2, current_price * 1.2)
        
        # Execute optimization
        try:
            result = minimize_scalar(
                negative_revenue,
                bounds=(min_price, max_price),
                method='bounded',
                options={'xatol': 1.0}  # $1 tolerance
            )
            
            if result.success:
                optimal_price = round(result.x)
                demand_prob = self.demand_curve.probability(optimal_price, base_price)
                
                return OptimizationResult(
                    original_price=current_price,
                    recommended_price=optimal_price,
                    price_change=optimal_price - current_price,
                    price_change_pct=(optimal_price - current_price) / current_price * 100,
                    demand_probability=demand_prob,
                    expected_days_to_lease=int(30 / demand_prob),
                    annual_revenue_impact=(optimal_price - current_price) * 12,
                    strategy_used=OptimizationStrategy.REVENUE_MAX,
                    confidence_score=self._calculate_confidence(comparables)
                )
            else:
                logger.warning(f"Optimization failed to converge: {result.message}")
                return self._fallback_optimization(unit_data)
                
        except Exception as e:
            logger.error(f"Optimization error: {e}")
            return self._fallback_optimization(unit_data)
```

### 4.4 Testing Patterns

```python
# tests/test_pricing.py - Unit Testing
import pytest
import pandas as pd
from unittest.mock import Mock, patch
from app.pricing import PricingOptimizer, OptimizationStrategy

class TestPricingOptimizer:
    """Test suite for pricing optimization algorithms."""
    
    @pytest.fixture
    def optimizer(self):
        """Create optimizer instance for testing."""
        return PricingOptimizer(elasticity=-0.02)
    
    @pytest.fixture
    def sample_unit_data(self):
        """Sample unit data for testing."""
        return {
            'unit_id': 'TEST001',
            'advertised_rent': 1200,
            'bed': 1,
            'bath': 1,
            'sqft': 800
        }
    
    @pytest.fixture
    def sample_comparables(self):
        """Sample comparable units for testing."""
        return [
            {'comp_price': 1150, 'sqft': 780, 'similarity_score': 0.95},
            {'comp_price': 1250, 'sqft': 820, 'similarity_score': 0.90},
            {'comp_price': 1180, 'sqft': 790, 'similarity_score': 0.88},
            {'comp_price': 1220, 'sqft': 810, 'similarity_score': 0.85},
            {'comp_price': 1300, 'sqft': 850, 'similarity_score': 0.82}
        ]
    
    def test_revenue_optimization_success(self, optimizer, sample_unit_data, sample_comparables):
        """Test successful revenue optimization."""
        result = optimizer.optimize(
            sample_unit_data,
            sample_comparables,
            OptimizationStrategy.REVENUE_MAX
        )
        
        # Assertions
        assert result.strategy_used == OptimizationStrategy.REVENUE_MAX
        assert result.recommended_price > 0
        assert result.demand_probability > 0
        assert result.confidence_score > 0
        assert abs(result.price_change_pct) <= 30  # Within ±30% adjustment
    
    def test_optimization_with_no_comparables(self, optimizer, sample_unit_data):
        """Test optimization fallback with no comparables."""
        result = optimizer.optimize(
            sample_unit_data,
            [],
            OptimizationStrategy.REVENUE_MAX
        )
        
        # Should return fallback result
        assert result.recommended_price == sample_unit_data['advertised_rent']
        assert result.confidence_score < 0.5  # Low confidence
    
    @pytest.mark.parametrize("strategy", [
        OptimizationStrategy.REVENUE_MAX,
        OptimizationStrategy.LEASE_SPEED,
        OptimizationStrategy.BALANCED
    ])
    def test_all_optimization_strategies(self, optimizer, sample_unit_data, sample_comparables, strategy):
        """Test all optimization strategies."""
        weights = {'revenue': 0.6, 'speed': 0.4} if strategy == OptimizationStrategy.BALANCED else None
        
        result = optimizer.optimize(
            sample_unit_data,
            sample_comparables,
            strategy,
            weights
        )
        
        assert result.strategy_used == strategy
        assert result.recommended_price > 0
    
    def test_input_validation(self, optimizer):
        """Test input validation."""
        with pytest.raises(ValueError):
            optimizer.optimize(
                {},  # Invalid unit data
                [],
                OptimizationStrategy.REVENUE_MAX
            )
    
    @patch('app.pricing.minimize_scalar')
    def test_optimization_failure_handling(self, mock_minimize, optimizer, sample_unit_data, sample_comparables):
        """Test optimization failure handling."""
        # Mock optimization failure
        mock_minimize.return_value = Mock(success=False, message="Test failure")
        
        result = optimizer.optimize(
            sample_unit_data,
            sample_comparables,
            OptimizationStrategy.REVENUE_MAX
        )
        
        # Should return fallback result
        assert result.recommended_price == sample_unit_data['advertised_rent']
```

## 5. Frontend Development Guide

### 5.1 Component Development Patterns

```typescript
// Component Structure Template
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Alert 
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { Unit, OptimizationRequest } from '@/types/api';

interface ComponentProps {
  // Props should be explicitly typed
  unitId: string;
  onOptimizationComplete?: (result: OptimizationResult) => void;
}

/**
 * Component for unit optimization interface.
 * 
 * Design Patterns:
 * 1. Container/Presentational Pattern
 * 2. Custom hooks for logic separation
 * 3. Error boundaries for error handling
 * 4. Loading states for UX
 */
const UnitOptimizationComponent: React.FC<ComponentProps> = ({
  unitId,
  onOptimizationComplete
}) => {
  // State management
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy>('revenue_maximization');
  
  // Data fetching with React Query
  const {
    data: unitData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => apiService.getUnit(unitId),
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mutations for state changes
  const optimizationMutation = useMutation({
    mutationFn: (request: OptimizationRequest) => apiService.optimizeUnit(unitId, request),
    onSuccess: (result) => {
      onOptimizationComplete?.(result);
    },
    onError: (error) => {
      console.error('Optimization failed:', error);
    }
  });
  
  // Event handlers
  const handleOptimize = () => {
    optimizationMutation.mutate({
      strategy: selectedStrategy,
      weights: selectedStrategy === 'balanced' ? { revenue: 0.6, speed: 0.4 } : undefined
    });
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert severity="error" action={
        <Button onClick={() => refetch()}>Retry</Button>
      }>
        Failed to load unit data: {error.message}
      </Alert>
    );
  }
  
  // Main render
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Optimize Unit {unitData?.unit_id}
      </Typography>
      
      {/* Strategy selection UI */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Optimization Strategy</InputLabel>
        <Select
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value)}
        >
          <MenuItem value="revenue_maximization">Revenue Maximization</MenuItem>
          <MenuItem value="lease_up_time_minimization">Lease-Up Speed</MenuItem>
          <MenuItem value="balanced">Balanced Approach</MenuItem>
        </Select>
      </FormControl>
      
      {/* Action button */}
      <Button
        variant="contained"
        onClick={handleOptimize}
        disabled={optimizationMutation.isLoading}
        fullWidth
        sx={{ mt: 2 }}
      >
        {optimizationMutation.isLoading ? 'Optimizing...' : 'Optimize Price'}
      </Button>
    </Box>
  );
};

export default UnitOptimizationComponent;
```

### 5.2 Custom Hooks Pattern

```typescript
// hooks/useUnitOptimization.ts - Custom Hook
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { OptimizationRequest, OptimizationResult } from '@/types/api';

interface UseUnitOptimizationProps {
  unitId: string;
  onSuccess?: (result: OptimizationResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for unit optimization logic.
 * 
 * Benefits:
 * 1. Logic reuse across components
 * 2. Separation of concerns
 * 3. Easier testing
 * 4. Consistent error handling
 */
export const useUnitOptimization = ({
  unitId,
  onSuccess,
  onError
}: UseUnitOptimizationProps) => {
  const queryClient = useQueryClient();
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationResult[]>([]);
  
  const optimizationMutation = useMutation({
    mutationFn: (request: OptimizationRequest) => apiService.optimizeUnit(unitId, request),
    onSuccess: (result) => {
      // Update history
      setOptimizationHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5
      
      // Invalidate related queries
      queryClient.invalidateQueries(['unit', unitId]);
      queryClient.invalidateQueries(['units']);
      
      onSuccess?.(result);
    },
    onError: (error) => {
      console.error('Optimization failed:', error);
      onError?.(error);
    }
  });
  
  const optimize = (strategy: OptimizationStrategy, weights?: Record<string, number>) => {
    optimizationMutation.mutate({
      strategy,
      weights
    });
  };
  
  return {
    optimize,
    isOptimizing: optimizationMutation.isLoading,
    optimizationError: optimizationMutation.error,
    lastResult: optimizationMutation.data,
    optimizationHistory,
    clearHistory: () => setOptimizationHistory([])
  };
};
```

### 5.3 API Service Layer

```typescript
// services/api.ts - API Client
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  Unit, 
  UnitsListResponse, 
  OptimizationRequest, 
  OptimizationResponse 
} from '@/types/api';

/**
 * Centralized API client with error handling and type safety.
 * 
 * Design Principles:
 * 1. Single Axios instance with shared configuration
 * 2. Request/response interceptors for common logic
 * 3. TypeScript for compile-time safety
 * 4. Error handling with context
 */
class ApiService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          // Handle authentication error
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Units API
  async getUnits(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    needs_pricing_only?: boolean;
  }): Promise<UnitsListResponse> {
    const response = await this.client.get<UnitsListResponse>('/units', { params });
    return response.data;
  }
  
  async getUnit(unitId: string): Promise<Unit> {
    const response = await this.client.get<Unit>(`/units/${unitId}`);
    return response.data;
  }
  
  async optimizeUnit(unitId: string, request: OptimizationRequest): Promise<OptimizationResponse> {
    const response = await this.client.post<OptimizationResponse>(
      `/units/${unitId}/optimize`, 
      request
    );
    return response.data;
  }
  
  // Analytics API
  async getPortfolioAnalytics(): Promise<any> {
    const response = await this.client.get('/analytics/portfolio');
    return response.data;
  }
  
  async getPropertyAnalysis(propertyName: string): Promise<any> {
    const encodedName = encodeURIComponent(propertyName);
    const response = await this.client.get(`/analytics/property/${encodedName}/competition`);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
```

### 5.4 TypeScript Best Practices

```typescript
// types/api.ts - Type Definitions
/**
 * API type definitions with comprehensive documentation.
 * 
 * Naming Conventions:
 * 1. Interfaces use PascalCase
 * 2. Enums use PascalCase
 * 3. Properties use camelCase (matching backend snake_case conversion)
 * 4. Generic types use single letters (T, K, V)
 */

// Enums for constrained values
export enum UnitStatus {
  OCCUPIED = 'OCCUPIED',
  VACANT = 'VACANT', 
  NOTICE = 'NOTICE'
}

export enum OptimizationStrategy {
  REVENUE_MAX = 'revenue_maximization',
  LEASE_SPEED = 'lease_up_time_minimization',
  BALANCED = 'balanced'
}

// Base interfaces
export interface Unit {
  unit_id: string;
  property: string;
  bed: number;
  bath: number;
  sqft: number;
  advertised_rent: number;
  market_rent?: number;
  status: UnitStatus;
  pricing_urgency: string;
  rent_per_sqft: number;
  annual_revenue_potential: number;
}

// Request/Response interfaces
export interface OptimizationRequest {
  strategy: OptimizationStrategy;
  weights?: Record<string, number>;
}

export interface OptimizationResult {
  original_price: number;
  recommended_price: number;
  price_change: number;
  price_change_pct: number;
  demand_probability: number;
  expected_days_to_lease: number;
  annual_revenue_impact: number;
  strategy_used: OptimizationStrategy;
  confidence_score: number;
}

export interface OptimizationResponse {
  unit: Unit;
  comparables_summary: {
    count: number;
    avg_price: number;
    avg_sqft: number;
    similarity_range: [number, number];
  };
  optimization: OptimizationResult;
}

// Utility types
export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
};

// Type guards for runtime type checking
export const isUnit = (obj: any): obj is Unit => {
  return obj && 
    typeof obj.unit_id === 'string' &&
    typeof obj.property === 'string' &&
    typeof obj.bed === 'number' &&
    typeof obj.advertised_rent === 'number';
};

export const isOptimizationResponse = (obj: any): obj is OptimizationResponse => {
  return obj &&
    isUnit(obj.unit) &&
    obj.optimization &&
    typeof obj.optimization.recommended_price === 'number';
};
```

## 6. Naming Conventions & Code Style

### 6.1 Python Naming Conventions

```python
# Variables and functions: snake_case
user_id = "12345"
optimization_result = calculate_optimization()

# Classes: PascalCase  
class PricingOptimizer:
    pass

# Constants: UPPER_SNAKE_CASE
MAX_PRICE_ADJUSTMENT = 0.30
DEFAULT_ELASTICITY = -0.02

# Private members: leading underscore
class DatabaseService:
    def __init__(self):
        self._client = bigquery.Client()
        self.__private_key = "secret"
    
    def _internal_method(self):
        pass

# Module names: lowercase with underscores
# database_service.py
# pricing_optimization.py
```

### 6.2 TypeScript/JavaScript Naming Conventions

```typescript
// Variables and functions: camelCase
const userId = "12345";
const optimizationResult = calculateOptimization();

// Classes and interfaces: PascalCase
class ApiService {}
interface OptimizationRequest {}

// Constants: UPPER_SNAKE_CASE
const MAX_PRICE_ADJUSTMENT = 0.30;
const API_BASE_URL = process.env.VITE_API_URL;

// Enums: PascalCase with UPPER_CASE values
enum UnitStatus {
  OCCUPIED = 'OCCUPIED',
  VACANT = 'VACANT'
}

// Component files: PascalCase
// UnitOptimizationModal.tsx
// PropertyAnalyticsDashboard.tsx

// Hook files: camelCase starting with 'use'
// useUnitOptimization.ts
// usePortfolioAnalytics.ts
```

### 6.3 File and Directory Naming

```bash
# Backend (Python)
backend/
├── app/
│   ├── __init__.py         # Package init
│   ├── main.py             # Main application
│   ├── database_service.py # Service classes
│   ├── pricing_optimizer.py # Algorithm classes
│   └── config_manager.py   # Configuration
└── tests/
    ├── test_pricing.py     # Test files
    └── test_database.py

# Frontend (TypeScript/React)
frontend/src/
├── components/
│   ├── UnitGrid.tsx           # Component files
│   ├── OptimizationModal.tsx
│   └── common/
│       └── LoadingSpinner.tsx
├── pages/
│   ├── DashboardPage.tsx      # Page components
│   └── UnitsPage.tsx
├── hooks/
│   ├── useUnitData.ts         # Custom hooks
│   └── useOptimization.ts
└── services/
    ├── apiService.ts          # Service files
    └── authService.ts
```

## 7. Extension Points & Customization

### 7.1 Adding New Optimization Strategies

```python
# 1. Define strategy enum value (models.py)
class OptimizationStrategy(str, Enum):
    REVENUE_MAX = "revenue_maximization"
    LEASE_SPEED = "lease_up_time_minimization"
    BALANCED = "balanced"
    CUSTOM_STRATEGY = "custom_strategy"  # New strategy

# 2. Implement algorithm (pricing.py)
class PricingOptimizer:
    
    def optimize(self, unit_data, comparables, strategy, weights=None):
        # ... existing code ...
        elif strategy == OptimizationStrategy.CUSTOM_STRATEGY:
            result = self._custom_optimization(unit_data, comparables, weights)
        # ... existing code ...
    
    def _custom_optimization(self, unit_data, comparables, weights):
        """
        Implement your custom optimization logic here.
        
        Args:
            unit_data: Unit information dictionary
            comparables: List of comparable units
            weights: Optional strategy parameters
            
        Returns:
            OptimizationResult object
        """
        # Your custom algorithm implementation
        pass

# 3. Add frontend support (types/api.ts)
export enum OptimizationStrategy {
  REVENUE_MAX = 'revenue_maximization',
  LEASE_SPEED = 'lease_up_time_minimization',
  BALANCED = 'balanced',
  CUSTOM_STRATEGY = 'custom_strategy'  // New strategy
}

# 4. Update UI (components/OptimizationModal.tsx)
<MenuItem value="custom_strategy">Custom Strategy</MenuItem>
```

### 7.2 Adding New Analytics Endpoints

```python
# 1. Define data model (models.py)
class CustomAnalyticsResponse(BaseModel):
    metric_name: str
    values: List[float]
    timestamp: datetime

# 2. Implement service method (database.py)
class BigQueryService:
    
    async def get_custom_analytics(self, parameters: Dict) -> Dict:
        """
        Custom analytics implementation.
        
        Steps:
        1. Validate parameters
        2. Construct BigQuery query
        3. Execute and transform results
        4. Return structured response
        """
        query = """
        SELECT 
            custom_metric,
            calculation_value,
            analysis_date
        FROM your_custom_view
        WHERE filter_condition = @parameter
        """
        
        # Execute query and return results
        result = self.client.query(query).to_dataframe()
        return self._transform_custom_results(result)

# 3. Add API endpoint (main.py)
@app.get("/api/v1/analytics/custom", response_model=CustomAnalyticsResponse)
async def get_custom_analytics(
    parameter: str = Query(..., description="Custom parameter")
):
    """Custom analytics endpoint."""
    try:
        result = await db_service.get_custom_analytics({'parameter': parameter})
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Custom analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. Add frontend integration (services/api.ts)
class ApiService {
    async getCustomAnalytics(parameter: string): Promise<CustomAnalyticsResponse> {
        const response = await this.client.get(`/analytics/custom?parameter=${parameter}`);
        return response.data;
    }
}
```

### 7.3 Adding New UI Components

```typescript
// 1. Create component file (components/CustomChart.tsx)
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

interface CustomChartProps {
  data: any[];
  title: string;
  onDataPointClick?: (dataPoint: any) => void;
}

/**
 * Custom chart component following project patterns.
 * 
 * Design Guidelines:
 * 1. Use Material-UI theme colors
 * 2. Responsive design with ResponsiveContainer
 * 3. Consistent typography and spacing
 * 4. Error boundaries for robustness
 */
export const CustomChart: React.FC<CustomChartProps> = ({
  data,
  title,
  onDataPointClick
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#01D1D1"
              onClick={onDataPointClick}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// 2. Add to page component (pages/CustomAnalyticsPage.tsx)
import { CustomChart } from '@/components/CustomChart';

const CustomAnalyticsPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['custom-analytics'],
    queryFn: () => apiService.getCustomAnalytics('parameter')
  });

  return (
    <Box>
      <CustomChart 
        data={data?.chartData || []}
        title="Custom Metrics"
        onDataPointClick={(point) => console.log('Clicked:', point)}
      />
    </Box>
  );
};

# 3. Add route (App.tsx)
<Route path="/custom-analytics" element={<CustomAnalyticsPage />} />
```

## 8. Development Tools & Scripts

### 8.1 Useful Development Commands

```bash
# Backend Development
cd backend

# Start development server with auto-reload
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
poetry run pytest

# Run tests with coverage
poetry run pytest --cov=app --cov-report=html

# Type checking
poetry run mypy app/

# Code formatting
poetry run black app/
poetry run isort app/

# Linting
poetry run flake8 app/

# Frontend Development
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Database Operations
# Execute BigQuery setup
bq query --use_legacy_sql=false < sql/setup_bigquery.sql

# Test BigQuery connection
gcloud auth application-default login
python -c "from google.cloud import bigquery; print('Connected:', bigquery.Client().project)"
```

### 8.2 Debug Configuration

```json
// .vscode/launch.json - VS Code Debug Configuration
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/main.py",
      "args": [],
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "Python: Tests",
      "type": "python", 
      "request": "launch",
      "module": "pytest",
      "args": ["tests/", "-v"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### 8.3 Environment Setup Scripts

```bash
#!/bin/bash
# scripts/setup-dev-environment.sh

echo "🚀 Setting up AI Rent Optimizer development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed."; exit 1; }
command -v poetry >/dev/null 2>&1 || { echo "❌ Poetry is required but not installed."; exit 1; }

# Backend setup
echo "📦 Setting up backend..."
cd backend
poetry install
cp .env.example .env
echo "✅ Backend setup complete"

# Frontend setup  
echo "📦 Setting up frontend..."
cd ../frontend
npm install
cp .env.example .env
echo "✅ Frontend setup complete"

# Create development database
echo "🗄️ Setting up development database..."
# Add BigQuery setup commands here

echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env files with your credentials"
echo "2. Run 'cd backend && poetry run uvicorn main:app --reload'"
echo "3. Run 'cd frontend && npm run dev'"
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | August 2024 | Development Team | Initial developer guide |

---

**Document Classification:** Internal Development Documentation  
**Review Cycle:** Monthly  
**Next Review:** September 2024 