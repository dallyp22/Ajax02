"""
Main FastAPI application for RentRoll AI Optimizer.
"""
import asyncio
import logging
import json
import os
import pandas as pd
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, UploadFile, File, Form, Depends
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
from app.upload_models import (
    UploadResponse,
    UploadHistoryResponse,
    UploadStatsResponse,
    PropertyUploadSummary,
    ValidationResult
)
from app.upload_service import upload_service
from app.pricing import create_optimizer
from app.admin_service import (
    AdminService,
    CreateClientRequest,
    ClientInfo,
    CreateUserRequest,
    UserInfo,
)
from app.auth import (
    UserContext,
    get_current_user,
    require_client_access,
    require_super_admin,
    require_client_admin,
    get_client_context,
    get_current_user_dev,  # For development without Auth0
)
from app.utils import CustomJSONEncoder, safe_json_response
from pydantic import BaseModel

# Custom JSON Response class
class SafeJSONResponse(JSONResponse):
    """
    Custom JSONResponse that handles pandas/numpy data types and NaN values.
    """
    def render(self, content) -> bytes:
        # Clean the content for safe JSON serialization
        safe_content = safe_json_response(content)
        return json.dumps(
            safe_content,
            cls=CustomJSONEncoder,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")

# Settings models
class TableSettings(BaseModel):
    rentroll_table: str = os.getenv("BIGQUERY_RENTROLL_TABLE", "rentroll-ai.rentroll.Update_7_8_native")
    competition_table: str = os.getenv("BIGQUERY_COMPETITION_TABLE", "rentroll-ai.rentroll.Competition")
    archive_table: str = os.getenv("BIGQUERY_ARCHIVE_TABLE", "rentroll-ai.rentroll.ArchiveAptMain")
    project_id: str = os.getenv("GOOGLE_CLOUD_PROJECT", "rentroll-ai")

class TestResult(BaseModel):
    success: bool
    row_count: Optional[int] = None
    error: Optional[str] = None

class ConnectionTestResponse(BaseModel):
    rentroll_table: TestResult
    competition_table: TestResult
    archive_table: TestResult

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
        "http://localhost:3000",
        "http://localhost:3004", 
        "http://localhost:3005",
        "http://localhost:3006",  # Add new frontend port
        "https://*.vercel.app",
        "*"  # Temporary - remove in production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global pricing optimizer
pricing_optimizer = create_optimizer()

# Global admin service
admin_service = AdminService()


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


# Authentication and User Management Endpoints

@app.get("/auth/test")
async def test_auth():
    """Simple auth test endpoint."""
    return {"status": "auth_system_working", "mode": "development"}

@app.get("/auth/profile")
async def get_user_profile(user: UserContext = Depends(get_current_user_dev)):
    """Get current user profile and permissions."""
    return {
        "user_id": user.user_id,
        "email": user.email,
        "roles": user.roles,
        "client_id": user.client_id,
        "is_super_admin": user.is_super_admin,
        "is_client_admin": user.is_client_admin,
        "auth_status": "authenticated"
    }


@app.get("/auth/client-context")
async def get_client_context_info(
    user: UserContext = Depends(get_current_user_dev),
    target_client_id: Optional[str] = Query(None, description="Specific client ID (super admin only)")
):
    """Get client context for data access."""
    client_id = get_client_context(user, target_client_id)
    
    return {
        "active_client_id": client_id,
        "user_client_id": user.client_id,
        "is_super_admin": user.is_super_admin,
        "can_switch_clients": user.is_super_admin
    }


@app.get(f"{settings.api_prefix}/units", response_model=UnitsListResponse)
async def get_units(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by unit status"),
    property: Optional[str] = Query(None, description="Filter by property"),
    properties: Optional[List[str]] = Query(default=None, description="Filter by multiple properties"),
    needs_pricing_only: bool = Query(False, description="Only units needing pricing")
):
    """Get paginated list of units."""
    try:
        units, total_count = await db_service.get_units(
            page=page,
            page_size=page_size,
            status_filter=status,
            property_filter=property,
            properties_filter=properties,
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
                "price_gap_pct": row["price_gap_pct"] if pd.notna(row["price_gap_pct"]) else None,
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
            avg_comp_price=first_row["avg_comp_price"] if pd.notna(first_row["avg_comp_price"]) else 0,
            median_comp_price=first_row["median_comp_price"] if pd.notna(first_row["median_comp_price"]) else 0,
            min_comp_price=first_row["min_comp_price"] if pd.notna(first_row["min_comp_price"]) else 0,
            max_comp_price=first_row["max_comp_price"] if pd.notna(first_row["max_comp_price"]) else 0,
            comp_price_stddev=first_row.get("comp_price_stddev") if pd.notna(first_row.get("comp_price_stddev", 0)) else None
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
            weight=request.weight,
            excluded_comp_ids=request.excluded_comp_ids
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
    custom_elasticity: Optional[float] = None,
    excluded_comp_ids: Optional[List[str]] = None
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
            weight=weight,
            excluded_comp_ids=excluded_comp_ids
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


@app.get("/api/v1/analytics/portfolio")
async def get_portfolio_analytics(properties: Optional[List[str]] = Query(default=None)):
    """Get portfolio-wide analytics data with optional property filtering."""
    try:
        result = await db_service.get_portfolio_analytics(selected_properties=properties)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in portfolio analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/analytics/market-position")
async def get_market_position_analytics(properties: Optional[List[str]] = Query(default=None)):
    """Get market position analytics with optional property filtering."""
    try:
        result = await db_service.get_market_position_analytics(selected_properties=properties)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in market position analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/analytics/pricing-opportunities")
async def get_pricing_opportunities(properties: Optional[List[str]] = Query(default=None)):
    """Get pricing opportunities with optional property filtering."""
    try:
        result = await db_service.get_pricing_opportunities(selected_properties=properties)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in pricing opportunities: {e}")
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
        return SafeJSONResponse(content=analysis)
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
        return SafeJSONResponse(content=analysis)
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
        return SafeJSONResponse(content=trends)
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

        # Test archive table
        archive_result = TestResult(success=False)
        try:
            query = f"SELECT COUNT(*) as count FROM `{settings_data.archive_table}` LIMIT 1"
            result = db_service.client.query(query).result()
            row_count = list(result)[0]['count']
            archive_result = TestResult(success=True, row_count=row_count)
        except Exception as e:
            archive_result = TestResult(success=False, error=str(e))

        return ConnectionTestResponse(
            rentroll_table=rentroll_result,
            competition_table=competition_result,
            archive_table=archive_result
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

# SvSN Analytics Endpoints for NuStyle vs Competition Analysis
@app.get("/api/v1/svsn/benchmark")
async def get_svsn_benchmark_analysis(bedroom_type: Optional[str] = Query(None)):
    """Get benchmark bar charts comparing NuStyle vs Competition by bedroom type."""
    try:
        result = await db_service.get_svsn_benchmark_analysis(bedroom_type)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in SvSN benchmark analysis endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/svsn/vacancy")
async def get_svsn_vacancy_analysis(bedroom_type: Optional[str] = Query(None)):
    """Get vacancy performance analysis by bedroom type."""
    try:
        result = await db_service.get_svsn_vacancy_analysis(bedroom_type)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in SvSN vacancy analysis endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/svsn/rent-spread")
async def get_svsn_rent_spread_analysis():
    """Get rent spread analysis for NuStyle units (Advertised vs Market rent)."""
    try:
        result = await db_service.get_svsn_rent_spread_analysis()
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in SvSN rent spread analysis endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/svsn/clustering")
async def get_svsn_market_rent_clustering(bedroom_type: Optional[str] = Query(None)):
    """Get market rent clustering analysis with rent buckets."""
    try:
        result = await db_service.get_svsn_market_rent_clustering(bedroom_type)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in SvSN market rent clustering endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/svsn/recommendations")
async def get_svsn_optimization_recommendations():
    """Get optimization recommendations for NuStyle units."""
    try:
        result = await db_service.get_svsn_optimization_recommendations()
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in SvSN optimization recommendations endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Archive Analytics Endpoints
@app.get("/api/v1/archive/benchmark")
async def get_archive_benchmark(bedroom_type: Optional[str] = None):
    """Get benchmark analysis for Archive properties."""
    try:
        result = await db_service.get_archive_benchmark_analysis(bedroom_type)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in archive benchmark endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/archive/vacancy")
async def get_archive_vacancy(bedroom_type: Optional[str] = None):
    """Get vacancy performance analysis for Archive properties."""
    try:
        result = await db_service.get_archive_vacancy_analysis(bedroom_type)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in archive vacancy endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/archive/rent-spread")
async def get_archive_rent_spread():
    """Get rent spread analysis for Archive properties."""
    try:
        result = await db_service.get_archive_rent_spread_analysis()
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in archive rent spread endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/archive/clustering")
async def get_archive_clustering(bedroom_type: Optional[str] = None):
    """Get market rent clustering analysis for Archive properties."""
    try:
        result = await db_service.get_archive_market_rent_clustering(bedroom_type)
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in archive clustering endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/archive/recommendations")
async def get_archive_recommendations():
    """Get optimization recommendations for Archive properties."""
    try:
        result = await db_service.get_archive_optimization_recommendations()
        return SafeJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error in archive recommendations endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Upload Endpoints
# ============================================================================

@app.post("/api/v1/uploads/rent-roll")
async def upload_rent_roll(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    property_id: str = Form(...),
    data_month: str = Form(...),
    user_id: str = Form(default="system")  # TODO: Extract from auth
):
    """
    Upload monthly rent roll data.
    
    Args:
        file: CSV file containing rent roll data
        property_id: Property identifier
        data_month: Data month in YYYY-MM format
        user_id: User ID (extracted from auth in production)
    
    Returns:
        Upload processing result
    """
    start_time = asyncio.get_event_loop().time()
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Process upload
        result = await upload_service.process_upload(
            file_content=file_content,
            filename=file.filename,
            file_type='rent_roll',
            property_id=property_id,
            data_month=data_month,
            user_id=user_id
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        response_data = {
            **result,
            'processing_time_seconds': round(processing_time, 2),
            'message': 'Rent roll data processed successfully' if result['success'] else 'Processing failed'
        }
        
        return SafeJSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in rent roll upload endpoint: {e}")
        processing_time = asyncio.get_event_loop().time() - start_time
        
        error_response = {
            'success': False,
            'upload_id': '',
            'message': f'Upload failed: {str(e)}',
            'errors': [str(e)],
            'warnings': [],
            'processing_time_seconds': round(processing_time, 2)
        }
        
        return SafeJSONResponse(content=error_response, status_code=500)


@app.post("/api/v1/uploads/competition")
async def upload_competition(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    property_id: str = Form(...),
    data_month: str = Form(...),
    user_id: str = Form(default="system")  # TODO: Extract from auth
):
    """
    Upload monthly competition data.
    
    Args:
        file: CSV file containing competition data
        property_id: Property identifier
        data_month: Data month in YYYY-MM format
        user_id: User ID (extracted from auth in production)
    
    Returns:
        Upload processing result
    """
    start_time = asyncio.get_event_loop().time()
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Process upload
        result = await upload_service.process_upload(
            file_content=file_content,
            filename=file.filename,
            file_type='competition',
            property_id=property_id,
            data_month=data_month,
            user_id=user_id
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        response_data = {
            **result,
            'processing_time_seconds': round(processing_time, 2),
            'message': 'Competition data processed successfully' if result['success'] else 'Processing failed'
        }
        
        return SafeJSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in competition upload endpoint: {e}")
        processing_time = asyncio.get_event_loop().time() - start_time
        
        error_response = {
            'success': False,
            'upload_id': '',
            'message': f'Upload failed: {str(e)}',
            'errors': [str(e)],
            'warnings': [],
            'processing_time_seconds': round(processing_time, 2)
        }
        
        return SafeJSONResponse(content=error_response, status_code=500)


@app.get("/api/v1/uploads/history")
async def get_upload_history(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    file_type: Optional[str] = Query(None, description="Filter by file type (rent_roll or competition)"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of records to return")
):
    """
    Get upload history with optional filtering.
    
    Args:
        property_id: Optional property ID filter
        file_type: Optional file type filter
        limit: Maximum number of records to return
    
    Returns:
        List of upload metadata records
    """
    try:
        uploads = await upload_service.get_upload_history(
            property_id=property_id,
            file_type=file_type,
            limit=limit
        )
        
        response_data = {
            'uploads': uploads,
            'total_count': len(uploads),
            'property_id_filter': property_id,
            'file_type_filter': file_type
        }
        
        return SafeJSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error in upload history endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/uploads/switch-to-uploads")
async def switch_to_uploaded_data():
    """Switch the analytics system to use uploaded data instead of static tables."""
    try:
        # Update table configuration to use uploaded data
        new_settings = TableSettings(
            rentroll_table=f"{settings.gcp_project_id}.uploads.analytics_rent_roll",
            competition_table=f"{settings.gcp_project_id}.uploads.analytics_competition",
            archive_table=f"{settings.gcp_project_id}.rentroll.ArchiveAptMain",  # Keep existing
            project_id=settings.gcp_project_id
        )
        
        # Save settings
        global _current_settings
        _current_settings = new_settings
        
        # Save to file for persistence
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(new_settings.dict(), f, indent=2)
        
        # Update database service
        update_database_service_settings()
        
        logger.info("🔄 Switched to uploaded data analytics tables")
        
        return SafeJSONResponse(content={
            'success': True,
            'message': 'Successfully switched to uploaded data',
            'settings': new_settings.dict()
        })
        
    except Exception as e:
        logger.error(f"Error switching to uploaded data: {e}")
        return SafeJSONResponse(
            content={'error': f'Failed to switch to uploaded data: {str(e)}'},
            status_code=500
        )


@app.post("/api/v1/uploads/switch-to-original")
async def switch_to_original_data():
    """Switch back to original static tables."""
    try:
        # Update table configuration to use original tables
        new_settings = TableSettings(
            rentroll_table=f"{settings.gcp_project_id}.rentroll.Update_7_8_native",
            competition_table=f"{settings.gcp_project_id}.rentroll.Competition",
            archive_table=f"{settings.gcp_project_id}.rentroll.ArchiveAptMain",
            project_id=settings.gcp_project_id
        )
        
        # Save settings
        global _current_settings
        _current_settings = new_settings
        
        # Save to file for persistence
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(new_settings.dict(), f, indent=2)
        
        # Update database service
        update_database_service_settings()
        
        logger.info("🔄 Switched back to original analytics tables")
        
        return SafeJSONResponse(content={
            'success': True,
            'message': 'Successfully switched to original data',
            'settings': new_settings.dict()
        })
        
    except Exception as e:
        logger.error(f"Error switching to original data: {e}")
        return SafeJSONResponse(
            content={'error': f'Failed to switch to original data: {str(e)}'},
            status_code=500
        )


@app.post("/api/v1/uploads/refresh-analytics")
async def refresh_analytics_tables():
    """Refresh analytics tables with latest uploaded data."""
    try:
        # Re-run the ETL pipeline to update analytics tables
        from create_upload_to_analytics_pipeline import create_analytics_tables_from_uploads
        
        success = create_analytics_tables_from_uploads()
        
        if success:
            return SafeJSONResponse(content={
                'success': True,
                'message': 'Analytics tables refreshed with latest uploads'
            })
        else:
            return SafeJSONResponse(
                content={'error': 'Failed to refresh analytics tables'},
                status_code=500
            )
        
    except Exception as e:
        logger.error(f"Error refreshing analytics tables: {e}")
        return SafeJSONResponse(
            content={'error': f'Failed to refresh analytics tables: {str(e)}'},
            status_code=500
        )


# ====================================
# SUPER ADMIN ENDPOINTS
# ====================================

@app.post("/api/v1/admin/clients", response_model=ClientInfo)
async def create_client(
    request: CreateClientRequest,
    current_user: UserContext = Depends(require_super_admin)
):
    """Create a new client (Super Admin only)"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    try:
        client = await admin_service.create_client(request)
        logger.info(f"Super admin created client: {client.client_id}")
        return client
    except Exception as e:
        logger.error(f"Error creating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/admin/clients", response_model=List[ClientInfo])
async def list_clients(
    current_user: UserContext = Depends(require_super_admin)
):
    """List all clients (Super Admin only)"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    try:
        clients = await admin_service.list_clients()
        return clients
    except Exception as e:
        logger.error(f"Error listing clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/admin/clients/{client_id}", response_model=ClientInfo)
async def get_client(
    client_id: str,
    current_user: UserContext = Depends(require_super_admin)
):
    """Get specific client details (Super Admin only)"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    try:
        client = await admin_service.get_client(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        return client
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting client {client_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/admin/users", response_model=UserInfo)
async def create_user(
    request: CreateUserRequest,
    current_user: UserContext = Depends(require_super_admin)
):
    """Create a new user for a client (Super Admin only)"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    try:
        user = await admin_service.create_user(request)
        logger.info(f"Super admin created user: {user.user_id}")
        return user
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/admin/users", response_model=List[UserInfo])
async def list_users(
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    current_user: UserContext = Depends(require_super_admin)
):
    """List users, optionally filtered by client (Super Admin only)"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    try:
        users = await admin_service.list_users(client_id=client_id)
        return users
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/v1/admin/clients/{client_id}/status")
async def update_client_status(
    client_id: str,
    status: str,
    current_user: UserContext = Depends(require_super_admin)
):
    """Update client status (Super Admin only)"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    if status not in ["active", "suspended", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        await admin_service.update_client_status(client_id, status)
        logger.info(f"Super admin {current_user.sub} updated client {client_id} status to {status}")
        return {"message": f"Client status updated to {status}"}
    except Exception as e:
        logger.error(f"Error updating client status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/setup/system-tables")
async def setup_system_tables_endpoint():
    """One-time setup of system tables (No auth required for initial setup)."""
    try:
        import subprocess
        import sys
        import os
        
        # Run the setup script
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "setup_system_tables.py")
        result = subprocess.run([sys.executable, script_path], 
                              capture_output=True, text=True, cwd=os.path.dirname(script_path))
        
        if result.returncode == 0:
            return {
                "status": "success", 
                "message": "System tables created successfully",
                "output": result.stdout
            }
        else:
            return {
                "status": "error",
                "message": "Setup failed",
                "error": result.stderr,
                "output": result.stdout
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Setup failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    ) 