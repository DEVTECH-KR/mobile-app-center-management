// src/server/api/installment-templates/installment-template.service.ts
import { InstallmentTemplateModel } from './installment-template.schema';
import { Types } from 'mongoose';

export class InstallmentTemplateService {
  static async getByCourse(courseId: string) {
    if (!Types.ObjectId.isValid(courseId)) throw new Error('Invalid course ID');
    return await InstallmentTemplateModel.findOne({ courseId });
  }

  static async updateForCourse(courseId: string, templates: any[]) {
    if (!Types.ObjectId.isValid(courseId)) throw new Error('Invalid course ID');
    return await InstallmentTemplateModel.findOneAndUpdate(
      { courseId },
      { installments: templates },
      { upsert: true, new: true }
    );
  }
}