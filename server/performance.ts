import compression from 'compression';
import type { Express } from 'express';
import { Request, Response, NextFunction } from 'express';

// Performance middleware
export function setupPerformanceMiddleware(app: Express) {
  // Enable gzip compression
  app.use(compression({
    level: 6, // Good balance of compression vs CPU
    threshold: 1024, // Only compress files larger than 1KB
    filter: (req, res) => {
      // Don't compress if the request includes a 'x-no-compression' header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression filter function
      return compression.filter(req, res);
    }
  }));

  // Serve uploads without caching
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  // Add performance headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// Simple request timing middleware
export function requestTimer(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests
      console.log(`🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
}

// Async handler wrapper to catch errors
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}