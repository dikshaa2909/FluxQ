/**
 * 🚀 QUEUE OPTIMIZER REST API
 * Production-ready Express.js server
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { routes } from './routes';
import { errorHandler, requestLogger } from './middleware';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================
// MIDDLEWARE
// ============================================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(requestLogger);

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/v1', routes);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ERROR HANDLER (MUST BE LAST)
// ============================================================

app.use(errorHandler);

// ============================================================
// SERVER STARTUP
// ============================================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     🏥 QUEUE OPTIMIZER REST API                            ║
╚════════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📖 API Documentation: http://localhost:${PORT}/api/v1/docs
🏥 Health Check: http://localhost:${PORT}/health

Environment: ${NODE_ENV}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
