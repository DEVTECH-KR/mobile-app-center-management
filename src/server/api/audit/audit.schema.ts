// src/server/api/audit/audit.schema.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  performedBy: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: 'Enrollment' | 'Payment' | 'User' | 'Class';
  details: any;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetType: { type: String, required: true },
  details: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);