"""
Main FastAPI application for RentRoll AI Optimizer.
"""
import asyncio
import logging
import json
import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import db_service
from app.models import (
    BatchOptimizeRequest,
    BatchOptimizeResponse,
    ComparablesResponse,
    ErrorResponse,
    HealthResponse,
    OptimizeRequest,
    OptimizeResponse,
    OptimizationResult,
    UnitsListResponse,
)
from app.pricing import create_optimizer
from pydantic import BaseModel

# Settings models
class TableSettings(BaseModel):
    rentroll_table: str = os.getenv("BIGQUERY_RENTROLL_TABLE", "rentroll-ai.rentroll.Update_7_8_native")
    competition_table: str = os.getenv("BIGQUERY_COMPETITION_TABLE", "rentroll-ai.rentroll.Competition")
    project_id: str = os.getenv("GOOGLE_CLOUD_PROJECT", "rentroll-ai")

class TestResult(BaseModel):
    success: bool
    row_count: Optional[int] = None
    error: Optional[str] = None

class ConnectionTestResponse(BaseModel):
    rentroll_table: TestResult
    competition_table: TestResult

# Global effective settings
_current_settings: Optional[TableSettings] = None

def get_effective_settings() -> TableSettings:
    """Get current effective settings (dynamic settings override environment variables)."""
    global _current_settings
    
    # Try to load from file first (user's dynamic settings)
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                data = json.load(f)
                _current_settings = TableSettings(**data)
                logger.info(f"📝 Using dynamic settings: {_current_settings.rentroll_table}")
                return _current_settings
        except Exception as e:
            logger.warning(f"Error loading dynamic settings: {e}")
    
    # Fallback to environment variables + defaults
    if _current_settings is None:
        _current_settings = TableSettings()
        logger.info(f"🔧 Using environment/default settings: {_current_settings.rentroll_table}")
    
    return _current_settings

def update_database_service_settings():
    """Update the database service with current effective settings."""
    effective_settings = get_effective_settings()
    # Update the database service instance
    db_service.set_table_settings(effective_settings)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered rent optimization for rental properties",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "http://localhost:3004",  # Local development (alternative port)
        "https://*.vercel.app",   # Vercel deployments
        "*"  # Temporary - update with your actual Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Global pricing optimizer
pricing_optimizer = create_optimizer()


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.debug else None
        ).dict()
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    bigquery_connected = await db_service.test_connection()
    
    return HealthResponse(
        status="healthy" if bigquery_connected else "degraded",
        version=settings.app_version,
        bigquery_connected=bigquery_connected,
        services={
            "bigquery": "connected" if bigquery_connected else "disconnected",
            "pricing_engine": "ready"
        }
    )


@app.get(f"{settings.api_prefix}/units", response_model=UnitsListResponse)
async def get_units(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by unit status"),
    property: Optional[str] = Query(None, description="Filter by property"),
    needs_pricing_only: bool = Query(False, description="Only units needing pricing")
):
    """Get paginated list of units."""
    try:
        units, total_count = await db_service.get_units(
            page=page,
            page_size=page_size,
            status_filter=status,
            property_filter=property,
            needs_pricing_only=needs_pricing_only
        )
        
        return UnitsListResponse(
            units=units,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_next=(page * page_size) < total_count
        )
    except Exception as e:
        logger.error(f"Error getting units: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/units/{{unit_id}}/comparables", response_model=ComparablesResponse)
async def get_unit_comparables(unit_id: str):
    """Get comparable units for a specific unit."""
    try:
        # Get unit info
        unit = await db_service.get_unit_by_id(unit_id)
        if not unit:
            raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found")
        
        # Get comparables
        comps_df = await db_service.get_unit_comparables(unit_id)
        
        if comps_df.empty:
            return ComparablesResponse(
                unit_id=unit_id,
                unit=unit,
                comparables=[],
                total_comps=0,
                avg_comp_price=0,
                median_comp_price=0,
                min_comp_price=0,
                max_comp_price=0
            )
        
        # Convert to response format
        comparables = []
        for _, row in comps_df.iterrows():
            comparables.append({
                "comp_id": row["comp_id"],
                "comp_property": row["comp_property"],
                "bed": row["bed"],
                "bath": row["bath"],
                "comp_sqft": row["comp_sqft"],
                "comp_price": row["comp_price"],
                "is_available": row["is_available"],
                "sqft_delta_pct": row["sqft_delta_pct"],
                "price_gap_pct": row["price_gap_pct"],
                "similarity_score": row["similarity_score"],
                "comp_rank": row["comp_rank"]
            })
        
        # Get summary stats from first row (since they're duplicated across rows)
        first_row = comps_df.iloc[0]
        
        return ComparablesResponse(
            unit_id=unit_id,
            unit=unit,
            comparables=comparables,
            total_comps=first_row["total_comps"],
            avg_comp_price=first_row["avg_comp_price"],
            median_comp_price=first_row["median_comp_price"],
            min_comp_price=first_row["min_comp_price"],
            max_comp_price=first_row["max_comp_price"],
            comp_price_stddev=first_row.get("comp_price_stddev")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting comparables for unit {unit_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{settings.api_prefix}/units/{{unit_id}}/optimize", response_model=OptimizeResponse)
async def optimize_unit(unit_id: str, request: OptimizeRequest):
    """Optimize rent for a specific unit."""
    try:
        # Get unit data
        unit = await db_service.get_unit_by_id(unit_id)
        if not unit:
            raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found")
        
        # Get comparables
        comps_df = await db_service.get_unit_comparables(unit_id)
        
        # Create optimizer with custom elasticity if provided
        optimizer = create_optimizer(request.custom_elasticity)
        
        # Run optimization
        result = optimizer.optimize_unit(
            unit_data=unit,
            comps_data=comps_df,
            strategy=request.strategy,
            weight=request.weight
        )
        
        return OptimizeResponse(
            unit_id=unit_id,
            optimization=OptimizationResult(**result)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing unit {unit_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _optimize_single_unit(
    unit: dict, 
    strategy: str, 
    weight: Optional[float] = None,
    custom_elasticity: Optional[float] = None
) -> Optional[OptimizationResult]:
    """Optimize a single unit (helper for batch processing)."""
    try:
        # Get comparables
        comps_df = await db_service.get_unit_comparables(unit['unit_id'])
        
        # Create optimizer
        optimizer = create_optimizer(custom_elasticity)
        
        # Run optimization
        result = optimizer.optimize_unit(
            unit_data=unit,
            comps_data=comps_df,
            strategy=strategy,
            weight=weight
        )
        
        return OptimizationResult(**result)
        
    except Exception as e:
        logger.error(f"Error optimizing unit {unit['unit_id']}: {e}")
        return None


@app.post(f"{settings.api_prefix}/batch/optimize", response_model=BatchOptimizeResponse)
async def batch_optimize(request: BatchOptimizeRequest, background_tasks: BackgroundTasks):
    """Optimize multiple units in batch."""
    try:
        # Get units to optimize
        if request.unit_ids:
            # Specific units requested
            units = []
            for unit_id in request.unit_ids[:request.max_units]:
                unit = await db_service.get_unit_by_id(unit_id)
                if unit:
                    units.append(unit)
        else:
            # Get vacant units
            units = await db_service.get_vacant_units(limit=request.max_units)
        
        if not units:
            return BatchOptimizeResponse(
                total_units_processed=0,
                successful_optimizations=0,
                failed_optimizations=0,
                results=[]
            )
        
        # Process units with concurrency control
        semaphore = asyncio.Semaphore(settings.max_concurrent_optimizations)
        
        async def optimize_with_semaphore(unit):
            async with semaphore:
                return await _optimize_single_unit(
                    unit, 
                    request.strategy, 
                    request.weight,
                    request.custom_elasticity
                )
        
        # Execute optimizations
        logger.info(f"Starting batch optimization of {len(units)} units")
        tasks = [optimize_with_semaphore(unit) for unit in units]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        successful_results = []
        failed_count = 0
        
        for result in results:
            if isinstance(result, OptimizationResult):
                successful_results.append(result)
            else:
                failed_count += 1
        
        logger.info(
            f"Batch optimization completed: {len(successful_results)} successful, "
            f"{failed_count} failed"
        )
        
        return BatchOptimizeResponse(
            total_units_processed=len(units),
            successful_optimizations=len(successful_results),
            failed_optimizations=failed_count,
            results=successful_results
        )
        
    except Exception as e:
        logger.error(f"Error in batch optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/summary")
async def get_summary():
    """Get portfolio summary statistics."""
    try:
        unit_types_summary = await db_service.get_unit_types_summary()
        return {
            "unit_types": unit_types_summary,
            "total_properties": len(await db_service.get_properties())
        }
    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/analytics/portfolio")
async def get_portfolio_analytics():
    """Get comprehensive portfolio analytics for dashboard."""
    try:
        analytics = await db_service.get_portfolio_analytics()
        return analytics
    except Exception as e:
        logger.error(f"Error getting portfolio analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/analytics/market-position")
async def get_market_position():
    """Get market positioning analytics."""
    try:
        market_data = await db_service.get_market_position_analytics()
        return market_data
    except Exception as e:
        logger.error(f"Error getting market position analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/analytics/pricing-opportunities")
async def get_pricing_opportunities():
    """Get pricing optimization opportunities."""
    try:
        opportunities = await db_service.get_pricing_opportunities()
        return opportunities
    except Exception as e:
        logger.error(f"Error getting pricing opportunities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Property-specific analytics endpoints
@app.get(f"{settings.api_prefix}/properties")
async def get_properties():
    """Get list of all properties in the portfolio."""
    try:
        properties = await db_service.get_properties()
        return {"properties": properties}
    except Exception as e:
        logger.error(f"Error getting properties: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/test-property/{{property_name}}")
async def test_property_filter(property_name: str):
    """Test property filtering for debugging."""
    try:
        from urllib.parse import unquote
        decoded_property_name = unquote(property_name)
        result = await db_service.test_property_filter(decoded_property_name)
        return result
    except Exception as e:
        logger.error(f"Error in test property filter for {property_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/test-competition")
async def test_competition_data():
    """Test competition data structure for debugging."""
    try:
        result = await db_service.test_competition_data()
        return result
    except Exception as e:
        logger.error(f"Error in test competition data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/analytics/property/{{property_name}}/competition")
async def get_property_competition_analysis(property_name: str):
    """Get comprehensive property vs competition analysis."""
    try:
        # URL decode the property name
        from urllib.parse import unquote
        decoded_property_name = unquote(property_name)
        
        analysis = await db_service.get_property_vs_competition_analysis(decoded_property_name)
        return analysis
    except Exception as e:
        logger.error(f"Error getting property competition analysis for {property_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/analytics/property/{{property_name}}/units")
async def get_property_units_analysis(property_name: str):
    """Get detailed unit-level analysis for a specific property."""
    try:
        # URL decode the property name
        from urllib.parse import unquote
        decoded_property_name = unquote(property_name)
        
        analysis = await db_service.get_property_unit_analysis(decoded_property_name)
        return analysis
    except Exception as e:
        logger.error(f"Error getting property units analysis for {property_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{settings.api_prefix}/analytics/property/{{property_name}}/market-trends")
async def get_property_market_trends(property_name: str):
    """Get market trend analysis for a specific property."""
    try:
        # URL decode the property name
        from urllib.parse import unquote
        decoded_property_name = unquote(property_name)
        
        trends = await db_service.get_property_market_trends(decoded_property_name)
        return trends
    except Exception as e:
        logger.error(f"Error getting property market trends for {property_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Settings endpoints
SETTINGS_FILE = "app_settings.json"

def load_settings() -> TableSettings:
    """Load settings from file or return defaults."""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                data = json.load(f)
                return TableSettings(**data)
        except Exception as e:
            logger.warning(f"Error loading settings: {e}")
    return TableSettings()

def save_settings(settings_data: TableSettings) -> bool:
    """Save settings to file."""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings_data.dict(), f, indent=2)
        # Update database service with new settings
        update_database_service_settings()
        logger.info(f"💾 Settings saved and database service updated")
        return True
    except Exception as e:
        logger.error(f"Error saving settings: {e}")
        return False

@app.get(f"{settings.api_prefix}/settings")
async def get_settings():
    """Get current table settings."""
    try:
        return get_effective_settings()
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post(f"{settings.api_prefix}/settings")
async def save_settings_endpoint(settings_data: TableSettings):
    """Save table settings."""
    try:
        success = save_settings(settings_data)
        if success:
            return {"message": "Settings saved successfully", "settings": settings_data}
        else:
            raise HTTPException(status_code=500, detail="Failed to save settings")
    except Exception as e:
        logger.error(f"Error saving settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post(f"{settings.api_prefix}/settings/test")
async def test_table_connections(settings_data: TableSettings) -> ConnectionTestResponse:
    """Test connectivity to the configured BigQuery tables."""
    try:
        # Test rent roll table
        rentroll_result = TestResult(success=False)
        try:
            query = f"SELECT COUNT(*) as count FROM `{settings_data.rentroll_table}` LIMIT 1"
            result = db_service.client.query(query).result()
            row_count = list(result)[0]['count']
            rentroll_result = TestResult(success=True, row_count=row_count)
        except Exception as e:
            rentroll_result = TestResult(success=False, error=str(e))

        # Test competition table
        competition_result = TestResult(success=False)
        try:
            query = f"SELECT COUNT(*) as count FROM `{settings_data.competition_table}` LIMIT 1"
            result = db_service.client.query(query).result()
            row_count = list(result)[0]['count']
            competition_result = TestResult(success=True, row_count=row_count)
        except Exception as e:
            competition_result = TestResult(success=False, error=str(e))

        return ConnectionTestResponse(
            rentroll_table=rentroll_result,
            competition_table=competition_result
        )
    except Exception as e:
        logger.error(f"Error testing table connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Initialize database service with current settings on startup
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("🚀 Starting RentRoll AI Optimizer...")
    
    # Load and apply current effective settings
    update_database_service_settings()
    effective_settings = get_effective_settings()
    
    logger.info(f"📊 Active Configuration:")
    logger.info(f"   Rentroll Table: {effective_settings.rentroll_table}")
    logger.info(f"   Competition Table: {effective_settings.competition_table}")
    logger.info(f"   Project ID: {effective_settings.project_id}")
    
    # Test BigQuery connection
    connected = await db_service.test_connection()
    if connected:
        logger.info("✅ BigQuery connection successful")
    else:
        logger.warning("⚠️ BigQuery connection failed - check credentials and permissions")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    ) 