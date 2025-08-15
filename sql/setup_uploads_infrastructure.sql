-- BigQuery Upload Infrastructure Setup
-- Run this script to create all upload-related datasets and tables

-- ============================================================================
-- Create Upload Datasets
-- ============================================================================

-- Create uploads dataset for raw and processed upload data
CREATE SCHEMA IF NOT EXISTS `rentroll-ai.uploads`
OPTIONS(
  description="Monthly data uploads and historical tracking",
  location="US"
);

-- Create analytics dataset for historical trend analysis  
CREATE SCHEMA IF NOT EXISTS `rentroll-ai.analytics`
OPTIONS(
  description="Historical analytics and trend analysis views",
  location="US"
);

-- ============================================================================
-- Upload Metadata Tracking Table
-- ============================================================================

CREATE OR REPLACE TABLE `rentroll-ai.uploads.upload_metadata` (
    upload_id STRING NOT NULL,
    property_id STRING NOT NULL,
    user_id STRING,
    file_type STRING NOT NULL, -- 'rent_roll' or 'competition'
    original_filename STRING NOT NULL,
    upload_date DATE NOT NULL,
    data_month DATE NOT NULL, -- The month this data represents (YYYY-MM-01)
    row_count INT64,
    file_size_bytes INT64,
    gcs_path STRING, -- Google Cloud Storage path
    validation_status STRING DEFAULT 'pending', -- 'pending', 'validated', 'failed'
    validation_errors ARRAY<STRING>,
    validation_warnings ARRAY<STRING>,
    processing_status STRING DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'failed'
    processing_error STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY upload_date
CLUSTER BY property_id, file_type, data_month
OPTIONS(
  description="Tracks all file uploads with metadata and processing status"
);

-- ============================================================================
-- Historical Rent Roll Data Table
-- ============================================================================

CREATE OR REPLACE TABLE `rentroll-ai.uploads.rent_roll_history` (
    -- Upload tracking
    upload_id STRING NOT NULL,
    property_id STRING NOT NULL,
    upload_date DATE NOT NULL,
    data_month DATE NOT NULL,
    
    -- Core unit identification
    unit_id STRING NOT NULL, -- Normalized: property_id + unit
    unit STRING NOT NULL, -- Original unit identifier from file
    property STRING NOT NULL, -- Property name from file
    
    -- Unit characteristics
    bedroom INT64,
    bathrooms FLOAT64,
    sqft INT64,
    unit_type STRING, -- From file or derived
    tags STRING, -- Unit tags/categories
    bd_ba STRING, -- Bedroom/bathroom string format
    
    -- Financial data
    market_rent FLOAT64,
    current_rent FLOAT64, -- "Rent" column
    advertised_rent FLOAT64,
    previous_rent FLOAT64,
    deposit FLOAT64,
    past_due FLOAT64,
    
    -- Rent metrics (calculated)
    market_rent_psf FLOAT64,
    current_rent_psf FLOAT64,
    rent_premium_pct FLOAT64, -- (current_rent - market_rent) / market_rent * 100
    
    -- Occupancy and status
    status STRING, -- Current, Vacant, Notice, etc.
    tenant_name STRING,
    occupancy_status STRING, -- Normalized: OCCUPIED, VACANT, NOTICE
    rent_ready BOOLEAN,
    rent_status STRING,
    
    -- Lease information
    lease_from DATE,
    lease_to DATE,
    move_in DATE,
    move_out DATE,
    last_move_out DATE,
    days_vacant INT64, -- Calculated if vacant
    days_to_lease_end INT64, -- Calculated
    
    -- Rent increase tracking
    last_rent_increase_date DATE,
    next_rent_increase_date DATE,
    next_rent_increase_amount FLOAT64,
    
    -- Payment history
    nsf_count INT64,
    late_count INT64,
    
    -- Data quality and timestamps
    data_quality_score FLOAT64, -- 0-1 score based on completeness
    has_complete_data BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY data_month
CLUSTER BY property_id, upload_date, occupancy_status
OPTIONS(
  description="Historical rent roll data with full lineage and calculated metrics"
);

-- ============================================================================
-- Historical Competition Data Table  
-- ============================================================================

CREATE OR REPLACE TABLE `rentroll-ai.uploads.competition_history` (
    -- Upload tracking
    upload_id STRING NOT NULL,
    property_id STRING NOT NULL,
    upload_date DATE NOT NULL,
    data_month DATE NOT NULL,
    
    -- Competitor identification
    comp_id STRING NOT NULL, -- Generated unique ID
    competitor_property STRING NOT NULL,
    competitor_type STRING, -- Competition, etc.
    reporting_property_name STRING,
    
    -- Unit details
    unit STRING,
    bedrooms STRING, -- Often "S", "1", "2", etc.
    bedrooms_normalized INT64, -- Converted to number (Studio=0)
    
    -- Rent and pricing
    market_rent FLOAT64,
    market_rent_psf FLOAT64,
    advertised_rent FLOAT64,
    advertised_market_flag STRING, -- "Advertised - Market" column
    
    -- Unit characteristics
    avg_sq_ft FLOAT64,
    
    -- Availability
    unit_vacate_date STRING, -- Often "Now", dates, etc.
    unit_vacate_date_parsed DATE, -- Parsed date when possible
    days_vacant INT64,
    is_available BOOLEAN, -- Derived from vacate date
    availability_status STRING, -- NOW, FUTURE, UNKNOWN
    
    -- Calculated competitive metrics
    rent_competitiveness_score FLOAT64,
    
    -- Data quality
    data_quality_score FLOAT64,
    has_complete_data BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY data_month  
CLUSTER BY property_id, upload_date, competitor_property
OPTIONS(
  description="Historical competition data with normalized fields and competitive analysis"
);

-- ============================================================================
-- Upload Processing Log Table
-- ============================================================================

CREATE OR REPLACE TABLE `rentroll-ai.uploads.processing_log` (
    log_id STRING NOT NULL,
    upload_id STRING NOT NULL,
    step STRING NOT NULL, -- 'validation', 'parsing', 'normalization', 'insertion'
    status STRING NOT NULL, -- 'started', 'completed', 'failed'
    message STRING,
    details JSON, -- Additional processing details
    duration_seconds FLOAT64,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY upload_id, step
OPTIONS(
  description="Detailed processing log for troubleshooting and monitoring"
);

-- ============================================================================
-- Grant Permissions (Adjust service account as needed)
-- ============================================================================

-- Grant permissions to the service account
-- GRANT `roles/bigquery.dataEditor` ON SCHEMA `rentroll-ai.uploads` TO "serviceAccount:rentroll-ai-assistant@rentroll-ai.iam.gserviceaccount.com";
-- GRANT `roles/bigquery.dataEditor` ON SCHEMA `rentroll-ai.analytics` TO "serviceAccount:rentroll-ai-assistant@rentroll-ai.iam.gserviceaccount.com";

-- ============================================================================
-- Initial Analytics Views
-- ============================================================================

-- Monthly Portfolio Summary View
CREATE OR REPLACE VIEW `rentroll-ai.analytics.monthly_portfolio_summary` AS
WITH monthly_metrics AS (
  SELECT 
    property_id,
    property,
    data_month,
    upload_date,
    
    -- Unit counts
    COUNT(*) as total_units,
    COUNT(CASE WHEN occupancy_status = 'OCCUPIED' THEN 1 END) as occupied_units,
    COUNT(CASE WHEN occupancy_status = 'VACANT' THEN 1 END) as vacant_units,
    COUNT(CASE WHEN occupancy_status = 'NOTICE' THEN 1 END) as notice_units,
    
    -- Financial metrics
    AVG(current_rent) as avg_current_rent,
    AVG(market_rent) as avg_market_rent,
    AVG(advertised_rent) as avg_advertised_rent,
    AVG(current_rent_psf) as avg_rent_psf,
    
    -- Revenue calculations
    SUM(CASE WHEN occupancy_status = 'OCCUPIED' THEN current_rent ELSE 0 END) as monthly_revenue,
    SUM(CASE WHEN occupancy_status = 'VACANT' THEN advertised_rent ELSE 0 END) as potential_monthly_revenue,
    
    -- Market positioning
    AVG(rent_premium_pct) as avg_rent_premium_pct,
    COUNT(CASE WHEN rent_premium_pct > 10 THEN 1 END) as premium_units,
    COUNT(CASE WHEN rent_premium_pct < -10 THEN 1 END) as discount_units,
    
    -- Vacancy metrics
    AVG(CASE WHEN occupancy_status = 'VACANT' THEN days_vacant END) as avg_days_vacant,
    COUNT(CASE WHEN days_vacant > 30 THEN 1 END) as units_vacant_30plus
    
  FROM `rentroll-ai.uploads.rent_roll_history`
  WHERE has_complete_data = TRUE
  GROUP BY property_id, property, data_month, upload_date
)
SELECT 
  *,
  -- Calculate occupancy rate
  ROUND(occupied_units * 100.0 / total_units, 1) as occupancy_rate,
  
  -- Calculate economic occupancy (including notice)
  ROUND((occupied_units + notice_units) * 100.0 / total_units, 1) as economic_occupancy_rate,
  
  -- Annual revenue projection
  monthly_revenue * 12 as projected_annual_revenue,
  (potential_monthly_revenue - monthly_revenue) * 12 as annual_revenue_opportunity,
  
  -- Previous month comparison placeholders (to be enhanced)
  CAST(NULL AS FLOAT64) as mom_rent_change_pct,
  CAST(NULL AS FLOAT64) as mom_occupancy_change_pts
  
FROM monthly_metrics
ORDER BY property_id, data_month DESC;

-- Competition Benchmark View
CREATE OR REPLACE VIEW `rentroll-ai.analytics.competition_benchmarks` AS
SELECT 
  property_id,
  data_month,
  upload_date,
  
  -- Competitor summary
  COUNT(DISTINCT competitor_property) as competitor_count,
  COUNT(*) as total_comp_units,
  COUNT(CASE WHEN is_available THEN 1 END) as available_comp_units,
  
  -- Rent benchmarks by bedroom
  bedrooms_normalized,
  COUNT(*) as comp_units_this_bed_count,
  AVG(market_rent) as avg_comp_rent,
  PERCENTILE_CONT(market_rent, 0.5) OVER (PARTITION BY property_id, data_month, bedrooms_normalized) as median_comp_rent,
  MIN(market_rent) as min_comp_rent,
  MAX(market_rent) as max_comp_rent,
  AVG(market_rent_psf) as avg_comp_rent_psf,
  
  -- Availability metrics
  AVG(CASE WHEN is_available THEN days_vacant END) as avg_comp_days_vacant,
  COUNT(CASE WHEN availability_status = 'NOW' THEN 1 END) as immediate_availability_count
  
FROM `rentroll-ai.uploads.competition_history`
WHERE has_complete_data = TRUE
  AND market_rent > 0
GROUP BY property_id, data_month, upload_date, bedrooms_normalized
ORDER BY property_id, data_month DESC, bedrooms_normalized;

-- Data Quality Summary View
CREATE OR REPLACE VIEW `rentroll-ai.analytics.data_quality_summary` AS
SELECT 
  upload_id,
  property_id,
  file_type,
  data_month,
  upload_date,
  original_filename,
  row_count,
  validation_status,
  processing_status,
  
  -- Error summary
  ARRAY_LENGTH(validation_errors) as error_count,
  ARRAY_LENGTH(validation_warnings) as warning_count,
  
  -- Quality metrics
  CASE 
    WHEN file_type = 'rent_roll' THEN (
      SELECT AVG(data_quality_score) 
      FROM `rentroll-ai.uploads.rent_roll_history` r 
      WHERE r.upload_id = m.upload_id
    )
    WHEN file_type = 'competition' THEN (
      SELECT AVG(data_quality_score)
      FROM `rentroll-ai.uploads.competition_history` c
      WHERE c.upload_id = m.upload_id  
    )
  END as avg_data_quality_score,
  
  created_at,
  updated_at
  
FROM `rentroll-ai.uploads.upload_metadata` m
ORDER BY upload_date DESC, created_at DESC;

-- ============================================================================
-- Success Message
-- ============================================================================

SELECT 'BigQuery upload infrastructure created successfully!' as status,
       'Ready to accept rent roll and competition data uploads' as message,
       CURRENT_TIMESTAMP() as created_at;
