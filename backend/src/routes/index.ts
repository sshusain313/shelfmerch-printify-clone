import express from 'express';
import statusRoutes from './statusRoutes';
import walletRoutes from './walletRoutes';
import escrowRoutes from './escrowRoutes';
import payoutRoutes from './payoutRoutes';
import invoiceRoutes from './invoiceRoutes';
import auditLogRoutes from './auditLogRoutes';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "Hello World" });
});

router.use('/status', statusRoutes);
router.use('/wallets', walletRoutes);
router.use('/escrow', escrowRoutes);
router.use('/payouts', payoutRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;

