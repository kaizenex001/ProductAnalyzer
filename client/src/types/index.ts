// Core type definitions for the application
export * from '@shared/schema';

// Frontend-specific types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Navigation types
export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'file' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: Record<string, any>;
}

// Analysis types
export interface AnalysisState {
  isAnalyzing: boolean;
  analysis?: any;
  error?: string;
  progress?: number;
}

// File upload types
export interface FileUploadState {
  isUploading: boolean;
  progress?: number;
  error?: string;
  uploadedUrl?: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Toast types
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}
