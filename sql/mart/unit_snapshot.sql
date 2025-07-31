-- View: mart.unit_snapshot
-- Feature engineering view with enriched unit data
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
    
    -- Market competitiveness score (to be enhanced with competitor data)
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