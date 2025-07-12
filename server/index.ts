// Enhanced server setup with comprehensive middleware and error handling
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  errorHandler, 
  requestLogger, 
  sanitizeInput, 
  formatResponse, 
  healthCheck, 
  notFoundHandler,
  getCorsOptions,
  createRateLimitMessage
} from "./middleware";
import { 
  SERVER_CONFIG, 
  RATE_LIMIT_CONFIG, 
  SECURITY_CONFIG, 
  API_ENDPOINTS,
  validateEnvironment 
} from "./config";

// Validate environment variables on startup
try {
  validateEnvironment();
  console.log("✅ Environment validation passed");
} catch (error) {
  console.error("❌ Environment validation failed:", (error as Error).message);
  process.exit(1);
}

// Create and configure Express app
export async function createServer() {
  const app = express();

  // Trust proxy for accurate IP addresses
  app.set("trust proxy", 1);

  // Security middleware
  app.use(helmet(SECURITY_CONFIG.HELMET_CONFIG));

  // CORS configuration
  const corsOptions = getCorsOptions(['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5001']);
  app.use(cors(corsOptions));

  // Rate limiting for API routes
  const rateLimiter = rateLimit({
    windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
    max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
    message: createRateLimitMessage(
      RATE_LIMIT_CONFIG.WINDOW_MS,
      RATE_LIMIT_CONFIG.MAX_REQUESTS
    ),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: RATE_LIMIT_CONFIG.SKIP_SUCCESSFUL_REQUESTS,
    skipFailedRequests: RATE_LIMIT_CONFIG.SKIP_FAILED_REQUESTS,
  });

  // Apply rate limiting to API routes only
  app.use('/api', rateLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));

  // Compression middleware
  app.use(compression());

  // Input sanitization
  app.use(sanitizeInput);

  // Response formatting
  app.use(formatResponse);

  // Enhanced request logging
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // Health check endpoint
  app.get('/api' + API_ENDPOINTS.HEALTH, healthCheck);

  // Register API routes
  await registerRoutes(app);
  console.log("✅ API routes registered successfully");

  // 404 handler for API routes
  app.use('/api', notFoundHandler);

  // Enhanced global error handler
  app.use(errorHandler);

  // Setup Vite for development or serve static files for production
  if (app.get("env") === "development") {
    await setupVite(app);
  } else {
    serveStatic(app);
  }

  return app;
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start server if not in Vercel environment
(async () => {
  try {
    // Skip server startup on Vercel (handled by serverless functions)
    if (SERVER_CONFIG.IS_VERCEL) {
      console.log('🔄 Running on Vercel - serverless mode');
      return;
    }

    const app = await createServer();

    // Start server
    const port = 5001;
    console.log('🚀 Server is starting...');
    app.listen(port, "127.0.0.1", () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base Path: /api`);
      console.log(`⚡ Health Check: http://127.0.0.1:${port}/api${API_ENDPOINTS.HEALTH}`);
      log(`Server running: http://127.0.0.1:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
