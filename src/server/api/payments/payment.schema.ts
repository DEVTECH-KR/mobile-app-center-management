// src/server/api/payments/payment.schema.ts

import mongoose, { Schema, Document } from 'mongoose';
import { 
  PaymentStatus, 
  InstallmentStatus,
  AmountType 
} from '@/lib/types/payment.types';

export interface IInstallment {
  name: string;
  amountType: 'fixed' | 'percentage';
  amount: number;
  status: InstallmentStatus;
  dueDate: Date;
  paymentDate?: Date;
  refundDate?: Date;
  isInitialFee: boolean; 
}

export interface IPayment extends Document {
  enrollmentId?: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  registrationFee: number;
  totalDue: number;
  totalPaid: number;
  paymentStatus: PaymentStatus;
  refundReason?: string;
  refundDate?: Date;
  refundedBy?: mongoose.Types.ObjectId;
  installments: IInstallment[];
  createdAt: Date;
  updatedAt: Date;
}

const installmentSchema = new Schema<IInstallment>({
  name: { type: String, required: true },
  amountType: { 
    type: String, 
    enum: Object.values(AmountType), 
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: Object.values(InstallmentStatus), 
    default: InstallmentStatus.UNPAID 
  },
  dueDate: { type: Date, required: true },
  paymentDate: { type: Date },
  refundDate: { type: Date },
  isInitialFee: { type: Boolean, default: false } 
}, { _id: false });

const paymentSchema = new Schema<IPayment>({
  enrollmentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    index: true 
  },
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  registrationFee: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  totalDue: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  totalPaid: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  paymentStatus: { 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING 
  },
  refundReason: { type: String },
  refundDate: { type: Date },
  refundedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  installments: [installmentSchema],
}, { 
  timestamps: true 
});

// ✅ Index composé pour performances
paymentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
paymentSchema.index({ enrollmentId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ 'installments.status': 1 });

export const PaymentModel = mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);