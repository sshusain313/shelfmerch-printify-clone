import express from 'express';
import {
  getPayouts,
  requestPayout,
  updatePayoutStatus
} from '../controllers/payoutController';

const router = express.Router();

router.get('/', getPayouts);
router.post('/request', requestPayout);
router.patch('/:payout_id/status', updatePayoutStatus);

export default router;

