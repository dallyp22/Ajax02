"""
Configuration settings for RentRoll AI Optimizer backend.
"""
import os
import json
import tempfile
import base64
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
    google_application_credentials_json: Optional[str] = Field(
        default=None, description="Service account key JSON string (for Railway)"
    )
    google_application_credentials_base64: Optional[str] = Field(
        default=None, description="Service account key JSON base64-encoded (alternative)"
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

# Handle Google Cloud credentials for Railway deployment
if settings.google_application_credentials_base64:
    # Base64 encoded credentials (most reliable for Railway)
    try:
        decoded_json = base64.b64decode(settings.google_application_credentials_base64).decode('utf-8')
        credentials_dict = json.loads(decoded_json)
        
        # Create a temporary file with the credentials
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            json.dump(credentials_dict, f, indent=2)
            temp_creds_path = f.name
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_creds_path
        print(f"🔑 Using base64-encoded credentials")
        
        # Validate the credentials work
        try:
            from google.auth import load_credentials_from_file
            creds, project = load_credentials_from_file(temp_creds_path)
            print(f"✅ Credentials validated for project: {project}")
        except Exception as e:
            print(f"⚠️  Credential validation failed: {e}")
            
    except Exception as e:
        print(f"❌ Failed to decode base64 credentials: {e}")
        raise
        
elif settings.google_application_credentials_json:
    # Railway: JSON credentials provided as environment variable
    try:
        credentials_dict = json.loads(settings.google_application_credentials_json)
        
        # Fix private key formatting - ensure proper newlines
        if "private_key" in credentials_dict:
            private_key = credentials_dict["private_key"]
            # Replace literal \n with actual newlines if needed
            if "\\n" in private_key:
                credentials_dict["private_key"] = private_key.replace("\\n", "\n")
        
        # Create a temporary file with the credentials
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            json.dump(credentials_dict, f, indent=2)
            temp_creds_path = f.name
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_creds_path
        print(f"🔑 Using JSON credentials from environment variable")
        
        # Validate the credentials work
        try:
            from google.auth import load_credentials_from_file
            creds, project = load_credentials_from_file(temp_creds_path)
            print(f"✅ Credentials validated for project: {project}")
        except Exception as e:
            print(f"⚠️  Credential validation failed: {e}")
            
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: {e}")
        raise
    except Exception as e:
        print(f"❌ Failed to setup credentials: {e}")
        raise
elif settings.google_application_credentials:
    # Local development: file path provided
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
    print(f"🔑 Using credentials file: {settings.google_application_credentials}")
else:
    # Try Application Default Credentials (ADC)
    print("🔑 Using Application Default Credentials (ADC)") 