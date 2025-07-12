// Enhanced backend configuration and constants
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_BASE_PATH: '/api',
  CLIENT_BUILD_PATH: './server/public',
  UPLOAD_LIMIT: '10mb',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5001',
    'https://*.vercel.app',
    'https://your-app-name.vercel.app'
  ],
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_VERCEL: process.env.VERCEL === '1',
} as const;

// Database configuration
export const DATABASE_CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
} as const;

// External services configuration
export const SERVICES_CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
} as const;

// File upload configuration
export const UPLOAD_CONFIG = {
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  MAX_FILE_SIZE: SERVER_CONFIG.MAX_FILE_SIZE,
  UPLOAD_DIRECTORY: 'uploads',
  SUPABASE_BUCKET: 'report-images',
} as const;

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false,
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  BCRYPT_SALT_ROUNDS: 12,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: '7d',
  HELMET_CONFIG: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: process.env.NODE_ENV === 'development' 
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://replit.com"] 
          : ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: process.env.NODE_ENV === 'development'
          ? ["'self'", "ws:", "wss:", "http:", "https:"]
          : ["'self'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  REPORTS: '/reports',
  ANALYZE: '/analyze',
  UPLOAD_IMAGE: '/upload-image',
  CONTENT_IDEAS: '/content-ideas',
  CHAT: '/chat',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  BAD_REQUEST: 'Bad request',
  FILE_TOO_LARGE: 'File too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  OPENAI_API_ERROR: 'OpenAI API error',
  DATABASE_ERROR: 'Database error',
  UPLOAD_ERROR: 'Upload error',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  REPORT_CREATED: 'Report created successfully',
  REPORT_UPDATED: 'Report updated successfully',
  REPORT_DELETED: 'Report deleted successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  ANALYSIS_COMPLETE: 'Analysis completed successfully',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  MAX_STRING_LENGTH: 1000,
  MAX_TEXT_LENGTH: 10000,
  MIN_STRING_LENGTH: 1,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_REGEX: /^https?:\/\/.+/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
} as const;

// Validate required environment variables
export function validateEnvironment() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Type definitions
export interface ServerError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface RequestMetadata {
  ip: string;
  userAgent: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}
