import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './clients.routes';
import licenseRoutes from './licenses.routes';
import paymentRoutes from './payments.routes';
import invoiceRoutes from './invoices.routes';
import productRoutes from './products.routes';
import versionRoutes from './versions.routes';
import expenseRoutes from './expenses.routes';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './users.routes';
import notificationRoutes from './notifications.routes';
import publicRoutes from './public.routes';
import maintenanceRoutes from './maintenance.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/licenses', licenseRoutes);
router.use('/payments', paymentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/products', productRoutes);
router.use('/versions', versionRoutes);
router.use('/expenses', expenseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

// Rutas públicas para sistemas externos (sin JWT)
router.use('/public', publicRoutes);
router.use('/maintenance', maintenanceRoutes);

export default router;
