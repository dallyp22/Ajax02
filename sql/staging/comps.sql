-- View: staging.comps
-- Normalizes schema from rentroll-ai.rentroll.Competition table
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