import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  studentId: mongoose.Types.ObjectId;
  classIds: mongoose.Types.ObjectId[];
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // One assignment record per student
  },
  classIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Class' 
  }],
  assignedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { 
  timestamps: { createdAt: 'assignedAt', updatedAt: 'updatedAt' }
});

// Index for efficient queries
assignmentSchema.index({ studentId: 1 });
assignmentSchema.index({ classIds: 1 });

export const AssignmentModel = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', assignmentSchema);