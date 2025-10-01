// src/server/api/courses/course.schema.ts
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
  },

  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },

  teacherIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  days: [{
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  }],

  startTime: String,

  endTime: String,

  imageUrl: {
    type: String,
    required: false,
  },
  imageHint: {
    type: String,
    required: false,
  },

  levels: [String],
}, {
  timestamps: true,
});

courseSchema.index({ title: 1 });

export default mongoose.models.Course || mongoose.model('Course', courseSchema);