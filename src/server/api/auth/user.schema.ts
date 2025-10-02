// src/server/api/auth/user.schema.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  avatarUrl?: string;
  enrolledCourseIds: mongoose.Types.ObjectId[];
  classIds: mongoose.Types.ObjectId[];
  gender: 'male' | 'female' | 'other';
  nationality: string;
  educationLevel: string;
  university?: string;
  address?: string;
  phone?: string;
  enrolledCourses: {
    courseId: mongoose.Types.ObjectId;
    classId: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    enrollmentDate?: Date;
    approvalDate?: Date;
    registrationFeePaid?: boolean;
  }[];
  accessLevel: 'limited' | 'full';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'fr' | 'en';
  };
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  avatarUrl: { type: String, default: '' },
  enrolledCourseIds: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  classIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  nationality: { type: String, required: true },
  educationLevel: { type: String, required: true },
  university: String,
  address: String,
  phone: String,
  enrolledCourses: [{
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    enrollmentDate: Date,
    approvalDate: Date,
    registrationFeePaid: { type: Boolean, default: false },
  }],
  accessLevel: { type: String, enum: ['limited', 'full'], default: 'limited' },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, enum: ['fr', 'en'], default: 'fr' }
  }
}, { timestamps: true });

// Supprime password dans le JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ✅ Modèle Mongoose
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
