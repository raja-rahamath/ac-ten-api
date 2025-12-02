import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

// Email template types
export type EmailTemplate = 'NEW_EMPLOYEE' | 'PASSWORD_RESET' | 'WELCOME' | 'ZONE_HEAD_TASKS';

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

interface ZoneHeadTasksEmailData {
  zoneHeadName: string;
  zoneName: string;
  date: string;
  dateLabel: string; // "Today" or "Tomorrow" or actual date
  appointments: Array<{
    time: string;
    requestNo: string;
    title: string;
    customerName: string;
    customerPhone?: string;
    propertyName?: string;
    propertyAddress?: string;
    priority: string;
    notes?: string;
  }>;
  backOfficeUrl?: string;
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

  // Generate ZONE_HEAD_TASKS notification email
  getZoneHeadTasksEmail(data: ZoneHeadTasksEmailData, toEmail: string): EmailOptions {
    const backOfficeUrl = data.backOfficeUrl || 'http://localhost:3002';

    const getPriorityColor = (priority: string) => {
      switch (priority.toUpperCase()) {
        case 'EMERGENCY': return '#dc2626';
        case 'HIGH': return '#f97316';
        case 'MEDIUM': return '#eab308';
        default: return '#22c55e';
      }
    };

    const appointmentsHtml = data.appointments.map((apt) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; width: 80px; vertical-align: top;">
          <span style="font-weight: 600; color: #0ea5e9; font-size: 14px;">${apt.time || 'TBD'}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; background-color: ${getPriorityColor(apt.priority)}; color: white; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">${apt.priority}</span>
            <span style="font-weight: 600; color: #1e293b;">${apt.requestNo}</span>
          </div>
          <div style="font-size: 14px; color: #334155; margin-bottom: 6px;">${apt.title}</div>
          <div style="font-size: 13px; color: #64748b;">
            <strong>Customer:</strong> ${apt.customerName}${apt.customerPhone ? ` - <a href="tel:${apt.customerPhone}" style="color: #0ea5e9;">${apt.customerPhone}</a>` : ''}
          </div>
          ${apt.propertyName || apt.propertyAddress ? `
          <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
            <strong>Location:</strong> ${apt.propertyName || ''}${apt.propertyAddress ? ` - ${apt.propertyAddress}` : ''}
          </div>
          ` : ''}
          ${apt.notes ? `
          <div style="font-size: 13px; color: #64748b; margin-top: 4px; padding: 8px; background-color: #f8fafc; border-radius: 4px; font-style: italic;">
            ${apt.notes}
          </div>
          ` : ''}
        </td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scheduled Tasks for ${data.dateLabel}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 650px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Scheduled Tasks for ${data.dateLabel}</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${data.date} | ${data.zoneName} Zone</p>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 24px 40px;">
              <p style="margin: 0; font-size: 16px; color: #334155;">
                Hello <strong>${data.zoneHeadName}</strong>,
              </p>
              <p style="margin: 16px 0 0; font-size: 15px; color: #475569; line-height: 1.6;">
                You have <strong style="color: #0ea5e9;">${data.appointments.length} appointment${data.appointments.length !== 1 ? 's' : ''}</strong> scheduled for ${data.dateLabel.toLowerCase()} in your zone. Please review the details below:
              </p>
            </td>
          </tr>

          <!-- Appointments Table -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #e2e8f0;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Time</th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Task Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointmentsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="${backOfficeUrl}/requests" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3);">
                View All Tasks in Back Office
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated notification from AgentCare. Please do not reply to this email.
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

    const appointmentsText = data.appointments.map((apt, idx) => `
${idx + 1}. [${apt.priority}] ${apt.requestNo} - ${apt.title}
   Time: ${apt.time || 'TBD'}
   Customer: ${apt.customerName}${apt.customerPhone ? ` (${apt.customerPhone})` : ''}
   ${apt.propertyName || apt.propertyAddress ? `Location: ${apt.propertyName || ''} ${apt.propertyAddress || ''}` : ''}
   ${apt.notes ? `Notes: ${apt.notes}` : ''}
    `.trim()).join('\n\n');

    const text = `
Scheduled Tasks for ${data.dateLabel}
${data.date} | ${data.zoneName} Zone
====================================

Hello ${data.zoneHeadName},

You have ${data.appointments.length} appointment(s) scheduled for ${data.dateLabel.toLowerCase()} in your zone:

${appointmentsText}

---
View all tasks: ${backOfficeUrl}/requests

This is an automated notification from AgentCare.
    `.trim();

    return {
      to: toEmail,
      subject: `[AgentCare] ${data.appointments.length} Task${data.appointments.length !== 1 ? 's' : ''} Scheduled for ${data.dateLabel} - ${data.zoneName} Zone`,
      html,
      text,
    };
  }

  // Send zone head tasks notification email
  async sendZoneHeadTasksEmail(data: ZoneHeadTasksEmailData, toEmail: string): Promise<boolean> {
    const emailOptions = this.getZoneHeadTasksEmail(data, toEmail);
    return this.sendEmail(emailOptions);
  }

  // Check if email service is configured
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
