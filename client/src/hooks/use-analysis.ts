// Enhanced hooks for product analysis
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { QUERY_KEYS, SUCCESS_MESSAGES, UI_CONSTANTS } from "@/constants";
import { getErrorMessage, isValidFileType, isValidFileSize } from "@/lib/utils";
import type { ProductInput } from "@shared/schema";

// Product analysis hook
export function useAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const response = await api.analyzeProduct(data);
      return response;
    },
    onSuccess: (analysis) => {
      // Cache the analysis result
      queryClient.setQueryData(QUERY_KEYS.ANALYSIS, analysis);
      
      toast({
        title: "Success",
        description: SUCCESS_MESSAGES.ANALYSIS_COMPLETE,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

// Image upload hook with validation
export function useImageUpload() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      // Validate file type
      if (!isValidFileType(file, [...UI_CONSTANTS.ALLOWED_IMAGE_TYPES])) {
        throw new Error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      }
      
      // Validate file size
      if (!isValidFileSize(file, UI_CONSTANTS.MAX_FILE_SIZE)) {
        throw new Error('File size must be less than 10MB');
      }
      
      const result = await api.uploadImage(file);
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: SUCCESS_MESSAGES.FILE_UPLOADED,
        variant: "default",
      });
      return result;
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}
