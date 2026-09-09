import type { Request, Response } from 'express';
import { app } from '../server/app.js';

/**
 * Vercel Serverless Function Handler
 * Automatically handles API routes (/api/*) in Vercel's serverless environment.
 */
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
