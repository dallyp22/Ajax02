-- View: staging.comps
-- Normalizes schema from rentroll-ai.rentroll.Competition table
CREATE OR REPLACE VIEW `rentroll-ai.staging.comps` AS
SELECT
    CONCAT(Property,'_',Unit) AS comp_id,
    Property                  AS property,
    CAST(REGEXP_EXTRACT(TRIM(Bed), r'^(\d+)') AS INT64)      AS bed,    -- Extract number from "1 Bed", "2 Beds"
    CAST(REGEXP_EXTRACT(TRIM(Bath), r'^(\d+(?:\.\d+)?)') AS FLOAT64)     AS bath,   -- Extract number from "1 Bath", "2.5 Baths"
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
    AND Base_Price > 0
    AND REGEXP_EXTRACT(TRIM(Bed), r'^(\d+)') IS NOT NULL     -- Ensure we can extract a number
    AND REGEXP_EXTRACT(TRIM(Bath), r'^(\d+(?:\.\d+)?)') IS NOT NULL;   -- Ensure we can extract a number 