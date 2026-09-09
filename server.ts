import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.js';
import { generalApiLimiter } from './server/middleware/rateLimiter.js';
import { sanitizeInputs } from './server/middleware/sanitize.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust reverse proxy (nginx / Cloud Run) for accurate IP resolution and rate-limiting
  app.set('trust proxy', 1);

  // Middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Anti-XSS and input sanitization
  app.use(sanitizeInputs);

  // General rate limiter on API routes to protect against DDoS
  app.use('/api', generalApiLimiter);

  // Mount API endpoints
  app.use('/api', apiRouter);

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', cafe: 'Out of the Town - Restro and Bakery', timestamp: new Date().toISOString() });
  });

  // Vite middleware in development vs static bundle in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cafe application server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
