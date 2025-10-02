// src/server/api/courses/course.schema.ts
import mongoose, { Schema, Types, Document } from 'mongoose';

export type CourseDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  teacherIds: Types.ObjectId[];
  days: CourseDay[];
  startTime?: string;
  endTime?: string;
  imageUrl?: string;
  imageHint?: string;
  levels: string[];
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, required: [true, 'Description is required'] },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  teacherIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  days: [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }],
  startTime: String,
  endTime: String,
  imageUrl: String,
  imageHint: String,
  levels: [{ type: String }],
}, { timestamps: true });

courseSchema.index({ title: 1 });

export const CourseModel = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
