import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { CloudUpload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (imageUrl: string) => void;
  className?: string;
}

export default function FileUpload({ onUpload, className }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
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
    onSuccess: (data) => {
      setUploadedImage(data.imageUrl);
      onUpload(data.imageUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    onUpload("");
  };

  if (uploadedImage) {
    return (
      <div className={cn("relative", className)}>
        <img
          src={uploadedImage}
          alt="Uploaded product"
          className="w-full h-48 object-cover rounded-lg border border-slate-300"
        />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2"
          onClick={removeImage}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
        dragActive
          ? "border-primary bg-primary/5"
          : "border-slate-300 hover:border-primary/50",
        uploadMutation.isPending && "opacity-50 pointer-events-none",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={uploadMutation.isPending}
      />
      
      {uploadMutation.isPending ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
          <p className="text-slate-600">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <CloudUpload className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-slate-600 mb-1">Drop image here or click to upload</p>
          <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
        </div>
      )}
    </div>
  );
}
