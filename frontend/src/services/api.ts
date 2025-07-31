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

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
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
    const response = await this.client.get('/analytics/portfolio');
    return response.data;
  }

  async getMarketPosition(): Promise<any> {
    const response = await this.client.get('/analytics/market-position');
    return response.data;
  }

  async getPricingOpportunities(): Promise<any> {
    const response = await this.client.get('/analytics/pricing-opportunities');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 