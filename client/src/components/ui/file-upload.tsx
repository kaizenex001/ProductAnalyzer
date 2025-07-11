import { useState, useCallback } from "react";
import { CloudUpload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (imageUrl: string, file: File) => void;
  className?: string;
}

export default function FileUpload({ onUpload, className }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to convert File to base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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

  const handleFile = async (file: File) => {
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

    try {
      // Convert file to base64 for temporary storage
      const base64Url = await fileToBase64(file);
      setUploadedImage(base64Url);
      
      // Debug logging
      console.log("FileUpload: About to call onUpload with:", file.name, file.size);
      alert(`FileUpload: About to call onUpload with file: ${file.name}, Size: ${file.size} bytes`);
      
      onUpload(base64Url, file);
      
      toast({
        title: "Success",
        description: "Image loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to Load Image",
        description: "Failed to load image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    // Reset the file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    // Notify parent component that image was removed
    console.log("FileUpload: Image removed, calling onUpload with empty values");
    onUpload("", new File([], ""));
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
      />
      
      <div className="flex flex-col items-center">
        <CloudUpload className="h-12 w-12 text-slate-400 mb-3" />
        <p className="text-slate-600 mb-1">Drop image here or click to upload</p>
        <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
      </div>
    </div>
  );
}
