import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * ============================================================================
 * RATE LIMITING & ANTI-BOMBING MIDDLEWARE
 * ============================================================================
 * Protects against DDoS attacks, automated script bombing, order spam, and
 * brute-force admin attacks.
 */

// Custom IP key generator to handle reverse proxies (Cloud Run / nginx)
// and resolve 'X-Forwarded-For' and 'Forwarded' header warnings cleanly.
function getClientIp(req: Request): string {
  const forwardedHeader = req.headers['forwarded'];
  if (typeof forwardedHeader === 'string') {
    const forMatch = forwardedHeader.match(/for="?([^;,"]+)"?/i);
    if (forMatch && forMatch[1]) {
      return forMatch[1].trim();
    }
  }

  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    const firstIp = xForwardedFor[0].split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

const commonRateLimitOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: false,
};

// 1. General API Rate Limiter
// Max 150 requests per 10 minutes per IP
export const generalApiLimiter = rateLimit({
  ...commonRateLimitOptions,
  windowMs: 10 * 60 * 1000,
  max: 150,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again in a few minutes.',
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Anti-bombing protection triggered. Please wait a moment before trying again.',
      retryAfterSeconds: Math.ceil(10 * 60),
    });
  },
});

// 2. Strict Anti-Bombing Limiter for Orders & Checkout
// Max 12 order creations per 10 minutes per IP
export const orderLimiter = rateLimit({
  ...commonRateLimitOptions,
  windowMs: 10 * 60 * 1000,
  max: 12,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Order request rate limit exceeded. To prevent duplicate charges or spam, please wait 5 minutes before placing another order.',
      retryAfterSeconds: 300,
    });
  },
});

// 3. Anti-Bombing Limiter for Table Reservations
// Max 8 reservations per 15 minutes per IP
export const reservationLimiter = rateLimit({
  ...commonRateLimitOptions,
  windowMs: 15 * 60 * 1000,
  max: 8,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Reservation submission limit reached. Please call the cafe directly if you need multiple immediate bookings.',
      retryAfterSeconds: 450,
    });
  },
});

// 4. Brute-force Limiter for Admin Authentication
// Max 6 attempts per 15 minutes
export const adminAuthLimiter = rateLimit({
  ...commonRateLimitOptions,
  windowMs: 15 * 60 * 1000,
  max: 6,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many failed admin authentication attempts. For security reasons, this endpoint is temporarily locked for 15 minutes.',
      retryAfterSeconds: 900,
    });
  },
});
