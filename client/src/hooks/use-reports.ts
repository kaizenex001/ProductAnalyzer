// Enhanced hooks for reports management
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { QUERY_KEYS, SUCCESS_MESSAGES } from "@/constants";
import { getErrorMessage } from "@/lib/utils";
import type { Report, InsertReport, ProductInput } from "@shared/schema";

// Get all reports
export function useReports() {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS,
    queryFn: api.getReports,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Get single report
export function useReport(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORT(id),
    queryFn: () => api.getReport(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
}

// Create report mutation
export function useCreateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: FormData) => api.createReport(data),
    onSuccess: (newReport) => {
      // Invalidate and refetch reports
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS });
      
      // Optimistically update the cache
      queryClient.setQueryData<Report[]>(QUERY_KEYS.REPORTS, (old) => {
        return old ? [...old, newReport] : [newReport];
      });

      toast({
        title: "Success",
        description: SUCCESS_MESSAGES.REPORT_SAVED,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

// Delete report mutation
export function useDeleteReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => api.deleteReport(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.REPORT(deletedId) });
      
      // Update reports list
      queryClient.setQueryData<Report[]>(QUERY_KEYS.REPORTS, (old) => {
        return old?.filter(report => report.id !== deletedId);
      });

      toast({
        title: "Success",
        description: SUCCESS_MESSAGES.REPORT_DELETED,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

// Legacy compatibility hook (preserving old API)
export function useSaveReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productData, analysis }: { productData: ProductInput; analysis: any }) => {
      // Convert old format to new FormData format
      const formData = new FormData();
      
      // Add product data fields
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, value.join(','));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // Add analysis data
      formData.append('analysis', JSON.stringify(analysis));
      
      return api.createReport(formData);
    },
    onSuccess: (report: Report) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS });
      toast({
        title: "Success",
        description: `Report for ${report.productName} saved!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}
