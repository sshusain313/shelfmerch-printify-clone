import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IAuditLog, AuditAction } from '../types';

const AuditLogSchema = new Schema<IAuditLog>({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  adminId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: Object.values(AuditAction),
    required: true,
    index: true
  },
  targetId: {
    type: String,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  collection: 'audit_logs'
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

