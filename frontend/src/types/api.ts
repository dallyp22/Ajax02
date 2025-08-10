// API Types for RentRoll AI Optimizer Frontend

export enum UnitStatus {
  OCCUPIED = 'OCCUPIED',
  VACANT = 'VACANT',
  NOTICE = 'NOTICE',
}

export enum PricingUrgency {
  IMMEDIATE = 'IMMEDIATE',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum OptimizationStrategy {
  REVENUE = 'revenue',
  LEASE_UP = 'lease_up',
  BALANCED = 'balanced',
}

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BR = '1BR',
  TWO_BR = '2BR',
  THREE_BR = '3BR',
  FOUR_BR_PLUS = '4BR+',
}

export enum SizeCategory {
  MICRO = 'MICRO',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  XLARGE = 'XLARGE',
}

// Request Types
export interface OptimizeRequest {
  strategy: OptimizationStrategy;
  weight?: number;
  custom_elasticity?: number;
  excluded_comp_ids?: string[];
}

export interface BatchOptimizeRequest {
  unit_ids?: string[];
  strategy: OptimizationStrategy;
  weight?: number;
  custom_elasticity?: number;
  max_units?: number;
}

// Response Types
export interface UnitBase {
  unit_id: string;
  property: string;
  bed: number;
  bath: number;
  sqft: number;
  status: UnitStatus;
  advertised_rent: number;
  market_rent?: number;
  rent_per_sqft?: number;
}

export interface Unit extends UnitBase {
  move_out_date?: string;
  lease_end_date?: string;
  days_to_lease_end?: number;
  needs_pricing: boolean;
  rent_premium_pct?: number;
  pricing_urgency: PricingUrgency;
  unit_type: UnitType;
  size_category: SizeCategory;
  annual_revenue_potential: number;
  has_complete_data: boolean;
}

export interface Comparable {
  comp_id: string;
  comp_property: string;
  bed: number;
  bath: number;
  comp_sqft: number;
  comp_price: number;
  is_available: boolean;
  sqft_delta_pct: number;
  price_gap_pct?: number;
  similarity_score: number;
  comp_rank: number;
}

export interface ComparablesResponse {
  unit_id: string;
  unit: UnitBase;
  comparables: Comparable[];
  total_comps: number;
  avg_comp_price: number;
  median_comp_price: number;
  min_comp_price: number;
  max_comp_price: number;
  comp_price_stddev?: number;
}

export interface OptimizationResult {
  unit_id: string;
  current_rent: number;
  suggested_rent: number;
  rent_change: number;
  rent_change_pct: number;
  confidence?: number;
  strategy_used: OptimizationStrategy;
  demand_probability?: number;
  expected_days_to_lease?: number;
  revenue_impact_annual: number;
  comp_data: {
    total_comps?: number;
    avg_comp_price?: number;
    median_comp_price?: number;
    min_comp_price?: number;
    max_comp_price?: number;
    avg_similarity_score?: number;
  };
}

export interface OptimizeResponse {
  unit_id: string;
  optimization: OptimizationResult;
  generated_at: string;
}

export interface BatchOptimizeResponse {
  total_units_processed: number;
  successful_optimizations: number;
  failed_optimizations: number;
  results: OptimizationResult[];
  generated_at: string;
}

export interface UnitsListResponse {
  units: Unit[];
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  bigquery_connected: boolean;
  services: Record<string, string>;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  timestamp: string;
}

// Query Parameters
export interface UnitsQueryParams {
  page?: number;
  page_size?: number;
  status?: UnitStatus;
  property?: string;
  needs_pricing_only?: boolean;
}

// UI-specific types
export interface UnitGridRow extends Unit {
  id: string; // For DataGrid
}

export interface OptimizationModalProps {
  unit: Unit | null;
  open: boolean;
  onClose: () => void;
  onOptimize: (result: OptimizationResult) => void;
}

export interface ComparisonChartData {
  name: string;
  current: number;
  suggested: number;
  competitor_avg: number;
}

// Settings types
export interface TableSettings {
  rentroll_table: string;
  competition_table: string;
  archive_table: string;
  project_id: string;
}

export interface TestResult {
  success: boolean;
  row_count?: number;
  error?: string;
}

export interface ConnectionTestResponse {
  rentroll_table: TestResult;
  competition_table: TestResult;
  archive_table: TestResult;
}

// Analytics types
export interface PortfolioAnalytics {
  portfolio: {
    total_units: number;
    vacant_units: number;
    occupied_units: number;
    notice_units: number;
    units_needing_pricing: number;
    total_revenue_potential: number;
    current_annual_revenue: number;
    avg_rent_per_sqft: number;
    avg_occupied_rent: number;
    avg_vacant_rent: number;
    occupancy_rate: number;
    revenue_optimization_potential: number;
  };
  urgency_breakdown: Array<{
    pricing_urgency: string;
    unit_count: number;
  }>;
  property_performance: Array<{
    property: string;
    total_units: number;
    vacant_units: number;
    avg_rent: number;
    avg_rent_per_sqft: number;
    revenue_potential: number;
  }>;
}

export interface MarketPositionAnalytics {
  market_summary: Array<{
    market_position: string;
    unit_count: number;
    avg_premium_discount: number;
    avg_rent: number;
  }>;
  unit_type_comparison: Array<{
    unit_type: string;
    total_units: number;
    our_avg_rent_per_sqft: number;
    market_avg_rent_per_sqft: number;
  }>;
}

export interface PricingOpportunities {
  summary: {
    units_with_50plus_opportunity: number;
    units_with_100plus_opportunity: number;
    total_monthly_opportunity: number;
    total_annual_opportunity: number;
    avg_opportunity_per_unit: number;
  };
  top_opportunities: Array<{
    unit_id: string;
    property: string;
    unit_type: string;
    status: string;
    advertised_rent: number;
    pricing_urgency: string;
    days_to_lease_end?: number;
    avg_comp_price: number;
    potential_rent_increase: number;
    annual_revenue_opportunity: number;
  }>;
}

// Property-specific analytics types
export interface PropertyListResponse {
  properties: string[];
}

export interface PropertyVsCompetitionAnalysis {
  property_name: string;
  overview_by_unit_type: Array<{
    unit_type: string;
    unit_count: number;
    avg_our_rent: number;
    avg_our_rent_per_sqft: number;
    avg_market_rent: number;
    avg_market_rent_per_sqft: number;
    vacant_units: number;
    units_needing_pricing: number;
    revenue_potential: number;
    avg_premium_discount_pct: number;
  }>;
  rent_comparison_by_bedrooms: Array<{
    bed: number;
    unit_count: number;
    avg_our_rent: number;
    min_our_rent: number;
    max_our_rent: number;
    avg_our_rent_per_sqft: number;
    avg_market_rent: number;
    min_market_rent: number;
    max_market_rent: number;
    avg_market_rent_per_sqft: number;
    comp_count: number;
    rent_gap_pct: number;
  }>;
  performance_metrics: {
    total_units: number;
    vacant_units: number;
    occupied_units: number;
    notice_units: number;
    units_needing_pricing: number;
    avg_rent: number;
    avg_rent_per_sqft: number;
    total_revenue_potential: number;
    current_annual_revenue: number;
    occupancy_rate: number;
    revenue_opportunity: number;
  };
}

export interface PropertyUnitAnalysis {
  property_name: string;
  units: Array<{
    unit_id: string;
    unit_type: string;
    bed: number;
    bath: number;
    sqft: number;
    status: string;
    advertised_rent: number;
    rent_per_sqft: number;
    needs_pricing: boolean;
    pricing_urgency: string;
    annual_revenue_potential: number;
    move_out_date?: string;
    lease_end_date?: string;
    days_to_lease_end?: number;
    comparable_count: number;
    avg_comp_rent: number;
    min_comp_rent: number;
    max_comp_rent: number;
    avg_similarity_score: number;
    available_comps: number;
    rent_premium_pct: number;
    potential_rent_increase: number;
    annual_opportunity: number;
    market_position: string;
  }>;
  summary: {
    total_units_analyzed: number;
    units_50plus_below_market: number;
    units_100plus_below_market: number;
    total_monthly_opportunity: number;
    total_annual_opportunity: number;
    avg_rent_gap: number;
  };
}

export interface PropertyMarketTrends {
  property_name: string;
  market_positioning: Array<{
    unit_type: string;
    bed: number;
    our_unit_count: number;
    our_avg_rent: number;
    our_avg_rent_per_sqft: number;
    market_avg_rent: number;
    market_avg_rent_per_sqft: number;
    competitor_property_count: number;
    total_competitor_units: number;
    rent_premium_pct: number;
    rent_per_sqft_premium_pct: number;
  }>;
  top_competitors: Array<{
    competitor_property: string;
    our_units_compared: number;
    their_comparable_units: number;
    their_avg_rent: number;
    their_avg_rent_per_sqft: number;
    avg_similarity_score: number;
    their_available_units: number;
  }>;
  rent_distribution: Array<{
    rent_range: string;
    unit_type: string;
    unit_count: number;
  }>;
}

// SvSN Analytics Types for NuStyle vs Competition Analysis
export interface SvSNBenchmarkData {
  Property_Type: string;
  Reporting_Property_Name: string;
  Bedrooms: string;
  unit_count: number;
  avg_market_rent: number;
  avg_market_rent_psf: number;
  avg_sq_ft: number;
}

export interface SvSNBenchmarkResponse {
  benchmark_data: SvSNBenchmarkData[];
  bedroom_type: string;
}

export interface SvSNVacancyData {
  Property_Type: string;
  Reporting_Property_Name: string;
  Bedrooms: string;
  total_units: number;
  avg_days_vacant: number;
  units_vacant_30plus: number;
  pct_vacant_30plus: number;
}

export interface SvSNVacancyResponse {
  vacancy_data: SvSNVacancyData[];
  bedroom_type: string;
}

export interface SvSNRentSpreadData {
  Reporting_Property_Name: string;
  Unit: string;
  Bedrooms: string;
  Market_Rent: number;
  Advertised_Rent: number;
  Days_Vacant: number;
  pct_below_market: number;
  opportunity_level: string;
  suggested_action: string;
}

export interface SvSNRentSpreadSummary {
  total_units: number;
  high_opportunity_units: number;
  moderate_opportunity_units: number;
  total_monthly_potential: number;
  total_annual_potential: number;
}

export interface SvSNRentSpreadResponse {
  rent_spread_data: SvSNRentSpreadData[];
  summary: SvSNRentSpreadSummary;
}

export interface SvSNClusteringData {
  Property_Type: string;
  Bedrooms: string;
  rent_bucket: string;
  unit_count: number;
  avg_days_vacant: number;
}

export interface SvSNClusteringResponse {
  clustering_data: SvSNClusteringData[];
  bedroom_type: string;
}

export interface SvSNRecommendationData {
  Unit: string;
  Bedrooms: string;
  Market_Rent: number;
  Advertised_Rent: number;
  Days_Vacant: number;
  pct_below_market: number;
  rent_gap: number;
  suggested_action: string;
  priority: string;
}

export interface SvSNRecommendationResponse {
  recommendations: SvSNRecommendationData[];
}

// Archive Analytics types (similar to SvSN but for Archive data)
export interface ArchiveBenchmarkData {
  Property_Type: string;
  Reporting_Property_Name: string;
  Bedrooms: string;
  unit_count: number;
  avg_market_rent: number;
  avg_market_rent_psf: number;
  avg_sq_ft: number;
}

export interface ArchiveBenchmarkResponse {
  benchmark_data: ArchiveBenchmarkData[];
}

export interface ArchiveVacancyData {
  Property_Type: string;
  Reporting_Property_Name: string;
  Bedrooms: string;
  total_units: number;
  avg_days_vacant: number;
  pct_vacant_30plus: number;
  units_vacant_30plus: number;
}

export interface ArchiveVacancyResponse {
  vacancy_data: ArchiveVacancyData[];
}

export interface ArchiveRentSpreadData {
  property_name: string;
  Unit: string;
  Bedrooms: string;
  Market_Rent: number;
  Advertised_Rent: number;
  Days_Vacant: number;
  pct_below_market: number;
  suggested_action: string;
}

export interface ArchiveRentSpreadSummary {
  total_units: number;
  units_below_market_10pct: number;
  avg_rent_gap_pct: number;
}

export interface ArchiveRentSpreadResponse {
  rent_spread_data: ArchiveRentSpreadData[];
  summary: ArchiveRentSpreadSummary;
}

export interface ArchiveClusteringData {
  rent_bucket: string;
  Bedrooms: string;
  unit_count: number;
  avg_days_vacant: number;
  Property_Type: string;
}

export interface ArchiveClusteringResponse {
  clustering_data: ArchiveClusteringData[];
}

export interface ArchiveRecommendationData {
  Unit: string;
  Bedrooms: string;
  Market_Rent: number;
  Advertised_Rent: number;
  Days_Vacant: number;
  suggested_action: string;
  priority: string;
}

export interface ArchiveRecommendationResponse {
  recommendations: ArchiveRecommendationData[];
} 