import { apiRequest } from "./queryClient";
import type { ProductInput } from "@shared/schema";

export const api = {
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
