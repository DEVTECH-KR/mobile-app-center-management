import nodemailer from "nodemailer"

export class EmailService {
  private static async getTransporter() {
    // Configure for your email provider
    return nodemailer.createTransport({
      // Add your email service configuration here
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  static async sendEnrollmentRequestConfirmation(to: string, data: {
    studentName: string;
    courseName: string;
    centerAddress: string;
    adminContact: string;
  }) {
    const transporter = await this.getTransporter();
    
    await transporter.sendMail({
      to,
      subject: 'Enrollment Request Confirmation',
      html: `
        <h1>Enrollment Request Received</h1>
        <p>Dear ${data.studentName},</p>
        <p>Your enrollment request for ${data.courseName} has been received successfully.</p>
        <p>Please visit our center within 48 hours to pay the registration fee and secure your spot.</p>
        <p>Center Address: ${data.centerAddress}</p>
        <p>Contact: ${data.adminContact}</p>
      `
    });
  }

  static async sendEnrollmentApproval(to: string, data: {
    studentName: string;
    courseName: string;
    className: string;
  }) {
    const transporter = await this.getTransporter();
    
    await transporter.sendMail({
      to,
      subject: 'Enrollment Request Approved',
      html: `
        <h1>Enrollment Approved</h1>
        <p>Dear ${data.studentName},</p>
        <p>Your enrollment in ${data.courseName} has been approved!</p>
        <p>You have been assigned to: ${data.className}</p>
        <p>You now have full access to course materials and resources.</p>
      `
    });
  }
}