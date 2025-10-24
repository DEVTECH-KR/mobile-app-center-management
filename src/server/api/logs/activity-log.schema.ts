import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  actionType: 'create' | 'update' | 'delete' | 'assign' | 'remove' | 'login' | 'logout';
  performedBy: mongoose.Types.ObjectId; 
  affectedUser?: mongoose.Types.ObjectId; 
  details: string; 
  targetCollection: string; 
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const activityLogSchema = new Schema<IActivityLog>({
  actionType: { type: String, required: true, enum: ['create', 'update', 'delete', 'assign', 'remove', 'login', 'logout'] },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  affectedUser: { type: Schema.Types.ObjectId, ref: 'User' },
  details: { type: String, required: true },
  targetCollection: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String,
});

activityLogSchema.index({ timestamp: -1 });
export const ActivityLogModel = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
