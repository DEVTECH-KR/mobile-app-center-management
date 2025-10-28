// src/server/api/settings/center-settings.service.ts
import CenterSettingsModel from './center-settings.schema';

export class CenterSettingsService {
  static async getSettings() {
    let settings = await CenterSettingsModel.findOne();
    if (!settings) {
      // Create default if none exists
      settings = await CenterSettingsModel.create({
        centerName: 'Default Center',
        address: 'Default Address',
        contactPhone: '000-000-0000',
        contactEmail: 'info@center.com',
        registrationFee: 0,
        enrollmentValidityHours: 48,
        paymentInstructions: 'Please visit the center to pay.',
        emailTemplates: {
          enrollmentRequest: '<h1>Enrollment Request Received</h1><p>Dear {studentName},</p><p>Your enrollment request for {courseName} has been received successfully.</p><p>Please visit our center within {validityHours} hours to pay the registration fee of {registrationFee} and secure your spot.</p><p>Center Address: {centerAddress}</p><p>Contact: {adminContact}</p>',
          enrollmentApproval: '<h1>Enrollment Approved</h1><p>Dear {studentName},</p><p>Your enrollment in {courseName} has been approved!</p><p>You have been assigned to: {className}</p><p>You now have full access to course materials and resources.</p>',
          enrollmentRejection: '<h1>Enrollment Rejected</h1><p>Dear {studentName},</p><p>We regret to inform you that your enrollment request for {courseName} has been rejected.</p><p>Reason: {reason}</p>'
        }
      });
    }
    return settings;
  }

  static async updateSettings(updateData: Partial<typeof CenterSettingsModel>) {
    let settings = await CenterSettingsModel.findOne();
    if (!settings) {
      throw new Error('Center settings not found');
    }
    Object.assign(settings, updateData);
    await settings.save();
    return settings;
  }
}