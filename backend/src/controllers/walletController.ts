import { Request, Response } from 'express';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { IWalletCreditDebit, TransactionType, TransactionCategory, BalanceAffected } from '../types';
import { createAuditLog } from '../utils/auditLog';

export const getWallets = async (req: Request, res: Response) => {
  try {
    const { userId, storeId, storeType } = req.query;
    const query: any = {};
    
    if (userId) query.userId = userId;
    if (storeId) query.storeId = storeId;
    if (storeType) query.storeType = storeType;
    
    const wallets = await Wallet.find(query).limit(1000);
    res.json(wallets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { storeId } = req.query;
    
    const query: any = { userId };
    if (storeId) query.storeId = storeId;
    
    const wallet = await Wallet.findOne(query);
    if (!wallet) {
      return res.json({
        balance: 0.0,
        payoutBalance: 0.0,
        pendingPayoutBalance: 0.0,
        lifetimeEarnings: 0.0,
        currency: "USD"
      });
    }
    
    res.json({
      balance: wallet.balance || 0.0,
      payoutBalance: wallet.payoutBalance || 0.0,
      pendingPayoutBalance: wallet.pendingPayoutBalance || 0.0,
      lifetimeEarnings: wallet.lifetimeEarnings || 0.0,
      currency: wallet.currency || "USD"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const creditWallet = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const creditData: IWalletCreditDebit = req.body;
    
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0.0
      });
      await wallet.save();
    }
    
    const balanceBefore = wallet.balance;
    const newBalance = balanceBefore + creditData.amount;
    
    wallet.balance = newBalance;
    wallet.updatedAt = new Date();
    await wallet.save();
    
    const transaction = new WalletTransaction({
      walletId: wallet.id,
      userId,
      storeId: wallet.storeId,
      category: creditData.category || TransactionCategory.ADJUSTMENT,
      type: TransactionType.CREDIT,
      amount: creditData.amount,
      balanceBefore,
      balanceAfter: newBalance,
      description: creditData.description,
      adminId: creditData.adminId,
      completedAt: new Date()
    });
    await transaction.save();
    
    await createAuditLog(
      creditData.adminId,
      'wallet_credit' as any,
      wallet.id,
      'wallet',
      {
        userId,
        amount: creditData.amount,
        description: creditData.description,
        newBalance
      },
      req
    );
    
    res.json({ success: true, newBalance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const debitWallet = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const debitData: IWalletCreditDebit = req.body;
    
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ success: false, error: "Wallet not found" });
    }
    
    if (wallet.balance < debitData.amount) {
      return res.status(400).json({ success: false, error: "Insufficient balance" });
    }
    
    const balanceBefore = wallet.balance;
    const newBalance = balanceBefore - debitData.amount;
    
    wallet.balance = newBalance;
    wallet.updatedAt = new Date();
    await wallet.save();
    
    const transaction = new WalletTransaction({
      walletId: wallet.id,
      userId,
      storeId: wallet.storeId,
      category: debitData.category || TransactionCategory.ADJUSTMENT,
      type: TransactionType.DEBIT,
      amount: debitData.amount,
      balanceBefore,
      balanceAfter: newBalance,
      description: debitData.description,
      adminId: debitData.adminId,
      completedAt: new Date()
    });
    await transaction.save();
    
    await createAuditLog(
      debitData.adminId,
      'wallet_debit' as any,
      wallet.id,
      'wallet',
      {
        userId,
        amount: debitData.amount,
        description: debitData.description,
        newBalance
      },
      req
    );
    
    res.json({ success: true, newBalance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getWalletTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, storeId, affectsBalance } = req.query;
    
    const query: any = { userId };
    if (category) query.category = category;
    if (storeId) query.storeId = storeId;
    if (affectsBalance) query.affectsBalance = affectsBalance;
    
    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);
    
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePayoutSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { storeId } = req.query;
    const settings = req.body;
    
    const query: any = { userId };
    if (storeId) query.storeId = storeId;
    
    const wallet = await Wallet.findOneAndUpdate(
      query,
      {
        $set: {
          payoutSettings: settings,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!wallet) {
      return res.status(404).json({ success: false, error: "Wallet not found" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

