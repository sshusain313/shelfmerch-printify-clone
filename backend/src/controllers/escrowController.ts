import { Request, Response } from 'express';
import { EscrowTransaction } from '../models/EscrowTransaction';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { IEscrowTransaction, TransactionCategory, TransactionType, BalanceAffected, PayoutStatusEnum } from '../types';

export const createEscrowTransaction = async (req: Request, res: Response) => {
  try {
    const escrowData: IEscrowTransaction = req.body;
    const escrow = new EscrowTransaction(escrowData);
    await escrow.save();
    res.json({ success: true, escrowId: escrow.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEscrowTransaction = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;
    const escrow = await EscrowTransaction.findOne({ orderId: order_id });
    
    if (!escrow) {
      return res.status(404).json({ error: "Escrow transaction not found" });
    }
    
    res.json(escrow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const releaseEscrowToPayout = async (req: Request, res: Response) => {
  try {
    const { escrow_id } = req.params;
    const escrow = await EscrowTransaction.findOne({ id: escrow_id });
    
    if (!escrow) {
      return res.status(404).json({ success: false, error: "Escrow not found" });
    }
    
    const wallet = await Wallet.findOne({
      userId: escrow.userId,
      storeId: escrow.storeId
    });
    
    let newPayoutBalance = 0.0;
    
    if (wallet) {
      const currentPayoutBalance = wallet.payoutBalance || 0.0;
      const currentPendingPayout = wallet.pendingPayoutBalance || 0.0;
      newPayoutBalance = currentPayoutBalance + escrow.storePayout;
      const newLifetimeEarnings = (wallet.lifetimeEarnings || 0.0) + escrow.storePayout;
      
      wallet.payoutBalance = newPayoutBalance;
      wallet.pendingPayoutBalance = currentPendingPayout - escrow.storePayout;
      wallet.lifetimeEarnings = newLifetimeEarnings;
      wallet.updatedAt = new Date();
      await wallet.save();
      
      const transaction = new WalletTransaction({
        walletId: wallet.id,
        userId: escrow.userId,
        storeId: escrow.storeId,
        category: TransactionCategory.CUSTOMER_PAYMENT,
        type: TransactionType.CREDIT,
        amount: escrow.storePayout,
        balanceBefore: currentPayoutBalance,
        balanceAfter: newPayoutBalance,
        affectsBalance: BalanceAffected.PAYOUT,
        orderId: escrow.orderId,
        escrowTransactionId: escrow_id,
        description: `Payout from order ${escrow.orderId}`,
        completedAt: new Date()
      });
      await transaction.save();
    }
    
    escrow.payoutStatus = PayoutStatusEnum.RELEASED;
    escrow.releasedToPayoutAt = new Date();
    escrow.updatedAt = new Date();
    await escrow.save();
    
    res.json({ success: true, newPayoutBalance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

