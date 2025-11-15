import { Request, Response } from 'express';
import { Payout } from '../models/Payout';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { IPayoutCreate, PayoutMethod, PayoutStatus, TransactionCategory, TransactionType, BalanceAffected } from '../types';

export const getPayouts = async (req: Request, res: Response) => {
  try {
    const { userId, storeId, status } = req.query;
    const query: any = {};
    
    if (userId) query.userId = userId;
    if (storeId) query.storeId = storeId;
    if (status) query.status = status;
    
    const payouts = await Payout.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);
    
    res.json(payouts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestPayout = async (req: Request, res: Response) => {
  try {
    const payoutData: IPayoutCreate = req.body;
    const { userId, storeId } = req.query;
    
    if (!userId || !storeId) {
      return res.status(400).json({ success: false, error: "userId and storeId are required" });
    }
    
    const wallet = await Wallet.findOne({ userId: userId as string, storeId: storeId as string });
    if (!wallet) {
      return res.status(404).json({ success: false, error: "Wallet not found" });
    }
    
    const minPayout = wallet.payoutSettings?.minimumPayoutAmount || 25.0;
    if (payoutData.amount < minPayout) {
      return res.status(400).json({ success: false, error: `Minimum payout amount is $${minPayout}` });
    }
    
    const currentPayoutBalance = wallet.payoutBalance || 0.0;
    if (currentPayoutBalance < payoutData.amount) {
      return res.status(400).json({ success: false, error: "Insufficient payout balance" });
    }
    
    const payout = new Payout({
      userId: userId as string,
      storeId: storeId as string,
      amount: payoutData.amount,
      payoutMethod: payoutData.payoutMethod,
      bankAccount: payoutData.payoutMethod === PayoutMethod.BANK_TRANSFER 
        ? wallet.payoutSettings?.bankAccount || null 
        : null,
      scheduledDate: new Date()
    });
    await payout.save();
    
    const newPayoutBalance = currentPayoutBalance - payoutData.amount;
    wallet.payoutBalance = newPayoutBalance;
    wallet.updatedAt = new Date();
    await wallet.save();
    
    const transaction = new WalletTransaction({
      walletId: wallet.id,
      userId: userId as string,
      storeId: storeId as string,
      category: TransactionCategory.PAYOUT,
      type: TransactionType.DEBIT,
      amount: payoutData.amount,
      balanceBefore: currentPayoutBalance,
      balanceAfter: newPayoutBalance,
      affectsBalance: BalanceAffected.PAYOUT,
      payoutId: payout.id,
      description: `Payout to ${payoutData.payoutMethod}`,
      completedAt: new Date()
    });
    await transaction.save();
    
    res.json({ success: true, payoutId: payout.payoutId, newPayoutBalance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePayoutStatus = async (req: Request, res: Response) => {
  try {
    const { payout_id } = req.params;
    const { status, failureReason } = req.body;
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === PayoutStatus.PROCESSING) {
      updateData.processedDate = new Date();
    } else if (status === PayoutStatus.COMPLETED) {
      updateData.completedDate = new Date();
    } else if (status === PayoutStatus.FAILED) {
      updateData.failureReason = failureReason;
    }
    
    const payout = await Payout.findOneAndUpdate(
      { payoutId: payout_id },
      { $set: updateData },
      { new: true }
    );
    
    if (!payout) {
      return res.status(404).json({ success: false, error: "Payout not found" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

