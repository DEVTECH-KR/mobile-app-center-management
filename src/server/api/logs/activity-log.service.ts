import { ActivityLogModel } from './activity-log.schema';

export class ActivityLogService {
  static async record({
    actionType,
    performedBy,
    affectedUser,
    details,
    collection,
    ipAddress,
    userAgent
  }: {
    actionType: 'create' | 'update' | 'delete' | 'assign' | 'remove' | 'login' | 'logout';
    performedBy: string;
    affectedUser?: string;
    details: string;
    collection: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await ActivityLogModel.create({
      actionType,
      performedBy,
      affectedUser,
      details,
      collection,
      ipAddress,
      userAgent,
    });
  }
}
