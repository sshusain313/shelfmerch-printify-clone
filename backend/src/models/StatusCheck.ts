import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IStatusCheck } from '../types';

const StatusCheckSchema = new Schema<IStatusCheck>({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  client_name: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  collection: 'status_checks'
});

export const StatusCheck = mongoose.model<IStatusCheck>('StatusCheck', StatusCheckSchema);

