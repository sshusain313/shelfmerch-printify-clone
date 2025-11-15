import express from 'express';
import {
  getWallets,
  getWalletBalance,
  creditWallet,
  debitWallet,
  getWalletTransactions,
  updatePayoutSettings
} from '../controllers/walletController';

const router = express.Router();

router.get('/', getWallets);
router.get('/:userId/balance', getWalletBalance);
router.post('/:userId/credit', creditWallet);
router.post('/:userId/debit', debitWallet);
router.get('/:userId/transactions', getWalletTransactions);
router.patch('/:userId/payout-settings', updatePayoutSettings);

export default router;

