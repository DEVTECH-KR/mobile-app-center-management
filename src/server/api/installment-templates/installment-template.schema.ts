// src/server/api/installment-templates/installment-template.schema.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IInstallmentTemplate extends Document {
  courseId: mongoose.Types.ObjectId;
  installments: {
    name: string;
    amountType: 'fixed' | 'percentage';
    amount: number;
    dueOffsetDays: number;
  }[];
}

const installmentTemplateSchema = new Schema<IInstallmentTemplate>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
  installments: [{
    name: { type: String, required: true },
    amountType: { type: String, enum: ['fixed', 'percentage'], required: true },
    amount: { type: Number, required: true },
    dueOffsetDays: { type: Number, required: true },
  }],
}, { timestamps: true });

export const InstallmentTemplateModel = mongoose.models.InstallmentTemplate || mongoose.model<IInstallmentTemplate>('InstallmentTemplate', installmentTemplateSchema);