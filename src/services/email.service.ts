import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

// Email template types
export type EmailTemplate = 'NEW_EMPLOYEE' | 'PASSWORD_RESET' | 'WELCOME';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NewEmployeeEmailData {
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  companyName?: string;
  loginUrl?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (config.smtp.host && config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      this.isConfigured = true;
      logger.info('Email service initialized');
    } else {
      logger.warn('Email service not configured - SMTP settings missing');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn({ to: options.to, subject: options.subject }, 'Email service not configured, email not sent');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
      return true;
    } catch (error) {
      logger.error({ error, to: options.to, subject: options.subject }, 'Failed to send email');
      return false;
    }
  }

  // Generate NEW_EMPLOYEE welcome email
  getNewEmployeeEmail(data: NewEmployeeEmailData): EmailOptions {
    const loginUrl = data.loginUrl || 'http://localhost:3002/login';
    const companyText = data.companyName ? ` at ${data.companyName}` : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AgentCare</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to AgentCare!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #334155; line-height: 1.6;">
                Dear <strong>${data.firstName} ${data.lastName}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; color: #334155; line-height: 1.6;">
                Welcome${companyText}! Your account has been created and you now have access to the AgentCare Back Office system.
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; font-size: 16px; color: #0369a1; font-weight: 600;">Your Login Credentials</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Email:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Temporary Password:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; font-family: monospace; background-color: #fef3c7; padding: 4px 8px; border-radius: 4px; display: inline-block;">${data.temporaryPassword}</td>
                  </tr>
                </table>
              </div>

              <!-- Warning -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Important:</strong> For security reasons, please change your password immediately after your first login.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3);">
                  Login to Your Account
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                If you have any questions or need assistance, please contact your system administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated message from AgentCare. Please do not reply to this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} AgentCare. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
Welcome to AgentCare!

Dear ${data.firstName} ${data.lastName},

Welcome${companyText}! Your account has been created and you now have access to the AgentCare Back Office system.

Your Login Credentials:
- Email: ${data.email}
- Temporary Password: ${data.temporaryPassword}

IMPORTANT: For security reasons, please change your password immediately after your first login.

Login URL: ${loginUrl}

If you have any questions or need assistance, please contact your system administrator.

This is an automated message from AgentCare. Please do not reply to this email.
    `.trim();

    return {
      to: data.email,
      subject: 'Welcome to AgentCare - Your Account Has Been Created',
      html,
      text,
    };
  }

  // Send new employee welcome email
  async sendNewEmployeeEmail(data: NewEmployeeEmailData): Promise<boolean> {
    const emailOptions = this.getNewEmployeeEmail(data);
    return this.sendEmail(emailOptions);
  }

  // Check if email service is configured
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
