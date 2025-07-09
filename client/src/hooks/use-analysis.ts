import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductInput } from "@shared/schema";

export function useAnalysis() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const response = await apiRequest("POST", "/api/analyze", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Your product analysis has been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate product analysis. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useImageUpload() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });
}
