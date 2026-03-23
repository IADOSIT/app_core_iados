import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);

  if (err.code === '23505') {
    res.status(409).json({ success: false, message: 'Registro duplicado' });
    return;
  }

  if (err.code === '23503') {
    res.status(400).json({ success: false, message: 'Referencia inválida' });
    return;
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
};
