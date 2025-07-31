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
  { unit_id: '101', property: 'Demo Property A', unit_type: '1BR', status: 'VACANT', advertised_rent: 1200, market_rent: 1250, sqft: 650, rent_per_sqft: 1.85, pricing_urgency: 'HIGH', annual_revenue_potential: 15000 },
  { unit_id: '102', property: 'Demo Property A', unit_type: '2BR', status: 'OCCUPIED', advertised_rent: 1800, market_rent: 1850, sqft: 900, rent_per_sqft: 2.00, pricing_urgency: 'MEDIUM', annual_revenue_potential: 22200 },
  { unit_id: '201', property: 'Demo Property B', unit_type: '1BR', status: 'NOTICE', advertised_rent: 1150, market_rent: 1300, sqft: 600, rent_per_sqft: 1.92, pricing_urgency: 'IMMEDIATE', annual_revenue_potential: 15600 }
];

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
    const response: AxiosResponse<UnitsListResponse> = await this.client.get('/units', {
      params,
    });
    return response.data;
  }

  async getUnitComparables(unitId: string): Promise<ComparablesResponse> {
    const response: AxiosResponse<ComparablesResponse> = await this.client.get(
      `/units/${unitId}/comparables`
    );
    return response.data;
  }

  async optimizeUnit(unitId: string, request: OptimizeRequest): Promise<OptimizeResponse> {
    const response: AxiosResponse<OptimizeResponse> = await this.client.post(
      `/units/${unitId}/optimize`,
      request
    );
    return response.data;
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
  async getProperties(): Promise<string[]> {
    const response: AxiosResponse<{ properties: string[] }> = await this.client.get('/properties');
    return response.data.properties;
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
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 