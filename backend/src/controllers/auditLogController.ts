import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { adminId, action, targetType, startDate, endDate, limit = 100 } = req.query;
    const query: any = {};
    
    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));
    
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const totalLogs = await AuditLog.countDocuments({});
    
    const actionStats = await AuditLog.aggregate([
      { $group: { _id: "$action", count: { $sum: 1 } } }
    ]);
    
    const adminStats = await AuditLog.aggregate([
      { $group: { _id: "$adminId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      totalLogs,
      byAction: actionStats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      topAdmins: adminStats.map((stat: any) => ({
        adminId: stat._id,
        count: stat.count
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

