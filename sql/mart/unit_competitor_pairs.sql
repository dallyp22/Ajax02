-- Table: mart.unit_competitor_pairs
-- Materialized table pairing our units with similar competitor units
-- This should be refreshed nightly via scheduled query

CREATE OR REPLACE TABLE `rentroll-ai.mart.unit_competitor_pairs` 
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
      -- Distance calculation (placeholder - would need geocoding)
      0.0 AS distance_miles,
      -- Similarity score (weighted)
      (
          CASE WHEN ABS(u.sqft - c.sqft) / u.sqft <= 0.15 THEN 40 ELSE 0 END +
          CASE WHEN u.bed = c.bed THEN 30 ELSE 0 END +
          CASE WHEN u.bath = c.bath THEN 20 ELSE 0 END +
          CASE WHEN u.property != c.property THEN 10 ELSE 0 END  -- Different property bonus
      ) AS similarity_score
  FROM `rentroll-ai.staging.our_units` u
  JOIN `rentroll-ai.staging.comps` c
  ON u.bed = c.bed  -- Exact bed match required
  AND u.bath = CAST(c.bath AS INT64)  -- Convert comp bath to integer for matching
  AND ABS(u.sqft - c.sqft) / u.sqft <= 0.15  -- Within 15% sqft
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
  WHERE similarity_score >= 50  -- Minimum similarity threshold
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
    -- Summary statistics for the unit's comp set
    COUNT(*) OVER (PARTITION BY unit_id) AS total_comps,
    AVG(comp_price) OVER (PARTITION BY unit_id) AS avg_comp_price,
    PERCENTILE_CONT(comp_price, 0.5) OVER (PARTITION BY unit_id) AS median_comp_price,
    MIN(comp_price) OVER (PARTITION BY unit_id) AS min_comp_price,
    MAX(comp_price) OVER (PARTITION BY unit_id) AS max_comp_price,
    STDDEV(comp_price) OVER (PARTITION BY unit_id) AS comp_price_stddev,
    CURRENT_TIMESTAMP() AS created_at
FROM ranked_comps
WHERE comp_rank <= 10;  -- Keep top 10 comps per unit

-- Add indexes for query performance
-- These would be created separately in production
/*
CREATE INDEX idx_unit_competitor_pairs_unit_id
ON `rentroll-ai.mart.unit_competitor_pairs` (unit_id);

CREATE INDEX idx_unit_competitor_pairs_needs_pricing  
ON `rentroll-ai.mart.unit_competitor_pairs` (needs_pricing);

CREATE INDEX idx_unit_competitor_pairs_property
ON `rentroll-ai.mart.unit_competitor_pairs` (our_property);
*/ 