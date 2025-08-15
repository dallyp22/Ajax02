"""
Upload processing service for monthly rent roll and competition data.
"""
import asyncio
import json
import logging
import uuid
from datetime import date, datetime
from typing import Dict, List, Optional, Tuple, Union
from io import StringIO
import pandas as pd
import numpy as np
from google.cloud import bigquery
try:
    from google.cloud.exceptions import NotFound
    from google.cloud import storage
except ImportError:
    # Fallback for development
    class NotFound(Exception):
        pass
    storage = None

from app.config import settings
from app.utils import serialize_for_json

logger = logging.getLogger(__name__)


class UploadValidationError(Exception):
    """Custom exception for upload validation errors."""
    pass


class UploadProcessingError(Exception):
    """Custom exception for upload processing errors."""
    pass


class DataValidator:
    """Handles data validation for uploaded files."""
    
    # Required columns for rent roll data
    RENT_ROLL_REQUIRED_COLUMNS = {
        'Unit': str,
        'Bedroom': int,
        'Bathrooms': float,
        'Sqft': int,
        'Status': str,
        'Property': str
    }
    
    # Optional but valuable columns for rent roll
    RENT_ROLL_OPTIONAL_COLUMNS = {
        'Market_Rent': float,
        'Rent': float,
        'Advertised_Rent': float,
        'Tenant': str,
        'Lease_From': str,
        'Lease_To': str,
        'Move_in': str,
        'Move_out': str
    }
    
    # Required columns for competition data
    COMPETITION_REQUIRED_COLUMNS = {
        'Reporting Property Name': str,
        'Bedrooms': str,
        'Market Rent': str,  # Often has $ formatting
        'Avg. Sq. Ft.': str
    }
    
    def validate_rent_roll_schema(self, df: pd.DataFrame) -> Dict:
        """Validate rent roll file schema and data quality."""
        errors = []
        warnings = []
        quality_score = 1.0
        
        # Check required columns
        missing_required = []
        for col, dtype in self.RENT_ROLL_REQUIRED_COLUMNS.items():
            if col not in df.columns:
                missing_required.append(col)
        
        if missing_required:
            errors.append(f"Missing required columns: {', '.join(missing_required)}")
            return {
                'valid': False,
                'errors': errors,
                'warnings': warnings,
                'quality_score': 0.0
            }
        
        # Check data types and ranges
        try:
            # Validate numeric columns
            if 'Bedroom' in df.columns:
                bedroom_series = pd.to_numeric(df['Bedroom'], errors='coerce')
                invalid_bedrooms = bedroom_series[(bedroom_series < 0) | (bedroom_series > 10)]
                if len(invalid_bedrooms) > 0:
                    warnings.append(f"{len(invalid_bedrooms)} rows have invalid bedroom counts")
                    quality_score *= 0.95
            
            if 'Sqft' in df.columns:
                sqft_series = pd.to_numeric(df['Sqft'].astype(str).str.replace(',', ''), errors='coerce')
                invalid_sqft = sqft_series[(sqft_series < 100) | (sqft_series > 10000)]
                if len(invalid_sqft) > 0:
                    warnings.append(f"{len(invalid_sqft)} rows have invalid square footage")
                    quality_score *= 0.9
            
            # Check for reasonable rent values
            if 'Market_Rent' in df.columns:
                # Clean rent data (remove $ and commas)
                rent_cleaned = pd.to_numeric(df['Market_Rent'].astype(str).str.replace(r'[$,"]', '', regex=True), errors='coerce')
                invalid_rents = rent_cleaned[~rent_cleaned.between(100, 20000)]
                if len(invalid_rents) > 0:
                    warnings.append(f"{len(invalid_rents)} rows have unusual rent values")
                    quality_score *= 0.95
            
            # Check for duplicate units
            if 'Unit' in df.columns and 'Property' in df.columns:
                duplicates = df.duplicated(subset=['Unit', 'Property'])
                if duplicates.sum() > 0:
                    errors.append(f"{duplicates.sum()} duplicate unit entries found")
                    quality_score *= 0.8
            
            # Check data completeness
            total_cells = len(df) * len(df.columns)
            empty_cells = df.isnull().sum().sum()
            completeness = (total_cells - empty_cells) / total_cells
            quality_score *= completeness
            
            if completeness < 0.8:
                warnings.append(f"Data completeness is only {completeness:.1%}")
        
        except Exception as e:
            logger.error(f"Error during rent roll validation: {e}")
            errors.append(f"Validation error: {str(e)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'quality_score': max(0.0, quality_score),
            'row_count': len(df),
            'completeness': completeness if 'completeness' in locals() else 0.0
        }
    
    def validate_competition_schema(self, df: pd.DataFrame) -> Dict:
        """Validate competition file schema and data quality."""
        errors = []
        warnings = []
        quality_score = 1.0
        
        # Check required columns (with flexibility for column name variations)
        column_mapping = self._map_competition_columns(df.columns)
        missing_required = []
        
        for required_col in self.COMPETITION_REQUIRED_COLUMNS.keys():
            if required_col not in column_mapping:
                missing_required.append(required_col)
        
        if missing_required:
            errors.append(f"Missing required columns: {', '.join(missing_required)}")
            return {
                'valid': False,
                'errors': errors,
                'warnings': warnings,
                'quality_score': 0.0
            }
        
        try:
            # Validate rent data
            rent_col = column_mapping.get('Market Rent')
            if rent_col and rent_col in df.columns:
                # Clean and validate rent values
                rent_cleaned = pd.to_numeric(
                    df[rent_col].astype(str).str.replace(r'[$,"]', '', regex=True), 
                    errors='coerce'
                )
                invalid_rents = rent_cleaned.isnull().sum()
                if invalid_rents > 0:
                    warnings.append(f"{invalid_rents} rows have invalid rent values")
                    quality_score *= 0.9
            
            # Validate square footage
            sqft_col = column_mapping.get('Avg. Sq. Ft.')
            if sqft_col and sqft_col in df.columns:
                sqft_cleaned = pd.to_numeric(
                    df[sqft_col].astype(str).str.replace(r'[,"]', '', regex=True), 
                    errors='coerce'
                )
                invalid_sqft = sqft_cleaned[~sqft_cleaned.between(100, 5000)].count()
                if invalid_sqft > 0:
                    warnings.append(f"{invalid_sqft} rows have invalid square footage")
                    quality_score *= 0.95
            
            # Check data completeness
            total_cells = len(df) * len(df.columns)
            empty_cells = df.isnull().sum().sum()
            completeness = (total_cells - empty_cells) / total_cells
            quality_score *= completeness
            
        except Exception as e:
            logger.error(f"Error during competition validation: {e}")
            errors.append(f"Validation error: {str(e)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'quality_score': max(0.0, quality_score),
            'row_count': len(df),
            'column_mapping': column_mapping
        }
    
    def _map_competition_columns(self, columns: List[str]) -> Dict[str, str]:
        """Map actual column names to expected standard names."""
        mapping = {}
        
        # Define possible column name variations
        column_variations = {
            'Reporting Property Name': ['Reporting Property Name', 'Property Name', 'Property', 'Competitor'],
            'Market Rent': ['Market Rent', 'Market_Rent', 'Rent', 'Price'],
            'Bedrooms': ['Bedrooms', 'Bedroom', 'Bed', 'BR'],
            'Avg. Sq. Ft.': ['Avg. Sq. Ft.', 'Avg Sq Ft', 'Square Feet', 'Sqft', 'Sq_Ft']
        }
        
        for standard_name, variations in column_variations.items():
            for variation in variations:
                if variation in columns:
                    mapping[standard_name] = variation
                    break
        
        return mapping


class DataNormalizer:
    """Handles data normalization and cleaning."""
    
    def normalize_rent_roll_data(self, df: pd.DataFrame, property_id: str, upload_id: str, data_month: date) -> pd.DataFrame:
        """Normalize rent roll data for BigQuery storage."""
        normalized = df.copy()
        
        # Add metadata columns
        normalized['upload_id'] = upload_id
        normalized['property_id'] = property_id
        normalized['upload_date'] = date.today()
        normalized['data_month'] = data_month
        
        # Create normalized unit_id
        normalized['unit_id'] = property_id + '_' + normalized['Unit'].astype(str)
        
        # Normalize status to standard values
        status_mapping = {
            'Current': 'OCCUPIED',
            'Vacant': 'VACANT', 
            'Vacant-Unrented': 'VACANT',
            'Notice': 'NOTICE',
            'Notice-Unrented': 'NOTICE'
        }
        normalized['occupancy_status'] = normalized['Status'].map(status_mapping).fillna('UNKNOWN')
        
        # Clean and convert financial columns
        financial_columns = ['Market_Rent', 'Rent', 'Advertised_Rent', 'Previous_Rent', 'Deposit', 'Past_Due']
        for col in financial_columns:
            if col in normalized.columns:
                normalized[col] = self._clean_currency_column(normalized[col])
        
        # Clean and convert numeric columns (like sqft)
        numeric_columns = ['Sqft', 'Bedroom', 'Bathrooms']
        for col in numeric_columns:
            if col in normalized.columns:
                if col == 'Sqft':
                    normalized[col] = self._clean_numeric_column(normalized[col])
                else:
                    normalized[col] = pd.to_numeric(normalized[col], errors='coerce')
        
        # Essential columns for BigQuery rent roll table
        unit_ids = property_id + '_' + normalized['Unit'].astype(str)
        
        essential_columns = {
            'upload_id': upload_id,
            'property_id': property_id,
            'upload_date': date.today(),
            'data_month': data_month,
            'unit_id': unit_ids,
            'unit': normalized['Unit'],
            'bedroom': pd.to_numeric(normalized.get('Bedroom', 0), errors='coerce').fillna(0).astype(int),
            'bathrooms': pd.to_numeric(normalized.get('Bathrooms', 0), errors='coerce').fillna(0),
            'sqft': pd.to_numeric(normalized.get('Sqft', 0), errors='coerce').fillna(0),
            'current_rent': pd.to_numeric(normalized.get('Rent', 0), errors='coerce').fillna(0),
            'market_rent': pd.to_numeric(normalized.get('Market_Rent', 0), errors='coerce').fillna(0),
            'status': normalized.get('Status', 'UNKNOWN'),
            'occupancy_status': normalized['occupancy_status'],
            'property': normalized.get('Property', property_id)
        }
        
        # Create clean DataFrame with only essential columns
        normalized = pd.DataFrame(essential_columns)
        
        # Calculate derived metrics with safety checks (optional columns)
        if 'current_rent' in normalized.columns and 'sqft' in normalized.columns:
            # Ensure both columns are numeric and sqft is not zero
            current_rent = pd.to_numeric(normalized['current_rent'], errors='coerce')
            sqft = pd.to_numeric(normalized['sqft'], errors='coerce')
            # Only add if we want this in the schema later
            # normalized['current_rent_psf'] = current_rent / sqft.replace(0, np.nan)
        
        # Data quality score
        required_fields = ['unit_id', 'bedroom', 'sqft', 'property']
        normalized['data_quality_score'] = normalized[required_fields].notna().mean(axis=1)
        
        return normalized
    
    def normalize_competition_data(self, df: pd.DataFrame, property_id: str, upload_id: str, 
                                 data_month: date, column_mapping: Dict[str, str]) -> pd.DataFrame:
        """Normalize competition data for BigQuery storage with simplified schema."""
        
        # Essential columns for BigQuery competition table
        essential_columns = {
            'upload_id': upload_id,
            'property_id': property_id,
            'upload_date': date.today(),
            'data_month': data_month,
            'property_type': df.get('Property Type', pd.Series([''] * len(df))).astype(str),
            'reporting_property_name': df.get('Reporting Property Name', pd.Series([''] * len(df))).astype(str),
            'unit_vacate_date': df.get('Unit Vacate Date', pd.Series([''] * len(df))).astype(str),
            'bedrooms': df.get('Bedrooms', pd.Series([''] * len(df))).astype(str),
            'unit': df.get('Unit', pd.Series([''] * len(df))).astype(str),
            'advertised_market_diff': pd.to_numeric(df.get('Advertised - Market', pd.Series([0] * len(df))), errors='coerce').fillna(0).astype(int),
            'market_rent': pd.to_numeric(df.get('Market Rent', pd.Series([0] * len(df))), errors='coerce').fillna(0).astype(int),
            'market_rent_psf': pd.to_numeric(df.get('Market Rent PSF', pd.Series([0] * len(df))), errors='coerce').fillna(0),
            'advertised_rent': pd.to_numeric(df.get('Advertised Rent', pd.Series([0] * len(df))), errors='coerce').fillna(0).astype(int),
            'avg_sq_ft': pd.to_numeric(df.get('Avg. Sq. Ft.', pd.Series([0] * len(df))), errors='coerce').fillna(0).astype(int),
            'days_vacant': pd.to_numeric(df.get('Days Vacant', pd.Series([0] * len(df))), errors='coerce').fillna(0).astype(int)
        }
        
        # Create clean DataFrame with only essential columns
        normalized = pd.DataFrame(essential_columns)
        
        # Data quality score
        required_fields = ['reporting_property_name', 'bedrooms', 'market_rent']
        normalized['data_quality_score'] = normalized[required_fields].notna().mean(axis=1)
        
        return normalized
    
    def _clean_currency_column(self, series: pd.Series) -> pd.Series:
        """Clean currency values by removing $ and commas."""
        return pd.to_numeric(
            series.astype(str).str.replace(r'[$,"]', '', regex=True),
            errors='coerce'
        )
    
    def _clean_numeric_column(self, series: pd.Series) -> pd.Series:
        """Clean numeric values by removing commas and quotes."""
        return pd.to_numeric(
            series.astype(str).str.replace(r'[,"]', '', regex=True),
            errors='coerce'
        )
    
    def _normalize_bedroom_count(self, series: pd.Series) -> pd.Series:
        """Convert bedroom strings to normalized integer counts."""
        bedroom_mapping = {
            'S': 0, 'Studio': 0, 'STUDIO': 0,
            '1': 1, '1 Bed': 1, '1BR': 1,
            '2': 2, '2 Beds': 2, '2BR': 2,
            '3': 3, '3 Beds': 3, '3BR': 3,
            '4': 4, '4 Beds': 4, '4BR': 4, '4+': 4
        }
        
        return series.map(bedroom_mapping).fillna(-1).astype(int)


class UploadService:
    """Main upload processing service."""
    
    def __init__(self):
        """Initialize upload service."""
        self.bigquery_client = bigquery.Client(project=settings.gcp_project_id)
        self.storage_client = storage.Client(project=settings.gcp_project_id) if storage else None
        self.validator = DataValidator()
        self.normalizer = DataNormalizer()
        
        # BigQuery table references
        self.metadata_table = "rentroll-ai.uploads.upload_metadata"
        self.rent_roll_table = "rentroll-ai.uploads.rent_roll_history_simple"
        self.competition_table = "rentroll-ai.uploads.competition_history_simple"
        self.processing_log_table = "rentroll-ai.uploads.processing_log"
    
    async def process_upload(self, file_content: bytes, filename: str, file_type: str, 
                           property_id: str, data_month: str, user_id: str) -> Dict:
        """
        Main upload processing entry point.
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            file_type: 'rent_roll' or 'competition'
            property_id: Property identifier
            data_month: Data month in YYYY-MM format
            user_id: User who uploaded the file
        
        Returns:
            Processing result dictionary
        """
        upload_id = str(uuid.uuid4())
        
        try:
            # Log processing start
            await self._log_processing_step(upload_id, 'validation', 'started', 'Beginning file validation')
            
            # Parse CSV
            df = self._parse_csv(file_content)
            
            # Validate data
            if file_type == 'rent_roll':
                validation_result = self.validator.validate_rent_roll_schema(df)
            elif file_type == 'competition':
                validation_result = self.validator.validate_competition_schema(df)
            else:
                raise UploadValidationError(f"Invalid file type: {file_type}")
            
            # Create metadata record
            metadata = {
                'upload_id': upload_id,
                'property_id': property_id,
                'user_id': user_id,
                'file_type': file_type,
                'original_filename': filename,
                'upload_date': date.today(),
                'data_month': datetime.strptime(data_month + '-01', '%Y-%m-%d').date(),
                'row_count': len(df),
                'file_size_bytes': len(file_content),
                'validation_status': 'validated' if validation_result['valid'] else 'failed',
                'validation_errors': validation_result['errors'],
                'validation_warnings': validation_result.get('warnings', []),
                'processing_status': 'processing'
            }
            
            # Insert metadata
            await self._insert_metadata(metadata)
            
            if not validation_result['valid']:
                await self._log_processing_step(upload_id, 'validation', 'failed', 
                                              f"Validation failed: {'; '.join(validation_result['errors'])}")
                return {
                    'success': False,
                    'upload_id': upload_id,
                    'errors': validation_result['errors'],
                    'warnings': validation_result.get('warnings', [])
                }
            
            # Process and normalize data
            await self._log_processing_step(upload_id, 'normalization', 'started', 'Normalizing data')
            
            if file_type == 'rent_roll':
                normalized_df = self.normalizer.normalize_rent_roll_data(
                    df, property_id, upload_id, metadata['data_month']
                )
                await self._insert_rent_roll_data(normalized_df)
            
            elif file_type == 'competition':
                normalized_df = self.normalizer.normalize_competition_data(
                    df, property_id, upload_id, metadata['data_month'], 
                    validation_result.get('column_mapping', {})
                )
                await self._insert_competition_data(normalized_df)
            
            # Update processing status
            await self._update_metadata_status(upload_id, 'completed', None)
            await self._log_processing_step(upload_id, 'insertion', 'completed', 'Data successfully inserted')
            
            return {
                'success': True,
                'upload_id': upload_id,
                'row_count': len(df),
                'quality_score': validation_result['quality_score'],
                'warnings': validation_result.get('warnings', [])
            }
            
        except Exception as e:
            logger.error(f"Upload processing failed for {upload_id}: {e}")
            await self._update_metadata_status(upload_id, 'failed', str(e))
            await self._log_processing_step(upload_id, 'processing', 'failed', str(e))
            
            return {
                'success': False,
                'upload_id': upload_id,
                'errors': [str(e)],
                'warnings': []
            }
    
    def _parse_csv(self, file_content: bytes) -> pd.DataFrame:
        """Parse CSV file content."""
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    content_str = file_content.decode(encoding)
                    return pd.read_csv(StringIO(content_str))
                except UnicodeDecodeError:
                    continue
            
            raise UploadProcessingError("Unable to decode file with any supported encoding")
            
        except Exception as e:
            raise UploadProcessingError(f"Failed to parse CSV: {str(e)}")
    
    async def _insert_metadata(self, metadata: Dict) -> None:
        """Insert upload metadata into BigQuery."""
        try:
            table = self.bigquery_client.get_table(self.metadata_table)
            
            # Convert date objects to strings for BigQuery
            metadata_copy = metadata.copy()
            if isinstance(metadata_copy['upload_date'], date):
                metadata_copy['upload_date'] = metadata_copy['upload_date'].isoformat()
            if isinstance(metadata_copy['data_month'], date):
                metadata_copy['data_month'] = metadata_copy['data_month'].isoformat()
            
            # Convert arrays to JSON strings for BigQuery
            if 'validation_errors' in metadata_copy and isinstance(metadata_copy['validation_errors'], list):
                metadata_copy['validation_errors'] = json.dumps(metadata_copy['validation_errors'])
            if 'validation_warnings' in metadata_copy and isinstance(metadata_copy['validation_warnings'], list):
                metadata_copy['validation_warnings'] = json.dumps(metadata_copy['validation_warnings'])
            
            rows = [metadata_copy]
            errors = self.bigquery_client.insert_rows_json(table, rows)
            
            if errors:
                raise UploadProcessingError(f"Failed to insert metadata: {errors}")
                
        except Exception as e:
            logger.error(f"Error inserting metadata: {e}")
            raise
    
    async def _insert_rent_roll_data(self, df: pd.DataFrame) -> None:
        """Insert normalized rent roll data into BigQuery."""
        try:
            # Convert DataFrame to records and handle NaN values
            records = []
            for _, row in df.iterrows():
                record = serialize_for_json(row.to_dict())
                records.append(record)
            
            table = self.bigquery_client.get_table(self.rent_roll_table)
            errors = self.bigquery_client.insert_rows_json(table, records)
            
            if errors:
                raise UploadProcessingError(f"Failed to insert rent roll data: {errors}")
                
        except Exception as e:
            logger.error(f"Error inserting rent roll data: {e}")
            raise
    
    async def _insert_competition_data(self, df: pd.DataFrame) -> None:
        """Insert normalized competition data into BigQuery."""
        try:
            # Convert DataFrame to records and handle NaN values
            records = []
            for _, row in df.iterrows():
                record = serialize_for_json(row.to_dict())
                records.append(record)
            
            table = self.bigquery_client.get_table(self.competition_table)
            errors = self.bigquery_client.insert_rows_json(table, records)
            
            if errors:
                raise UploadProcessingError(f"Failed to insert competition data: {errors}")
                
        except Exception as e:
            logger.error(f"Error inserting competition data: {e}")
            raise
    
    async def _update_metadata_status(self, upload_id: str, status: str, error_message: Optional[str]) -> None:
        """Update processing status in metadata table."""
        try:
            query = f"""
            UPDATE `{self.metadata_table}`
            SET processing_status = @status,
                processing_error = @error_message,
                updated_at = CURRENT_TIMESTAMP()
            WHERE upload_id = @upload_id
            """
            
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("status", "STRING", status),
                    bigquery.ScalarQueryParameter("error_message", "STRING", error_message),
                    bigquery.ScalarQueryParameter("upload_id", "STRING", upload_id)
                ]
            )
            
            query_job = self.bigquery_client.query(query, job_config=job_config)
            query_job.result()  # Wait for completion
            
        except Exception as e:
            logger.error(f"Error updating metadata status: {e}")
    
    async def _log_processing_step(self, upload_id: str, step: str, status: str, message: str) -> None:
        """Log processing step to processing log table."""
        try:
            log_record = {
                'log_id': str(uuid.uuid4()),
                'upload_id': upload_id,
                'step': step,
                'status': status,
                'message': message,
                'created_at': datetime.utcnow().isoformat()
            }
            
            table = self.bigquery_client.get_table(self.processing_log_table)
            errors = self.bigquery_client.insert_rows_json(table, [log_record])
            
            if errors:
                logger.error(f"Failed to insert processing log: {errors}")
                
        except Exception as e:
            logger.error(f"Error logging processing step: {e}")
    
    async def get_upload_history(self, property_id: Optional[str] = None, 
                               file_type: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """Get upload history with filtering options."""
        try:
            where_conditions = []
            parameters = []
            
            if property_id:
                where_conditions.append("property_id = @property_id")
                parameters.append(bigquery.ScalarQueryParameter("property_id", "STRING", property_id))
            
            if file_type:
                where_conditions.append("file_type = @file_type")
                parameters.append(bigquery.ScalarQueryParameter("file_type", "STRING", file_type))
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            query = f"""
            SELECT *
            FROM `{self.metadata_table}`
            WHERE {where_clause}
            ORDER BY upload_date DESC, created_at DESC
            LIMIT @limit
            """
            
            parameters.append(bigquery.ScalarQueryParameter("limit", "INT64", limit))
            
            job_config = bigquery.QueryJobConfig(query_parameters=parameters)
            query_job = self.bigquery_client.query(query, job_config=job_config)
            
            results = []
            for row in query_job:
                results.append(dict(row))
            
            return results
            
        except Exception as e:
            logger.error(f"Error fetching upload history: {e}")
            raise


# Global upload service instance
upload_service = UploadService()
