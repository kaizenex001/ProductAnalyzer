// Enhanced API client with better error handling and type safety
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/constants";
import { getErrorMessage, isNetworkError } from "@/lib/utils";
import { apiRequest } from "./queryClient";
import type { ProductInput, Report, InsertReport } from "@shared/schema";
import type { ApiResponse } from "@/types";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string = ERROR_MESSAGES.SERVER_ERROR;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use response text if not JSON
        errorMessage = errorText || errorMessage;
      }
      
      throw new ApiError(errorMessage, response.status);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as T;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      if (isNetworkError(error)) {
        throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR);
      }
      throw new ApiError(getErrorMessage(error));
    }
  }

  // Reports API
  async getReports(): Promise<Report[]> {
    return this.request<Report[]>(API_ENDPOINTS.REPORTS);
  }

  async getReport(id: number): Promise<Report> {
    return this.request<Report>(`${API_ENDPOINTS.REPORTS}/${id}`);
  }

  async createReport(data: FormData): Promise<Report> {
    return this.request<Report>(API_ENDPOINTS.REPORTS, {
      method: 'POST',
      body: data,
      headers: {}, // Don't set Content-Type for FormData
    });
  }

  async updateReport(id: number, data: Partial<InsertReport>): Promise<Report> {
    return this.request<Report>(`${API_ENDPOINTS.REPORTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReport(id: number): Promise<void> {
    return this.request<void>(`${API_ENDPOINTS.REPORTS}/${id}`, {
      method: 'DELETE',
    });
  }

  // Analysis API
  async analyzeProduct(data: ProductInput): Promise<any> {
    return this.request<any>(API_ENDPOINTS.ANALYZE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // File Upload API
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.request<{ url: string }>(API_ENDPOINTS.UPLOAD_IMAGE, {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
  }

  // Content Generation API
  async generateContentIdeas(data: any): Promise<any> {
    return this.request<any>(API_ENDPOINTS.CONTENT_IDEAS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Chat API
  async sendChatMessage(message: string, context?: any): Promise<any> {
    return this.request<any>(API_ENDPOINTS.CHAT, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/api/health');
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export for legacy compatibility
export const legacyApi = {
  // Reports
  getReports: () => apiRequest("GET", "/api/reports"),
  getReport: (id: number) => apiRequest("GET", `/api/reports/${id}`),
  deleteReport: (id: number) => apiRequest("DELETE", `/api/reports/${id}`),
  saveReport: (productData: ProductInput, analysis: any) => 
    apiRequest("POST", "/api/reports", { productData, analysis }),
  
  // Analysis
  analyzeProduct: (data: ProductInput) => apiRequest("POST", "/api/analyze", data),
  
  // File upload
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
  },
  
  // PDF download
  downloadReportPDF: (reportId: number) => {
    window.open(`/api/reports/${reportId}/pdf`, '_blank');
  },
};

// Export types
export { ApiError };
export type { ApiResponse };
