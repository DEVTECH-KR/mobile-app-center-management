import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClass extends Document {
  name: string;
  courseId: Types.ObjectId;
  level?: string;
  teacherId?: Types.ObjectId;
  studentIds: Types.ObjectId[];
}

const classSchema = new Schema<IClass>(
  {
    name: { type: String, required: [true, 'Class name is required'], trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    level: { type: String },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);


classSchema.index({ name: 1 });
classSchema.index({ courseId: 1 });

export const ClassModel = mongoose.models.Class || mongoose.model<IClass>('Class', classSchema);