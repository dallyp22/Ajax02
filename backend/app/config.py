"""
Configuration settings for RentRoll AI Optimizer backend.
"""
import os
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "RentRoll AI Optimizer"
    app_version: str = "0.1.0"
    debug: bool = Field(default=False, description="Debug mode")
    
    # API
    api_prefix: str = "/api/v1"
    host: str = Field(default="0.0.0.0", description="Host to bind to")
    port: int = Field(default=8000, description="Port to bind to")
    
    # Google Cloud
    gcp_project_id: str = Field(default="rentroll-ai", description="GCP project ID")
    google_application_credentials: Optional[str] = Field(
        default=None, description="Path to service account key file"
    )
    
    # BigQuery
    bigquery_dataset_staging: str = Field(
        default="staging", description="BigQuery staging dataset"
    )
    bigquery_dataset_mart: str = Field(
        default="mart", description="BigQuery mart dataset"
    )
    bigquery_location: str = Field(default="US", description="BigQuery location")
    
    # Optimization Engine
    default_elasticity: float = Field(
        default=-0.003, description="Default demand elasticity"
    )
    max_price_adjustment: float = Field(
        default=0.25, description="Maximum price adjustment (25%)"
    )
    similarity_threshold: float = Field(
        default=50.0, description="Minimum similarity score for comps"
    )
    max_comps_per_unit: int = Field(
        default=10, description="Maximum comparables per unit"
    )
    
    # Rate Limiting & Performance
    max_concurrent_optimizations: int = Field(
        default=100, description="Max concurrent optimization requests"
    )
    cache_ttl_seconds: int = Field(
        default=3600, description="Cache TTL in seconds"
    )
    
    # Security
    secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        description="Secret key for JWT tokens"
    )
    access_token_expire_minutes: int = Field(
        default=30, description="Access token expiration time"
    )
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(
        default="json", description="Log format (json or text)"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
    def get_bigquery_table_name(self, dataset: str, table: str) -> str:
        """Get fully qualified BigQuery table name."""
        return f"{self.gcp_project_id}.{dataset}.{table}"


# Global settings instance
settings = Settings()

# Set Google Cloud credentials if provided
if settings.google_application_credentials:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials 