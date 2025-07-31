"""
Pydantic models for API request/response schemas.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class UnitStatus(str, Enum):
    """Unit status enum."""
    OCCUPIED = "OCCUPIED"
    VACANT = "VACANT"
    NOTICE = "NOTICE"


class PricingUrgency(str, Enum):
    """Pricing urgency levels."""
    IMMEDIATE = "IMMEDIATE"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class OptimizationStrategy(str, Enum):
    """Optimization strategy options."""
    REVENUE = "revenue"
    LEASE_UP = "lease_up"
    BALANCED = "balanced"


class UnitType(str, Enum):
    """Unit type categories."""
    STUDIO = "STUDIO"
    ONE_BR = "1BR"
    TWO_BR = "2BR"
    THREE_BR = "3BR"
    FOUR_BR_PLUS = "4BR+"


class SizeCategory(str, Enum):
    """Unit size categories."""
    MICRO = "MICRO"
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"
    XLARGE = "XLARGE"


# Request Models
class OptimizeRequest(BaseModel):
    """Request model for unit optimization."""
    strategy: OptimizationStrategy
    weight: Optional[float] = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0,
        description="Weight for balanced strategy (0.0=lease_up, 1.0=revenue)"
    )
    custom_elasticity: Optional[float] = Field(
        default=None,
        description="Custom demand elasticity override"
    )


class BatchOptimizeRequest(BaseModel):
    """Request model for batch optimization."""
    unit_ids: Optional[List[str]] = Field(
        default=None,
        description="Specific unit IDs to optimize (None = all vacant units)"
    )
    strategy: OptimizationStrategy
    weight: Optional[float] = Field(default=0.5, ge=0.0, le=1.0)
    custom_elasticity: Optional[float] = None
    max_units: Optional[int] = Field(
        default=100,
        description="Maximum number of units to optimize"
    )


# Response Models
class UnitBase(BaseModel):
    """Base unit information."""
    unit_id: str
    property: str
    bed: int
    bath: int
    sqft: int
    status: UnitStatus
    advertised_rent: float
    market_rent: Optional[float] = None
    rent_per_sqft: Optional[float] = None


class Unit(UnitBase):
    """Complete unit information."""
    move_out_date: Optional[str] = None
    lease_end_date: Optional[str] = None
    days_to_lease_end: Optional[int] = None
    needs_pricing: bool
    rent_premium_pct: Optional[float] = None
    pricing_urgency: PricingUrgency
    unit_type: UnitType
    size_category: SizeCategory
    annual_revenue_potential: float
    has_complete_data: bool


class Comparable(BaseModel):
    """Comparable unit information."""
    comp_id: str
    comp_property: str
    bed: int
    bath: int
    comp_sqft: int
    comp_price: float
    is_available: bool
    sqft_delta_pct: float
    price_gap_pct: Optional[float] = None
    similarity_score: float
    comp_rank: int


class ComparablesResponse(BaseModel):
    """Response model for unit comparables."""
    unit_id: str
    unit: UnitBase
    comparables: List[Comparable]
    total_comps: int
    avg_comp_price: float
    median_comp_price: float
    min_comp_price: float
    max_comp_price: float
    comp_price_stddev: Optional[float] = None


class OptimizationResult(BaseModel):
    """Optimization result for a single unit."""
    unit_id: str
    current_rent: float
    suggested_rent: float
    rent_change: float
    rent_change_pct: float
    confidence: Optional[float] = None
    strategy_used: OptimizationStrategy
    demand_probability: Optional[float] = None
    expected_days_to_lease: Optional[int] = None
    revenue_impact_annual: float
    comp_data: dict = Field(
        default_factory=dict,
        description="Supporting comparable data"
    )


class OptimizeResponse(BaseModel):
    """Response model for unit optimization."""
    unit_id: str
    optimization: OptimizationResult
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class BatchOptimizeResponse(BaseModel):
    """Response model for batch optimization."""
    total_units_processed: int
    successful_optimizations: int
    failed_optimizations: int
    results: List[OptimizationResult]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class UnitsListResponse(BaseModel):
    """Response model for units listing."""
    units: List[Unit]
    total_count: int
    page: int
    page_size: int
    has_next: bool


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    bigquery_connected: bool
    services: dict = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow) 