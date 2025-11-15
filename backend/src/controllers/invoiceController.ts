import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { IInvoiceCreate, IInvoiceUpdate, InvoiceStatus } from '../types';
import { createAuditLog } from '../utils/auditLog';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { buyerId, sellerId, status, orderId } = req.query;
    const query: any = {};
    
    if (buyerId) query.buyerId = buyerId;
    if (sellerId) query.sellerId = sellerId;
    if (status) query.status = status;
    if (orderId) query.orderId = orderId;
    
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);
    
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceData: IInvoiceCreate = req.body;
    const adminId = (req.query.adminId as string) || "system";
    
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    await createAuditLog(
      adminId,
      'invoice_create' as any,
      invoice.id,
      'invoice',
      {
        orderId: invoice.orderId,
        buyerId: invoice.buyerId,
        sellerId: invoice.sellerId,
        total: invoice.total
      },
      req
    );
    
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { invoice_id } = req.params;
    const invoice = await Invoice.findOne({ id: invoice_id });
    
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { invoice_id } = req.params;
    const updateData: IInvoiceUpdate = req.body;
    const adminId = (req.query.adminId as string) || "system";
    
    const invoice = await Invoice.findOne({ id: invoice_id });
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }
    
    const oldStatus = invoice.status;
    
    invoice.status = updateData.status;
    await invoice.save();
    
    await createAuditLog(
      adminId,
      'invoice_update' as any,
      invoice_id,
      'invoice',
      {
        oldStatus,
        newStatus: updateData.status,
        orderId: invoice.orderId
      },
      req
    );
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

