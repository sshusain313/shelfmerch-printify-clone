import express from 'express';
import {
  getInvoices,
  generateInvoice,
  getInvoice,
  updateInvoice
} from '../controllers/invoiceController';

const router = express.Router();

router.get('/', getInvoices);
router.post('/generate', generateInvoice);
router.get('/:invoice_id', getInvoice);
router.patch('/:invoice_id', updateInvoice);

export default router;

