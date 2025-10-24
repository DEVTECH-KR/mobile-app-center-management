import { ActivityLogModel } from './activity-log.schema';

export class ActivityLogController {
  static async getAll(req: any, res: any) {
    const logs = await ActivityLogModel.find()
      .populate('performedBy', 'name email role')
      .populate('affectedUser', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  }
}
