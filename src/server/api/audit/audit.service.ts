// src/server/api/audit/audit.service.ts
import { AuditLogModel } from './audit.schema';

export class AuditService {
  static async logAction(action: string, performedBy: string, targetId: string, targetType: string, details?: any) {
    await AuditLogModel.create({
      action,
      performedBy,
      targetId,
      targetType,
      details,
    });
  }

  static async getLogs(filter: { targetType?: string; action?: string; performedBy?: string } = {}, page = 1, limit = 20) {
    const query: any = filter;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLogModel.countDocuments(query),
    ]);

    return { logs, total, page, limit };
  }
}