import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  details?: string;
  date: Date;
  imageUrls: string[];  // Array of base64 or URLs
  imageHint?: string;
  isPast?: boolean;  // Can be computed, but stored for simplicity
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, required: [true, 'Description is required'] },
  details: { type: String },
  date: { type: Date, required: [true, 'Date is required'] },
  imageUrls: [{ type: String }],
  imageHint: { type: String },
  isPast: { type: Boolean, default: false },
}, { timestamps: true });

eventSchema.index({ title: 1 });
eventSchema.index({ date: -1 });  // Index for sorting by date

export const EventModel = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);