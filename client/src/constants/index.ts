// Constants for the application
export const APP_CONFIG = {
  NAME: 'Product Analyzer',
  VERSION: '1.0.0',
  DESCRIPTION: 'Advanced product analysis and content generation platform',
} as const;

export const API_ENDPOINTS = {
  REPORTS: '/api/reports',
  ANALYZE: '/api/analyze',
  UPLOAD_IMAGE: '/api/upload-image',
  CONTENT_IDEAS: '/api/content-ideas',
  CHAT: '/api/chat',
} as const;

export const ROUTES = {
  HOME: '/',
  ANALYZER: '/',
  REPORTS: '/reports',
  CONTENT_IDEATION: '/content-ideation',
  CHAT: '/chat',
  NOT_FOUND: '/404',
} as const;

export const VALIDATION_RULES = {
  REQUIRED: 'This field is required',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must not exceed ${max} characters`,
  EMAIL: 'Must be a valid email address',
  NUMERIC: 'Must be a valid number',
  POSITIVE: 'Must be a positive number',
  FILE_SIZE: 'File size must be less than 10MB',
  FILE_TYPE: 'Only image files are allowed',
} as const;

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 200,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const THEME_CONFIG = {
  DEFAULT: 'system',
  STORAGE_KEY: 'product-analyzer-theme',
  THEMES: ['light', 'dark', 'system'] as const,
} as const;

export const LOCAL_STORAGE_KEYS = {
  THEME: 'product-analyzer-theme',
  USER_PREFERENCES: 'product-analyzer-preferences',
  RECENT_ANALYSES: 'product-analyzer-recent',
} as const;

export const QUERY_KEYS = {
  REPORTS: ['reports'],
  REPORT: (id: number) => ['report', id],
  ANALYSIS: ['analysis'],
  CONTENT_IDEAS: ['content-ideas'],
  CHAT: ['chat'],
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
  ANALYSIS_ERROR: 'Analysis failed. Please try again.',
  REPORT_NOT_FOUND: 'Report not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  GENERIC: 'Something went wrong. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  REPORT_SAVED: 'Report saved successfully!',
  REPORT_DELETED: 'Report deleted successfully!',
  ANALYSIS_COMPLETE: 'Analysis completed successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;
