import mongoose from 'mongoose';

const enrollmentRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: Date,
  assignedClassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  adminNotes: String,
  registrationFeePaid: {
    type: Boolean,
    default: false
  },
  paymentDate: Date,
}, {
  timestamps: true
});

export default mongoose.models.Enrollment || mongoose.model('Enrollement', enrollmentRequestSchema);