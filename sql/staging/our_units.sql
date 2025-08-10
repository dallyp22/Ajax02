-- View: staging.our_units
-- Normalizes schema from rentroll-ai.rentroll.Update_7_8_native table
CREATE OR REPLACE VIEW `rentroll-ai.staging.our_units` AS
SELECT
    CONCAT(Property, '_', Unit) AS unit_id,  -- Make unit_id unique across properties
    Unit              AS unit_number,        -- Keep original unit number
    Property          AS property,
    Bedroom           AS bed,
    Bathrooms         AS bath,
    Sqft              AS sqft,
    Advertised_Rent   AS advertised_rent,
    Market_Rent       AS market_rent,
    CASE 
        WHEN Status = 'Current' THEN 'OCCUPIED'
        WHEN Status LIKE 'Notice-%' THEN 'NOTICE'
        WHEN Status LIKE 'Vacant-%' THEN 'VACANT'
        WHEN Status = 'Evict' THEN 'VACANT'
        ELSE 'VACANT'
    END AS status,
    Status AS raw_status,  -- Keep original for debugging
    FORMAT_DATE('%Y-%m-%d', Move_out) AS move_out_date,
    FORMAT_DATE('%Y-%m-%d', Lease_To) AS lease_end_date,
    -- Additional computed fields
    CASE 
        WHEN Status LIKE 'Vacant-%' OR Status = 'Evict' THEN TRUE
        WHEN Status = 'Current' AND DATE_DIFF(Lease_To, CURRENT_DATE(), DAY) <= 60 THEN TRUE
        WHEN Status LIKE 'Notice-%' THEN TRUE
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