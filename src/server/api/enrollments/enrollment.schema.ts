// src/server/api/enrollments/enrollment.schema.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  approvalDate?: Date;
  assignedClassId?: mongoose.Types.ObjectId;
  adminNotes?: string;
  registrationFeePaid: boolean;
  paymentDate?: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestDate: { type: Date, default: Date.now },
  approvalDate: Date,
  assignedClassId: { type: Schema.Types.ObjectId, ref: 'Class' },
  adminNotes: String,
  registrationFeePaid: { type: Boolean, default: false },
  paymentDate: Date,
}, { timestamps: true });

// 🔹 Export renommé pour cohérence
export const EnrollmentModel = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
