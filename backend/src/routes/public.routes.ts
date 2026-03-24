/**
 * Rutas públicas — Sin autenticación JWT.
 * Para validación de licencias desde sistemas externos.
 * CORS abierto para estos endpoints específicamente.
 */
import { Router } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { validateLicense, licenseHeartbeat, getPublicProducts } from '../controllers/public.controller';

const router = Router();

// CORS abierto: los sistemas externos son de otros dominios
router.use(cors({ origin: '*' }));

// Rate limiting específico para endpoints públicos (más estricto)
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minuto
  max: 60,                   // 60 req/min por IP
  message: { valid: false, error: 'Demasiadas solicitudes' },
});

router.use(publicLimiter);

// Validar licencia por clave
router.get('/licenses/validate/:key', validateLicense);

// Heartbeat periódico desde el sistema externo
router.post('/licenses/heartbeat', licenseHeartbeat);

// Productos públicos
router.get('/products', getPublicProducts);

export default router;
