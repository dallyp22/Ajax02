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