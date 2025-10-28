// src/server/services/email.service.ts
import nodemailer from "nodemailer";
import { CenterSettingsService } from '@/server/api/settings/center-settings.service';

export class EmailService {
  private static async getTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private static replaceTemplateVars(template: string, vars: Record<string, string>) {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
  }

  static async sendEnrollmentRequestConfirmation(to: string, data: {
    studentName: string;
    courseName: string;
    courseDetails: string;
  }) {
    const settings = await CenterSettingsService.getSettings();
    const transporter = await this.getTransporter();

    const vars = {
      studentName: data.studentName,
      courseName: data.courseName,
      courseDetails: data.courseDetails,
      centerName: settings.centerName || '',
      centerAddress: settings.address || '',
      adminContact: settings.contactEmail || settings.contactPhone || '',
      registrationFee: settings.registrationFee?.toString() || '0',
      validityHours: settings.enrollmentValidityHours.toString(),
    };

    const html = this.replaceTemplateVars(
      settings.emailTemplates?.enrollmentRequest ||
      '<h1>Enrollment Request Received</h1><p>Dear {studentName},</p><p>Your request for {courseName} has been submitted successfully.</p><p>Details: {courseDetails}</p><p>Please visit {centerName} at {centerAddress} within {validityHours} hours to pay the registration fee of {registrationFee} and validate your request.</p><p>Contact: {adminContact}</p>',
      vars
    );

    await transporter.sendMail({
      to,
      subject: 'Enrollment Request Confirmation',
      html,
    });
  }

  static async sendEnrollmentApproval(to: string, data: {
    studentName: string;
    courseName: string;
    className: string;
  }) {
    const settings = await CenterSettingsService.getSettings();
    const transporter = await this.getTransporter();

    const vars = {
      studentName: data.studentName,
      courseName: data.courseName,
      className: data.className,
    };

    const html = this.replaceTemplateVars(
      settings.emailTemplates?.enrollmentApproval ||
      '<h1>Enrollment Approved</h1><p>Dear {studentName},</p><p>Your enrollment in {courseName} has been approved!</p><p>You have been assigned to: {className}</p><p>You now have full access to course materials and resources.</p>',
      vars
    );

    await transporter.sendMail({
      to,
      subject: 'Enrollment Request Approved',
      html,
    });
  }

  static async sendEnrollmentRejection(to: string, data: {
    studentName: string;
    courseName: string;
    reason: string;
    refundInfo?: string; 
  }) {
    const settings = await CenterSettingsService.getSettings();
    const transporter = await this.getTransporter();
    
    const html = `
      <h1>Enrollment Rejected</h1>
      <p>Dear ${data.studentName},</p>
      <p>We regret to inform you that your enrollment request for ${data.courseName} has been rejected.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      ${data.refundInfo ? `<p><strong>Refund Information:</strong> ${data.refundInfo}</p>` : ''}
      <p>If you have any questions, please contact ${settings.contactEmail || settings.contactPhone || 'our support team'}.</p>
    `;

    await transporter.sendMail({
      to,
      subject: 'Enrollment Request Rejected',
      html,
    });
  }

  static async sendRefundNotification(to: string, data: {
    studentName: string;
    courseName: string;
    refundAmount: number;
    reason: string;
  }) {
    const settings = await CenterSettingsService.getSettings();
    const transporter = await this.getTransporter();
    
    const html = `
      <h1>Payment Refund Notification</h1>
      <p>Dear ${data.studentName},</p>
      <p>Your payment for ${data.courseName} has been refunded.</p>
      <p><strong>Refund Amount:</strong> ${data.refundAmount} FBU</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>The refund will be processed to your original payment method within 7-14 business days.</p>
      <p>If you have any questions, please contact ${settings.contactEmail || settings.contactPhone || 'our support team'}.</p>
    `;

    await transporter.sendMail({
      to,
      subject: 'Payment Refund Processed',
      html,
    });
  }

  static async sendEnrollmentExpiration(to: string, data: {
    studentName: string;
    courseName: string;
    validityHours: number;
  }) {
    const settings = await CenterSettingsService.getSettings();
    const transporter = await this.getTransporter();

    const html = `
      <h1>Enrollment Request Expired</h1>
      <p>Dear ${data.studentName},</p>
      <p>Your enrollment request for ${data.courseName} has expired because the registration fee was not paid within ${data.validityHours} hours.</p>
      <p>You can submit a new enrollment request if you're still interested in this course.</p>
      <p>If you have any questions, please contact ${settings.contactEmail || settings.contactPhone || 'our support team'}.</p>
    `;

    await transporter.sendMail({
      to,
      subject: 'Enrollment Request Expired',
      html,
    });
  }

}