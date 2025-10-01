// src/server/api/auth/user.schema.ts
import mongoose from 'mongoose';
import { UserRole } from '@/lib/types';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },

  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
  },

  avatarUrl: {
    type: String,
    default: '',
  },

  enrolledCourseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],

  classIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  }],

  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },

  nationality: {
    type: String,
    required: true,
  },

  educationLevel: {
    type: String,
    required: true,
  },

  university: String,

  address: String,

  phone: String,

  enrolledCourses: [{
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  enrollmentDate: { type: Date },

  approvalDate: { type: Date },

  registrationFeePaid: { type: Boolean, default: false },

  }],
  
  accessLevel: {
    type: String,
    enum: ['limited', 'full'],
    default: 'limited'
  }
  }, {
    timestamps: true,
  });

// Add methods
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.models.User || mongoose.model('User', userSchema);