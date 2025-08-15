"""
Pydantic models for upload API requests and responses.
"""
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class UploadRequest(BaseModel):
    """Base upload request model."""
    property_id: str = Field(..., description="Property identifier")
    data_month: str = Field(..., pattern=r'^\d{4}-\d{2}$', description="Data month in YYYY-MM format")
    user_id: Optional[str] = Field(None, description="User ID (will be extracted from auth)")


class UploadResponse(BaseModel):
    """Upload processing response."""
    success: bool
    upload_id: str
    message: str
    row_count: Optional[int] = None
    quality_score: Optional[float] = None
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    processing_time_seconds: Optional[float] = None


class UploadMetadata(BaseModel):
    """Upload metadata record."""
    upload_id: str
    property_id: str
    user_id: Optional[str]
    file_type: str  # 'rent_roll' or 'competition'
    original_filename: str
    upload_date: date
    data_month: date
    row_count: Optional[int]
    file_size_bytes: Optional[int]
    validation_status: str  # 'pending', 'validated', 'failed'
    validation_errors: List[str] = Field(default_factory=list)
    validation_warnings: List[str] = Field(default_factory=list)
    processing_status: str  # 'uploaded', 'processing', 'completed', 'failed'
    processing_error: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class UploadHistoryResponse(BaseModel):
    """Response for upload history listing."""
    uploads: List[UploadMetadata]
    total_count: int
    property_id_filter: Optional[str]
    file_type_filter: Optional[str]


class ValidationResult(BaseModel):
    """Data validation result."""
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    quality_score: float = Field(..., ge=0.0, le=1.0)
    row_count: int
    column_mapping: Optional[Dict[str, str]] = None


class ProcessingLogEntry(BaseModel):
    """Processing log entry."""
    log_id: str
    upload_id: str
    step: str  # 'validation', 'parsing', 'normalization', 'insertion'
    status: str  # 'started', 'completed', 'failed'
    message: str
    details: Optional[Dict[str, Any]] = None
    duration_seconds: Optional[float] = None
    created_at: datetime


class UploadStatsResponse(BaseModel):
    """Upload statistics response."""
    total_uploads: int
    successful_uploads: int
    failed_uploads: int
    total_rows_processed: int
    avg_quality_score: float
    uploads_by_type: Dict[str, int]
    uploads_by_month: Dict[str, int]
    recent_uploads: List[UploadMetadata]


class FileTypeStats(BaseModel):
    """Statistics for a specific file type."""
    file_type: str
    total_uploads: int
    successful_uploads: int
    failed_uploads: int
    avg_rows_per_upload: float
    avg_quality_score: float
    last_upload_date: Optional[date]


class PropertyUploadSummary(BaseModel):
    """Upload summary for a specific property."""
    property_id: str
    total_uploads: int
    rent_roll_uploads: int
    competition_uploads: int
    last_upload_date: Optional[date]
    data_coverage_months: List[str]  # List of YYYY-MM strings
    avg_quality_score: float
    recent_uploads: List[UploadMetadata]
