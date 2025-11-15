import express from 'express';
import {
  createEscrowTransaction,
  getEscrowTransaction,
  releaseEscrowToPayout
} from '../controllers/escrowController';

const router = express.Router();

router.post('/create', createEscrowTransaction);
router.get('/:order_id', getEscrowTransaction);
router.post('/:escrow_id/release', releaseEscrowToPayout);

export default router;

