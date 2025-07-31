-- BigQuery Setup Script for RentRoll AI Optimizer
-- Run this script to create all datasets, views, and tables

-- Create datasets if they don't exist
CREATE SCHEMA IF NOT EXISTS `rentroll-ai.staging`
OPTIONS(
  description="Staging views for normalized data from source tables",
  location="US"
);

CREATE SCHEMA IF NOT EXISTS `rentroll-ai.mart`  
OPTIONS(
  description="Data mart with feature-engineered tables and materialized views",
  location="US"
);

-- Grant appropriate permissions (adjust as needed for your service account)
-- GRANT `roles/bigquery.dataViewer` ON SCHEMA `rentroll-ai.staging` TO "serviceAccount:rentroll-ai-assistant@rentroll-ai.iam.gserviceaccount.com";
-- GRANT `roles/bigquery.dataEditor` ON SCHEMA `rentroll-ai.mart` TO "serviceAccount:rentroll-ai-assistant@rentroll-ai.iam.gserviceaccount.com";

-- Step 1: Create staging views
-- staging.our_units
CREATE OR REPLACE VIEW `rentroll-ai.staging.our_units` AS
SELECT
    Unit              AS unit_id,
    Property          AS property,
    Bedroom           AS bed,
    Bathrooms         AS bath,
    Sqft              AS sqft,
    Advertised_Rent   AS advertised_rent,
    Market_Rent       AS market_rent,
    Status            AS status,             -- OCCUPIED / VACANT
    Move_out          AS move_out_date,
    Lease_To          AS lease_end_date,
    -- Additional computed fields
    CASE 
        WHEN Status = 'VACANT' THEN TRUE
        WHEN Status = 'OCCUPIED' AND DATE_DIFF(Lease_To, CURRENT_DATE(), DAY) <= 60 THEN TRUE
        ELSE FALSE
    END AS needs_pricing,
    CASE 
        WHEN Sqft > 0 THEN Advertised_Rent / Sqft
        ELSE NULL
    END AS rent_per_sqft,
    DATE_DIFF(Lease_To, CURRENT_DATE(), DAY) AS days_to_lease_end
FROM `rentroll-ai.rentroll.Update_7_8_native`
WHERE Unit IS NOT NULL
    AND Property IS NOT NULL
    AND Bedroom IS NOT NULL
    AND Bathrooms IS NOT NULL
    AND Sqft IS NOT NULL
    AND Sqft > 0;

-- staging.comps
CREATE OR REPLACE VIEW `rentroll-ai.staging.comps` AS
SELECT
    CONCAT(Property,'_',Unit) AS comp_id,
    Property                  AS property,
    CAST(Bed   AS INT64)      AS bed,
    CAST(Bath  AS INT64)      AS bath,
    Sq_Ft                     AS sqft,
    Base_Price                AS comp_price,
    Availability              AS availability,
    -- Additional computed fields
    CASE 
        WHEN Sq_Ft > 0 THEN Base_Price / Sq_Ft
        ELSE NULL
    END AS comp_price_per_sqft,
    CASE 
        WHEN UPPER(Availability) IN ('AVAILABLE', 'VACANT') THEN TRUE
        ELSE FALSE
    END AS is_available
FROM `rentroll-ai.rentroll.Competition`
WHERE Property IS NOT NULL
    AND Unit IS NOT NULL
    AND Bed IS NOT NULL
    AND Bath IS NOT NULL
    AND Sq_Ft IS NOT NULL
    AND Sq_Ft > 0
    AND Base_Price IS NOT NULL
    AND Base_Price > 0;

-- Step 2: Create mart views
-- mart.unit_snapshot  
CREATE OR REPLACE VIEW `rentroll-ai.mart.unit_snapshot` AS
SELECT
    u.*,
    -- Market positioning metrics
    CASE 
        WHEN u.market_rent > 0 THEN (u.advertised_rent - u.market_rent) / u.market_rent * 100
        ELSE NULL
    END AS rent_premium_pct,
    
    -- Urgency metrics
    CASE 
        WHEN u.status = 'VACANT' THEN 'IMMEDIATE'
        WHEN u.days_to_lease_end <= 30 THEN 'HIGH'
        WHEN u.days_to_lease_end <= 60 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS pricing_urgency,
    
    -- Unit characteristics
    CASE 
        WHEN u.bed = 0 THEN 'STUDIO'
        WHEN u.bed = 1 THEN '1BR'
        WHEN u.bed = 2 THEN '2BR'
        WHEN u.bed = 3 THEN '3BR'
        WHEN u.bed >= 4 THEN '4BR+'
        ELSE 'UNKNOWN'
    END AS unit_type,
    
    -- Size categories
    CASE 
        WHEN u.sqft < 500 THEN 'MICRO'
        WHEN u.sqft < 750 THEN 'SMALL'
        WHEN u.sqft < 1000 THEN 'MEDIUM'
        WHEN u.sqft < 1500 THEN 'LARGE'
        ELSE 'XLARGE'
    END AS size_category,
    
    -- Revenue potential
    u.advertised_rent * 12 AS annual_revenue_potential,
    
    -- Market competitiveness score
    CASE 
        WHEN u.rent_per_sqft IS NULL THEN NULL
        WHEN u.rent_per_sqft < 1.5 THEN 'LOW'
        WHEN u.rent_per_sqft < 2.5 THEN 'MEDIUM'
        ELSE 'HIGH'
    END AS rent_intensity,
    
    -- Data quality indicators
    CASE 
        WHEN u.advertised_rent IS NULL OR u.sqft IS NULL OR u.bed IS NULL THEN FALSE
        ELSE TRUE
    END AS has_complete_data,
    
    CURRENT_TIMESTAMP() AS snapshot_timestamp
FROM `rentroll-ai.staging.our_units` u;

-- Step 3: Create materialized competitor pairs table
-- This will be refreshed nightly via scheduled query
-- Initial population with current data
CREATE OR REPLACE TABLE `rentroll-ai.mart.unit_competitor_pairs` 
CLUSTER BY (unit_id, bed, bath)
AS
WITH unit_comps AS (
  SELECT
      u.unit_id,
      u.property AS our_property,
      u.bed,
      u.bath,
      u.sqft AS our_sqft,
      u.advertised_rent,
      u.market_rent,
      u.status,
      u.needs_pricing,
      c.comp_id,
      c.property AS comp_property,
      c.sqft AS comp_sqft,
      c.comp_price,
      c.is_available,
      -- Similarity metrics
      ABS(u.sqft - c.sqft) / u.sqft AS sqft_delta_pct,
      ABS(u.bed - c.bed) AS bed_delta,
      ABS(u.bath - c.bath) AS bath_delta,
      -- Price comparisons
      CASE 
          WHEN u.advertised_rent > 0 THEN (c.comp_price - u.advertised_rent) / u.advertised_rent * 100
          ELSE NULL
      END AS price_gap_pct,
      -- Distance calculation (placeholder)
      0.0 AS distance_miles,
      -- Similarity score (weighted)
      (
          CASE WHEN ABS(u.sqft - c.sqft) / u.sqft <= 0.15 THEN 40 ELSE 0 END +
          CASE WHEN u.bed = c.bed THEN 30 ELSE 0 END +
          CASE WHEN u.bath = c.bath THEN 20 ELSE 0 END +
          CASE WHEN u.property != c.property THEN 10 ELSE 0 END
      ) AS similarity_score
  FROM `rentroll-ai.staging.our_units` u
  JOIN `rentroll-ai.staging.comps` c
  ON u.bed = c.bed
  AND u.bath = c.bath
  AND ABS(u.sqft - c.sqft) / u.sqft <= 0.15
),
ranked_comps AS (
  SELECT 
      *,
      ROW_NUMBER() OVER (
          PARTITION BY unit_id 
          ORDER BY similarity_score DESC, 
                   sqft_delta_pct ASC,
                   ABS(price_gap_pct) ASC
      ) AS comp_rank
  FROM unit_comps
  WHERE similarity_score >= 50
)
SELECT 
    unit_id,
    our_property,
    bed,
    bath,
    our_sqft,
    advertised_rent,
    market_rent,
    status,
    needs_pricing,
    comp_id,
    comp_property,
    comp_sqft,
    comp_price,
    is_available,
    sqft_delta_pct,
    price_gap_pct,
    similarity_score,
    comp_rank,
    -- Summary statistics
    COUNT(*) OVER (PARTITION BY unit_id) AS total_comps,
    AVG(comp_price) OVER (PARTITION BY unit_id) AS avg_comp_price,
    PERCENTILE_CONT(comp_price, 0.5) OVER (PARTITION BY unit_id) AS median_comp_price,
    MIN(comp_price) OVER (PARTITION BY unit_id) AS min_comp_price,
    MAX(comp_price) OVER (PARTITION BY unit_id) AS max_comp_price,
    STDDEV(comp_price) OVER (PARTITION BY unit_id) AS comp_price_stddev,
    CURRENT_TIMESTAMP() AS created_at
FROM ranked_comps
WHERE comp_rank <= 10; 