import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { pool } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Demasiadas solicitudes, intente más tarde' },
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', app: 'core_iados CRM', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// API Routes
app.use('/api/v1', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║       CORE IADOS CRM Backend         ║
  ║  🚀 Servidor corriendo en :${PORT}      ║
  ╚══════════════════════════════════════╝
  `);
});

export default app;
