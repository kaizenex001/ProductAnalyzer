// Enhanced error handling and middleware utilities
import type { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ERROR_MESSAGES, VALIDATION_RULES } from './config';
import type { ServerError, ApiResponse } from './config';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error handler middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let error = err;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    error = new ValidationError(
      'Validation failed',
      { validationErrors }
    );
  }

  // Handle MongoDB/Database errors
  if (err.name === 'MongoError' || err.name === 'CastError') {
    error = new AppError(
      'Database error',
      500,
      'DATABASE_ERROR'
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Token expired');
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      error = new ValidationError(ERROR_MESSAGES.FILE_TOO_LARGE);
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new ValidationError(ERROR_MESSAGES.INVALID_FILE_TYPE);
    } else {
      error = new ValidationError(ERROR_MESSAGES.UPLOAD_ERROR);
    }
  }

  // Ensure error is an AppError instance
  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      500,
      'INTERNAL_ERROR'
    );
  }

  const appError = error as AppError;

  // Log error for debugging
  console.error('Error occurred:', {
    message: appError.message,
    statusCode: appError.statusCode,
    code: appError.code,
    details: appError.details,
    stack: appError.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Send error response
  const response: ApiResponse = {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      ...(appError.details && { details: appError.details }),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(appError.statusCode).json(response);
}

// Async error handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation middleware
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

// Security middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Remove potential XSS attacks
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
}

// Response formatting middleware
export function formatResponse(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (typeof data === 'object' && data !== null && !data.success && !data.error) {
      const response: ApiResponse = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
      return originalSend.call(this, response);
    }
    return originalSend.call(this, data);
  };
  
  next();
}

// File validation middleware
export function validateFile(
  allowedMimeTypes: string[],
  maxSize: number = 10 * 1024 * 1024
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    // Check file size
    if (req.file.size > maxSize) {
      return next(new ValidationError(ERROR_MESSAGES.FILE_TOO_LARGE));
    }

    // Check file type
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return next(new ValidationError(ERROR_MESSAGES.INVALID_FILE_TYPE));
    }

    next();
  };
}

// Rate limiting helper
export function createRateLimitMessage(windowMs: number, maxRequests: number) {
  const windowMinutes = Math.ceil(windowMs / 60000);
  return `Too many requests. Maximum ${maxRequests} requests per ${windowMinutes} minutes.`;
}

// Health check middleware
export function healthCheck(req: Request, res: Response) {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      memory: process.memoryUsage(),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

// CORS configuration
export function getCorsOptions(allowedOrigins: string[]) {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
}
