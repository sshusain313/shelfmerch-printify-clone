import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuditAction } from '../types';

export const createAuditLog = async (
  adminId: string,
  action: AuditAction,
  targetId: string,
  targetType: string,
  details: Record<string, any>,
  request: Request
) => {
  const auditLog = new AuditLog({
    adminId,
    action,
    targetId,
    targetType,
    details,
    ipAddress: request.ip || request.socket.remoteAddress || null,
    userAgent: request.headers['user-agent'] || null,
    timestamp: new Date()
  });
  
  await auditLog.save();
  return auditLog;
};

