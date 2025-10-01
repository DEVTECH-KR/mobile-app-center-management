// src/server/api/settings/center-settings.schema.ts
import mongoose from 'mongoose';

const centerSettingsSchema = new mongoose.Schema({
  centerName: String,
  address: String,
  contactPhone: String,
  contactEmail: String,
  registrationFee: Number,
  enrollmentValidityHours: {
    type: Number,
    default: 48
  },
  paymentInstructions: String,
  emailTemplates: {
    enrollmentRequest: String,
    enrollmentApproval: String,
    enrollmentRejection: String
  }
}, {
  timestamps: true
});

export default mongoose.models.CenterSettings || mongoose.model('CenterSettings', centerSettingsSchema);