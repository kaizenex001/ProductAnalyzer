import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report, ProductInput } from "@shared/schema";

export function useReports() {
  return useQuery({
    queryKey: ["/api/reports"],
  });
}

export function useReport(id: number) {
  return useQuery({
    queryKey: ["/api/reports", id],
    enabled: !!id,
  });
}

export function useSaveReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productData, analysis }: { productData: ProductInput; analysis: any }) => {
      const response = await apiRequest("POST", "/api/reports", { productData, analysis });
      return response.json();
    },
    onSuccess: (report: Report) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: `Report for ${report.productName} saved!`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reportId: number) => {
      await apiRequest("DELETE", `/api/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    },
  });
}
