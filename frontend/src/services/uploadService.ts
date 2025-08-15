import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000/api/v1' 
  : '/api/v1';

interface UploadParams {
  file: File;
  fileType: 'rent_roll' | 'competition';
  propertyId: string;
  dataMonth: string;
  userId: string;
}

interface UploadResult {
  success: boolean;
  upload_id: string;
  message: string;
  row_count?: number;
  quality_score?: number;
  warnings?: string[];
  errors?: string[];
  processing_time_seconds?: number;
}

interface UploadHistoryParams {
  propertyId?: string;
  fileType?: string;
  limit?: number;
}

interface UploadRecord {
  upload_id: string;
  property_id: string;
  user_id: string;
  file_type: 'rent_roll' | 'competition';
  original_filename: string;
  upload_date: string;
  data_month: string;
  row_count: number;
  validation_status: string;
  processing_status: string;
  quality_score?: number;
  validation_warnings?: string[];
  validation_errors?: string[];
  processing_error?: string;
  created_at: string;
}

interface UploadHistoryResponse {
  uploads: UploadRecord[];
  total_count: number;
  property_id_filter?: string;
  file_type_filter?: string;
}

interface UploadStatsResponse {
  total_uploads: number;
  successful_uploads: number;
  failed_uploads: number;
  total_rows_processed: number;
  avg_quality_score: number;
}

class UploadService {
  private axiosInstance: any;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 60 seconds for uploads
    });

    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('🚀 Upload API Request:', {
          method: config.method,
          url: config.url,
          data: config.data instanceof FormData ? 'FormData' : config.data,
        });
        return config;
      },
      (error) => {
        console.error('❌ Upload API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('✅ Upload API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.error('❌ Upload API Response Error:', {
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data,
          message: error.message,
        });
        
        // Enhance error message
        if (error.response?.data?.detail) {
          error.message = error.response.data.detail;
        } else if (error.response?.data?.message) {
          error.message = error.response.data.message;
        } else if (error.response?.status === 413) {
          error.message = 'File too large. Please ensure your file is under 10MB.';
        } else if (error.response?.status === 422) {
          error.message = 'Invalid file format. Please upload a CSV, XLS, or XLSX file.';
        } else if (error.code === 'ECONNABORTED') {
          error.message = 'Upload timeout. Please try again with a smaller file.';
        }
        
        return Promise.reject(error);
      }
    );
  }

  async uploadFile(params: UploadParams): Promise<UploadResult> {
    console.log('🚀 uploadFile called with params:', params);
    console.log('🔧 axiosInstance:', this.axiosInstance);
    
    const { file, fileType, propertyId, dataMonth, userId } = params;
    
    // Validate file
    if (!file) {
      throw new Error('No file selected');
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }
    
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(csv|xls|xlsx)$/)) {
      throw new Error('Invalid file type. Please upload a CSV, XLS, or XLSX file.');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('property_id', propertyId);
    formData.append('data_month', dataMonth);
    formData.append('user_id', userId);

    // Determine endpoint
    const endpoint = fileType === 'rent_roll' ? '/uploads/rent-roll' : '/uploads/competition';

    try {
      const response = await this.axiosInstance.post<UploadResult>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      // Re-throw with enhanced error message
      throw new Error(error.message || 'Upload failed');
    }
  }

  async getUploadHistory(params: UploadHistoryParams = {}): Promise<UploadHistoryResponse> {
    const { propertyId, fileType, limit = 50 } = params;
    
    const queryParams = new URLSearchParams();
    if (propertyId) queryParams.append('property_id', propertyId);
    if (fileType && fileType !== 'all') queryParams.append('file_type', fileType);
    queryParams.append('limit', limit.toString());
    
    try {
      const response = await this.axiosInstance.get<UploadHistoryResponse>(
        `/uploads/history?${queryParams.toString()}`
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch upload history:', error);
      throw new Error(error.message || 'Failed to fetch upload history');
    }
  }

  async getUploadStats(propertyId?: string): Promise<UploadStatsResponse> {
    const queryParams = new URLSearchParams();
    if (propertyId) queryParams.append('property_id', propertyId);
    
    try {
      const response = await this.axiosInstance.get<UploadStatsResponse>(
        `/uploads/stats?${queryParams.toString()}`
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch upload stats:', error);
      throw new Error(error.message || 'Failed to fetch upload stats');
    }
  }

  async downloadUploadReport(uploadId: string): Promise<Blob> {
    try {
      const response = await this.axiosInstance.get(`/uploads/${uploadId}/report`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to download upload report:', error);
      throw new Error(error.message || 'Failed to download report');
    }
  }

  async retryUpload(uploadId: string): Promise<UploadResult> {
    try {
      const response = await this.axiosInstance.post<UploadResult>(`/uploads/${uploadId}/retry`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to retry upload:', error);
      throw new Error(error.message || 'Failed to retry upload');
    }
  }

  async deleteUpload(uploadId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/uploads/${uploadId}`);
    } catch (error: any) {
      console.error('Failed to delete upload:', error);
      throw new Error(error.message || 'Failed to delete upload');
    }
  }

  // Utility method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility method to validate CSV format
  validateCsvFormat(file: File): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          
          if (lines.length < 2) {
            resolve({ valid: false, error: 'File must have at least a header and one data row' });
            return;
          }
          
          const header = lines[0];
          if (!header || header.trim().length === 0) {
            resolve({ valid: false, error: 'File must have a header row' });
            return;
          }
          
          // Basic CSV validation
          const columns = header.split(',').length;
          if (columns < 3) {
            resolve({ valid: false, error: 'File must have at least 3 columns' });
            return;
          }
          
          resolve({ valid: true });
        } catch (error) {
          resolve({ valid: false, error: 'Failed to parse file' });
        }
      };
      
      reader.onerror = () => {
        resolve({ valid: false, error: 'Failed to read file' });
      };
      
      // Read only first 1KB for validation
      const blob = file.slice(0, 1024);
      reader.readAsText(blob);
    });
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;
