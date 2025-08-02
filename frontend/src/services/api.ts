// API Service for RentRoll AI Optimizer Frontend

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  UnitsListResponse,
  UnitsQueryParams,
  ComparablesResponse,
  OptimizeRequest,
  OptimizeResponse,
  BatchOptimizeRequest,
  BatchOptimizeResponse,
  HealthResponse,
  PropertyListResponse,
  PropertyVsCompetitionAnalysis,
  PropertyUnitAnalysis,
  PropertyMarketTrends,
  Unit,
} from '@/types/api';

// Mock data for demo mode
const mockPortfolioData = {
  portfolio: {
    total_units: 2998,
    vacant_units: 420,
    occupied_units: 2227,
    notice_units: 351,
    units_needing_pricing: 780,
    total_revenue_potential: 52507860.0,
    current_annual_revenue: 39218520.0,
    avg_rent_per_sqft: 1.86,
    avg_occupied_rent: 1467.54,
    avg_vacant_rent: 1399.50,
    occupancy_rate: 74.28,
    revenue_optimization_potential: 13289340.0
  },
  urgency_breakdown: [
    { pricing_urgency: 'IMMEDIATE', unit_count: 419 },
    { pricing_urgency: 'HIGH', unit_count: 250 },
    { pricing_urgency: 'MEDIUM', unit_count: 111 }
  ],
  property_performance: [
    { property: 'Atlas - 2929 California Plaza', total_units: 732, vacant_units: 58, avg_rent: 1665.92, avg_rent_per_sqft: 2.02, revenue_potential: 14633460.0 },
    { property: 'The Wire - 100 S 19th Street', total_units: 306, vacant_units: 22, avg_rent: 1437.04, avg_rent_per_sqft: 1.89, revenue_potential: 5276820.0 }
  ]
};

const mockUnits = [
  { 
    unit_id: '101', 
    property: 'Atlas - 2929 California Plaza', 
    bed: 1, 
    bath: 1, 
    unit_type: '1BR', 
    status: 'VACANT', 
    advertised_rent: 1200, 
    market_rent: 1250, 
    sqft: 650, 
    rent_per_sqft: 1.85, 
    pricing_urgency: 'HIGH', 
    annual_revenue_potential: 15000, 
    needs_pricing: true, 
    size_category: 'SMALL', 
    has_complete_data: true 
  },
  { 
    unit_id: '102', 
    property: 'Atlas - 2929 California Plaza', 
    bed: 2, 
    bath: 2, 
    unit_type: '2BR', 
    status: 'OCCUPIED', 
    advertised_rent: 1800, 
    market_rent: 1850, 
    sqft: 900, 
    rent_per_sqft: 2.00, 
    pricing_urgency: 'MEDIUM', 
    annual_revenue_potential: 22200, 
    needs_pricing: false, 
    size_category: 'MEDIUM', 
    has_complete_data: true 
  },
  { 
    unit_id: '201', 
    property: 'The Wire - 100 S 19th Street', 
    bed: 1, 
    bath: 1, 
    unit_type: '1BR', 
    status: 'NOTICE', 
    advertised_rent: 1150, 
    market_rent: 1300, 
    sqft: 600, 
    rent_per_sqft: 1.92, 
    pricing_urgency: 'IMMEDIATE', 
    annual_revenue_potential: 15600, 
    needs_pricing: true, 
    size_category: 'SMALL', 
    has_complete_data: true 
  },
  { 
    unit_id: '301', 
    property: 'Demo Complex', 
    bed: 0, 
    bath: 1, 
    unit_type: 'STUDIO', 
    status: 'OCCUPIED', 
    advertised_rent: 900, 
    market_rent: 950, 
    sqft: 450, 
    rent_per_sqft: 2.11, 
    pricing_urgency: 'LOW', 
    annual_revenue_potential: 11400, 
    needs_pricing: false, 
    size_category: 'MICRO', 
    has_complete_data: true 
  },
  { 
    unit_id: '302', 
    property: 'Demo Complex', 
    bed: 3, 
    bath: 2, 
    unit_type: '3BR', 
    status: 'VACANT', 
    advertised_rent: 2200, 
    market_rent: 2350, 
    sqft: 1200, 
    rent_per_sqft: 1.96, 
    pricing_urgency: 'IMMEDIATE', 
    annual_revenue_potential: 28200, 
    needs_pricing: true, 
    size_category: 'LARGE', 
    has_complete_data: true 
  }
] as Unit[];

class ApiService {
  private client: AxiosInstance;
  private isDemoMode: boolean;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    console.log('🚀 API Service initialized:', { baseURL, isDemoMode: this.isDemoMode });
    
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Units endpoints
  async getUnits(params: UnitsQueryParams = {}): Promise<UnitsListResponse> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock units data');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      // Create more realistic mock data
      const allMockUnits = [
        { unit_id: '101', property: 'Atlas - 2929 California Plaza', bed: 1, bath: 1, unit_type: 'ONE_BR', status: 'VACANT', advertised_rent: 1200, market_rent: 1250, sqft: 650, rent_per_sqft: 1.85, pricing_urgency: 'HIGH', annual_revenue_potential: 15000, needs_pricing: true, size_category: 'SMALL', has_complete_data: true },
        { unit_id: '102', property: 'Atlas - 2929 California Plaza', bed: 2, bath: 2, unit_type: 'TWO_BR', status: 'OCCUPIED', advertised_rent: 1800, market_rent: 1850, sqft: 900, rent_per_sqft: 2.00, pricing_urgency: 'MEDIUM', annual_revenue_potential: 22200, needs_pricing: false, size_category: 'MEDIUM', has_complete_data: true },
        { unit_id: '201', property: 'The Wire - 100 S 19th Street', bed: 1, bath: 1, unit_type: 'ONE_BR', status: 'NOTICE', advertised_rent: 1150, market_rent: 1300, sqft: 600, rent_per_sqft: 1.92, pricing_urgency: 'IMMEDIATE', annual_revenue_potential: 15600, needs_pricing: true, size_category: 'SMALL', has_complete_data: true },
        { unit_id: '202', property: 'The Wire - 100 S 19th Street', bed: 2, bath: 2, unit_type: 'TWO_BR', status: 'VACANT', advertised_rent: 1650, market_rent: 1700, sqft: 850, rent_per_sqft: 2.00, pricing_urgency: 'HIGH', annual_revenue_potential: 20400, needs_pricing: true, size_category: 'MEDIUM', has_complete_data: true },
        { unit_id: '301', property: 'Demo Complex', bed: 0, bath: 1, unit_type: 'STUDIO', status: 'OCCUPIED', advertised_rent: 900, market_rent: 950, sqft: 450, rent_per_sqft: 2.11, pricing_urgency: 'LOW', annual_revenue_potential: 11400, needs_pricing: false, size_category: 'MICRO', has_complete_data: true },
        { unit_id: '302', property: 'Demo Complex', bed: 3, bath: 2, unit_type: 'THREE_BR', status: 'VACANT', advertised_rent: 2200, market_rent: 2350, sqft: 1200, rent_per_sqft: 1.96, pricing_urgency: 'IMMEDIATE', annual_revenue_potential: 28200, needs_pricing: true, size_category: 'LARGE', has_complete_data: true },
      ];
      
      const pageSize = params.page_size || 25;
      const page = (params.page || 1) - 1;
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        units: allMockUnits.slice(startIndex, endIndex),
        total_count: allMockUnits.length,
        page: params.page || 1,
        page_size: pageSize,
        total_pages: Math.ceil(allMockUnits.length / pageSize),
      };
    }
    
    try {
      const response: AxiosResponse<UnitsListResponse> = await this.client.get('/units', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      // Fallback to mock data on error
      const allMockUnits = [
        { unit_id: '101', property: 'Atlas - 2929 California Plaza', unit_type: '1BR', status: 'VACANT', advertised_rent: 1200, market_rent: 1250, sqft: 650, rent_per_sqft: 1.85, pricing_urgency: 'HIGH', annual_revenue_potential: 15000, needs_pricing: true },
        { unit_id: '102', property: 'Atlas - 2929 California Plaza', unit_type: '2BR', status: 'OCCUPIED', advertised_rent: 1800, market_rent: 1850, sqft: 900, rent_per_sqft: 2.00, pricing_urgency: 'MEDIUM', annual_revenue_potential: 22200, needs_pricing: false },
        { unit_id: '201', property: 'The Wire - 100 S 19th Street', unit_type: '1BR', status: 'NOTICE', advertised_rent: 1150, market_rent: 1300, sqft: 600, rent_per_sqft: 1.92, pricing_urgency: 'IMMEDIATE', annual_revenue_potential: 15600, needs_pricing: true },
      ];
      
      const pageSize = params.page_size || 25;
      const page = (params.page || 1) - 1;
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        units: allMockUnits.slice(startIndex, endIndex),
        total_count: allMockUnits.length,
        page: params.page || 1,
        page_size: pageSize,
        total_pages: Math.ceil(allMockUnits.length / pageSize),
      };
    }
  }

  async getUnitComparables(unitId: string): Promise<ComparablesResponse> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock comparables data');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        unit_id: unitId,
        comparable_units: [
          { comp_id: 'comp1', property: 'Nearby Complex A', sqft: 680, price: 1280, price_per_sqft: 1.88, match_score: 0.95, is_available: true, price_gap_pct: 6.7 },
          { comp_id: 'comp2', property: 'Nearby Complex B', sqft: 650, price: 1220, price_per_sqft: 1.88, match_score: 0.92, is_available: true, price_gap_pct: 1.7 },
          { comp_id: 'comp3', property: 'Nearby Complex C', sqft: 700, price: 1350, price_per_sqft: 1.93, match_score: 0.89, is_available: false, price_gap_pct: 12.5 },
        ],
        summary: {
          avg_comp_price: 1283.33,
          avg_comp_price_per_sqft: 1.90,
          total_comparables: 3,
          available_comparables: 2,
        },
      };
    }
    
    try {
      const response: AxiosResponse<ComparablesResponse> = await this.client.get(
        `/units/${unitId}/comparables`
      );
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      return {
        unit_id: unitId,
        comparable_units: [
          { comp_id: 'comp1', property: 'Nearby Complex A', sqft: 680, price: 1280, price_per_sqft: 1.88, match_score: 0.95, is_available: true, price_gap_pct: 6.7 },
          { comp_id: 'comp2', property: 'Nearby Complex B', sqft: 650, price: 1220, price_per_sqft: 1.88, match_score: 0.92, is_available: true, price_gap_pct: 1.7 },
        ],
        summary: {
          avg_comp_price: 1250.00,
          avg_comp_price_per_sqft: 1.88,
          total_comparables: 2,
          available_comparables: 2,
        },
      };
    }
  }

  async optimizeUnit(unitId: string, request: OptimizeRequest): Promise<OptimizeResponse> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock optimization data');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay for optimization
      
      const baseRent = 1200;
      const optimizedRents = {
        REVENUE_MAXIMIZATION: baseRent + 150,
        LEASE_UP_TIME: baseRent + 50,
        BALANCED: baseRent + 100,
      };
      
      return {
        unit_id: unitId,
        strategy: request.strategy,
        current_rent: baseRent,
        optimized_rent: optimizedRents[request.strategy],
        revenue_impact: (optimizedRents[request.strategy] - baseRent) * 12,
        confidence_score: 0.87,
        recommendations: [
          `Recommended rent: $${optimizedRents[request.strategy]}`,
          `Expected annual revenue increase: $${(optimizedRents[request.strategy] - baseRent) * 12}`,
          'Market analysis shows strong demand for this unit type',
        ],
      };
    }
    
    try {
      const response: AxiosResponse<OptimizeResponse> = await this.client.post(
        `/units/${unitId}/optimize`,
        request
      );
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      const baseRent = 1200;
      const optimizedRents = {
        REVENUE_MAXIMIZATION: baseRent + 150,
        LEASE_UP_TIME: baseRent + 50,
        BALANCED: baseRent + 100,
      };
      
      return {
        unit_id: unitId,
        strategy: request.strategy,
        current_rent: baseRent,
        optimized_rent: optimizedRents[request.strategy],
        revenue_impact: (optimizedRents[request.strategy] - baseRent) * 12,
        confidence_score: 0.87,
        recommendations: [
          `Recommended rent: $${optimizedRents[request.strategy]}`,
          `Expected annual revenue increase: $${(optimizedRents[request.strategy] - baseRent) * 12}`,
          'Demo mode - actual optimization would use real market data',
        ],
      };
    }
  }

  // Batch optimization
  async batchOptimize(request: BatchOptimizeRequest): Promise<BatchOptimizeResponse> {
    const response: AxiosResponse<BatchOptimizeResponse> = await this.client.post(
      '/batch/optimize',
      request
    );
    return response.data;
  }

  // Meta endpoints
  async getProperties(): Promise<PropertyListResponse> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock properties');
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        properties: [
          'Atlas - 2929 California Plaza',
          'The Wire - 100 S 19th Street',
          'Demo Complex',
          'Sunset Heights',
          'Metropolitan Towers',
          'Garden View Apartments'
        ]
      };
    }

    try {
      const response = await this.client.get('/properties');
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      return {
        properties: [
          'Atlas - 2929 California Plaza',
          'The Wire - 100 S 19th Street',
          'Demo Complex'
        ]
      };
    }
  }

  async getPropertyCompetitionAnalysis(propertyName: string): Promise<PropertyVsCompetitionAnalysis> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock property competition analysis');
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        property_name: propertyName,
        overview_by_unit_type: [
          {
            unit_type: 'ONE_BR',
            unit_count: 45,
            avg_our_rent: 1275,
            avg_our_rent_per_sqft: 1.95,
            avg_market_rent: 1325,
            avg_market_rent_per_sqft: 2.02,
            vacant_units: 8,
            units_needing_pricing: 12,
            revenue_potential: 765000,
            avg_premium_discount_pct: -3.8
          },
          {
            unit_type: 'TWO_BR',
            unit_count: 32,
            avg_our_rent: 1875,
            avg_our_rent_per_sqft: 2.08,
            avg_market_rent: 1950,
            avg_market_rent_per_sqft: 2.17,
            vacant_units: 5,
            units_needing_pricing: 8,
            revenue_potential: 720000,
            avg_premium_discount_pct: -3.8
          }
        ],
        rent_comparison_by_bedrooms: [
          {
            bed: 1,
            unit_count: 45,
            avg_our_rent: 1275,
            min_our_rent: 1150,
            max_our_rent: 1400,
            avg_our_rent_per_sqft: 1.95,
            avg_market_rent: 1325,
            min_market_rent: 1200,
            max_market_rent: 1450,
            avg_market_rent_per_sqft: 2.02,
            comp_count: 225,
            rent_gap_pct: -3.8
          },
          {
            bed: 2,
            unit_count: 32,
            avg_our_rent: 1875,
            min_our_rent: 1650,
            max_our_rent: 2100,
            avg_our_rent_per_sqft: 2.08,
            avg_market_rent: 1950,
            min_market_rent: 1750,
            max_market_rent: 2200,
            avg_market_rent_per_sqft: 2.17,
            comp_count: 160,
            rent_gap_pct: -3.8
          }
        ],
        performance_metrics: {
          total_units: 77,
          vacant_units: 13,
          occupied_units: 58,
          notice_units: 6,
          units_needing_pricing: 20,
          avg_rent: 1535,
          avg_rent_per_sqft: 2.01,
          total_revenue_potential: 1485000,
          current_annual_revenue: 1065840,
          occupancy_rate: 75.3,
          revenue_opportunity: 419160
        }
      };
    }

    try {
      const response = await this.client.get(`/analytics/property/${encodeURIComponent(propertyName)}/competition`);
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      // Return simplified demo data on error
      return {
        property_name: propertyName,
        overview_by_unit_type: [],
        rent_comparison_by_bedrooms: [],
        performance_metrics: {
          total_units: 0,
          vacant_units: 0,
          occupied_units: 0,
          notice_units: 0,
          units_needing_pricing: 0,
          avg_rent: 0,
          avg_rent_per_sqft: 0,
          total_revenue_potential: 0,
          current_annual_revenue: 0,
          occupancy_rate: 0,
          revenue_opportunity: 0
        }
      };
    }
  }

  async getPropertyUnitAnalysis(propertyName: string): Promise<PropertyUnitAnalysis> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock property unit analysis');
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        property_name: propertyName,
        units: [
          {
            unit_id: '101',
            unit_type: 'ONE_BR',
            bed: 1,
            bath: 1,
            sqft: 650,
            status: 'VACANT',
            advertised_rent: 1200,
            rent_per_sqft: 1.85,
            needs_pricing: true,
            pricing_urgency: 'HIGH',
            annual_revenue_potential: 15000,
            comparable_count: 5,
            avg_comp_rent: 1275,
            min_comp_rent: 1225,
            max_comp_rent: 1325,
            avg_similarity_score: 0.87,
            available_comps: 3,
            rent_premium_pct: -5.9,
            potential_rent_increase: 75,
            annual_opportunity: 900,
            market_position: 'BELOW_MARKET'
          },
          {
            unit_id: '102',
            unit_type: 'TWO_BR',
            bed: 2,
            bath: 2,
            sqft: 900,
            status: 'OCCUPIED',
            advertised_rent: 1800,
            rent_per_sqft: 2.00,
            needs_pricing: false,
            pricing_urgency: 'MEDIUM',
            annual_revenue_potential: 22200,
            comparable_count: 5,
            avg_comp_rent: 1850,
            min_comp_rent: 1775,
            max_comp_rent: 1925,
            avg_similarity_score: 0.91,
            available_comps: 2,
            rent_premium_pct: -2.7,
            potential_rent_increase: 50,
            annual_opportunity: 600,
            market_position: 'AT_MARKET'
          }
        ],
        summary: {
          total_units_analyzed: 77,
          units_50plus_below_market: 20,
          units_100plus_below_market: 8,
          total_monthly_opportunity: 3420,
          total_annual_opportunity: 41040,
          avg_rent_gap: 45.2
        }
      };
    }

    try {
      const response = await this.client.get(`/analytics/property/${encodeURIComponent(propertyName)}/units`);
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      return {
        property_name: propertyName,
        units: [],
        summary: {
          total_units_analyzed: 0,
          units_50plus_below_market: 0,
          units_100plus_below_market: 0,
          total_monthly_opportunity: 0,
          total_annual_opportunity: 0,
          avg_rent_gap: 0
        }
      };
    }
  }

  async getPropertyMarketTrends(propertyName: string): Promise<PropertyMarketTrends> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock property market trends');
      await new Promise(resolve => setTimeout(resolve, 700));
      return {
        property_name: propertyName,
        market_positioning: [
          {
            unit_type: 'ONE_BR',
            bed: 1,
            our_unit_count: 45,
            our_avg_rent: 1275,
            our_avg_rent_per_sqft: 1.95,
            market_avg_rent: 1325,
            market_avg_rent_per_sqft: 2.02,
            competitor_property_count: 8,
            total_competitor_units: 225,
            rent_premium_pct: -3.8,
            rent_per_sqft_premium_pct: -3.5
          },
          {
            unit_type: 'TWO_BR',
            bed: 2,
            our_unit_count: 32,
            our_avg_rent: 1875,
            our_avg_rent_per_sqft: 2.08,
            market_avg_rent: 1950,
            market_avg_rent_per_sqft: 2.17,
            competitor_property_count: 6,
            total_competitor_units: 160,
            rent_premium_pct: -3.8,
            rent_per_sqft_premium_pct: -4.1
          }
        ],
        top_competitors: [
          {
            competitor_property: 'Luxury Heights Downtown',
            our_units_compared: 25,
            their_comparable_units: 47,
            their_avg_rent: 1425,
            their_avg_rent_per_sqft: 2.15,
            avg_similarity_score: 0.89,
            their_available_units: 8
          },
          {
            competitor_property: 'Metro Plaza Residences',
            our_units_compared: 22,
            their_comparable_units: 41,
            their_avg_rent: 1375,
            their_avg_rent_per_sqft: 2.08,
            avg_similarity_score: 0.86,
            their_available_units: 5
          },
          {
            competitor_property: 'Riverside Commons',
            our_units_compared: 18,
            their_comparable_units: 38,
            their_avg_rent: 1350,
            their_avg_rent_per_sqft: 2.05,
            avg_similarity_score: 0.84,
            their_available_units: 12
          }
        ],
        rent_distribution: [
          {
            rent_range: '$1,000 - $1,499',
            unit_type: 'ONE_BR',
            unit_count: 35
          },
          {
            rent_range: '$1,500 - $1,999',
            unit_type: 'ONE_BR',
            unit_count: 10
          },
          {
            rent_range: '$1,500 - $1,999',
            unit_type: 'TWO_BR',
            unit_count: 28
          },
          {
            rent_range: '$2,000 - $2,499',
            unit_type: 'TWO_BR',
            unit_count: 4
          }
        ]
      };
    }

    try {
      const response = await this.client.get(`/analytics/property/${encodeURIComponent(propertyName)}/market-trends`);
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      return {
        property_name: propertyName,
        market_positioning: [],
        top_competitors: [],
        rent_distribution: []
      };
    }
  }

  async getSummary(): Promise<any> {
    const response = await this.client.get('/summary');
    return response.data;
  }

  async healthCheck(): Promise<HealthResponse> {
    const response: AxiosResponse<HealthResponse> = await this.client.get('/health', {
      baseURL: '', // Use root path for health check
    });
    return response.data;
  }

  // Settings endpoints
  async getSettings(): Promise<any> {
    const response = await this.client.get('/settings');
    return response.data;
  }

  async saveSettings(settings: any): Promise<any> {
    const response = await this.client.post('/settings', settings);
    return response.data;
  }

  async testTableConnections(settings: any): Promise<any> {
    const response = await this.client.post('/settings/test', settings);
    return response.data;
  }

  // Analytics endpoints
  async getPortfolioAnalytics(): Promise<any> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock portfolio analytics');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return mockPortfolioData;
    }
    
    try {
      const response = await this.client.get('/analytics/portfolio');
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      return mockPortfolioData;
    }
  }

  async getMarketPosition(): Promise<any> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock market position data');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        market_summary: [
          { market_position: 'ABOVE_MARKET', unit_count: 1789, avg_premium_discount: 16.65, avg_rent: 1539.73 },
          { market_position: 'BELOW_MARKET', unit_count: 690, avg_premium_discount: -12.45, avg_rent: 1271.27 },
          { market_position: 'AT_MARKET', unit_count: 374, avg_premium_discount: -2.27, avg_rent: 1394.08 }
        ],
        unit_type_comparison: []
      };
    }
    
    try {
      const response = await this.client.get('/analytics/market-position');
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      return {
        market_summary: [
          { market_position: 'ABOVE_MARKET', unit_count: 1789, avg_premium_discount: 16.65, avg_rent: 1539.73 },
          { market_position: 'BELOW_MARKET', unit_count: 690, avg_premium_discount: -12.45, avg_rent: 1271.27 },
          { market_position: 'AT_MARKET', unit_count: 374, avg_premium_discount: -2.27, avg_rent: 1394.08 }
        ],
        unit_type_comparison: []
      };
    }
  }

  async getPricingOpportunities(): Promise<any> {
    if (this.isDemoMode) {
      console.log('📊 Demo Mode: Using mock pricing opportunities');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        summary: {
          units_with_50plus_opportunity: 769,
          units_with_100plus_opportunity: 554,
          total_monthly_opportunity: 134274.0,
          total_annual_opportunity: 1608223.0,
          avg_opportunity_per_unit: 127.03
        },
        top_opportunities: mockUnits.map(unit => ({
          ...unit,
          avg_comp_price: unit.market_rent + 100,
          potential_rent_increase: unit.market_rent - unit.advertised_rent,
          annual_revenue_opportunity: (unit.market_rent - unit.advertised_rent) * 12
        }))
      };
    }
    
    try {
      const response = await this.client.get('/analytics/pricing-opportunities');
      return response.data;
    } catch (error) {
      console.warn('🔄 API unavailable, falling back to demo data:', error);
      return {
        summary: {
          units_with_50plus_opportunity: 769,
          units_with_100plus_opportunity: 554,
          total_monthly_opportunity: 134274.0,
          total_annual_opportunity: 1608223.0,
          avg_opportunity_per_unit: 127.03
        },
        top_opportunities: mockUnits.map(unit => ({
          ...unit,
          avg_comp_price: unit.market_rent + 100,
          potential_rent_increase: unit.market_rent - unit.advertised_rent,
          annual_revenue_opportunity: (unit.market_rent - unit.advertised_rent) * 12
        }))
      };
    }
  }

  // SvSN Analytics API methods for NuStyle vs Competition Analysis
  async getSvSNBenchmarkAnalysis(bedroomType?: string): Promise<SvSNBenchmarkResponse> {
    const params = bedroomType ? `?bedroom_type=${encodeURIComponent(bedroomType)}` : '';
    const response = await this.client.get(`/svsn/benchmark${params}`);
    return response.data;
  }

  async getSvSNVacancyAnalysis(bedroomType?: string): Promise<SvSNVacancyResponse> {
    const params = bedroomType ? `?bedroom_type=${encodeURIComponent(bedroomType)}` : '';
    const response = await this.client.get(`/svsn/vacancy${params}`);
    return response.data;
  }

  async getSvSNRentSpreadAnalysis(): Promise<SvSNRentSpreadResponse> {
    const response = await this.client.get('/svsn/rent-spread');
    return response.data;
  }

  async getSvSNMarketRentClustering(bedroomType?: string): Promise<SvSNClusteringResponse> {
    const params = bedroomType ? `?bedroom_type=${encodeURIComponent(bedroomType)}` : '';
    const response = await this.client.get(`/svsn/clustering${params}`);
    return response.data;
  }

  async getSvSNOptimizationRecommendations(): Promise<SvSNRecommendationResponse> {
    const response = await this.client.get('/svsn/recommendations');
    return response.data;
  }

  // Archive Analytics endpoints
  async getArchiveBenchmarkAnalysis(bedroomType?: string): Promise<ArchiveBenchmarkResponse> {
    const params = bedroomType ? { bedroom_type: bedroomType } : {};
    const response = await this.client.get('/archive/benchmark', { params });
    return response.data;
  }

  async getArchiveVacancyAnalysis(bedroomType?: string): Promise<ArchiveVacancyResponse> {
    const params = bedroomType ? { bedroom_type: bedroomType } : {};
    const response = await this.client.get('/archive/vacancy', { params });
    return response.data;
  }

  async getArchiveRentSpreadAnalysis(): Promise<ArchiveRentSpreadResponse> {
    const response = await this.client.get('/archive/rent-spread');
    return response.data;
  }

  async getArchiveMarketRentClustering(bedroomType?: string): Promise<ArchiveClusteringResponse> {
    const params = bedroomType ? { bedroom_type: bedroomType } : {};
    const response = await this.client.get('/archive/clustering', { params });
    return response.data;
  }

  async getArchiveOptimizationRecommendations(): Promise<ArchiveRecommendationResponse> {
    const response = await this.client.get('/archive/recommendations');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 