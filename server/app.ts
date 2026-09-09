import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { apiRouter } from './routes.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';
import { sanitizeInputs } from './middleware/sanitize.js';

/**
 * Express application instance configured for both:
 * 1. Traditional Node.js runtime / Cloud Run container (via server.ts)
 * 2. Vercel Serverless Function deployment (via api/index.ts)
 */
const app = express();

// Enable reverse-proxy trust for Vercel, Cloud Run, and nginx to resolve client IP accurately
app.set('trust proxy', true);

// Standard CORS & security headers for multi-environment deployments
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle browser preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Parsers (allowing larger payload for base64 invoices/receipts)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-XSS and input sanitization
app.use(sanitizeInputs);

// General rate limiter on API routes to protect against DDoS
app.use('/api', generalApiLimiter);

// API health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cafe: 'Out of the Town - Restro and Bakery',
    platform: process.env.VERCEL ? 'vercel-serverless' : 'node-container',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cafe: 'Out of the Town - Restro and Bakery',
    platform: process.env.VERCEL ? 'vercel-serverless' : 'node-container',
    timestamp: new Date().toISOString(),
  });
});

// Primary API Router mounted at /api
app.use('/api', apiRouter);

// Fallback routing for Vercel Serverless rewrites where the /api prefix may be stripped
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api')) {
    // Attempt matching against apiRouter routes directly
    return (apiRouter as any)(req, res, next);
  }
  next();
});

// Global Error Handler for API consistency
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred',
  });
});

export { app };
export default app;
