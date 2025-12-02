import { z } from 'zod';

// Notification Types
const notificationTypeEnum = z.enum([
  'REQUEST_CREATED',
  'REQUEST_ASSIGNED',
  'REQUEST_SCHEDULED',
  'REQUEST_STARTED',
  'REQUEST_COMPLETED',
  'QUOTATION_SENT',
  'QUOTATION_APPROVED',
  'INVOICE_SENT',
  'PAYMENT_RECEIVED',
  'SLA_WARNING',
  'SLA_BREACH',
  'APPOINTMENT_REMINDER',
  'APPOINTMENT_CONFIRMATION',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_CANCELLED',
  'TECHNICIAN_ASSIGNED',
  'TECHNICIAN_EN_ROUTE',
  'TECHNICIAN_ARRIVED',
  'WORK_STARTED',
  'WORK_COMPLETED',
  'QUOTE_SENT',
  'PAYMENT_REMINDER',
  'REVIEW_REQUEST',
]);

// Notification Channels
const channelEnum = z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP']);

// Notification Status
const statusEnum = z.enum(['PENDING', 'SCHEDULED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED']);

// Recipient Type
const recipientTypeEnum = z.enum(['CUSTOMER', 'EMPLOYEE', 'USER']);

// Create Notification Template
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  type: notificationTypeEnum,
  channel: channelEnum,
  title: z.string().optional(),
  titleAr: z.string().optional(),
  subject: z.string().optional(),
  subjectAr: z.string().optional(),
  body: z.string().min(1, 'Template body is required'),
  bodyAr: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

// Update Notification Template
export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  titleAr: z.string().optional(),
  subject: z.string().optional(),
  subjectAr: z.string().optional(),
  body: z.string().min(1).optional(),
  bodyAr: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// Send Notification
export const sendNotificationSchema = z.object({
  recipientType: recipientTypeEnum,
  customerId: z.string().optional(),
  employeeId: z.string().optional(),
  userId: z.string().optional(),
  channel: channelEnum,
  type: notificationTypeEnum,
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  templateId: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  subject: z.string().optional(),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => {
    if (data.recipientType === 'CUSTOMER' && !data.customerId) return false;
    if (data.recipientType === 'EMPLOYEE' && !data.employeeId) return false;
    return true;
  },
  { message: 'Recipient ID is required based on recipient type' }
);

// Send Template Notification
export const sendTemplateNotificationSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  recipientType: recipientTypeEnum,
  customerId: z.string().optional(),
  employeeId: z.string().optional(),
  userId: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  variables: z.record(z.string()).optional(), // Template variables like {{customer_name}}
});

// Schedule Appointment Reminder
export const scheduleAppointmentReminderSchema = z.object({
  serviceRequestId: z.string().optional(),
  workOrderId: z.string().optional(),
  customerId: z.string().min(1, 'Customer ID is required'),
  appointmentDate: z.string().datetime(),
  reminderMinutesBefore: z.number().int().positive().default(60), // Default 1 hour before
  channel: channelEnum.default('SMS'),
  message: z.string().optional(), // Custom message, otherwise uses template
});

// Send Bulk Notification
export const sendBulkNotificationSchema = z.object({
  recipientType: recipientTypeEnum,
  recipientIds: z.array(z.string()).min(1, 'At least one recipient is required'),
  channel: channelEnum,
  type: notificationTypeEnum,
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  templateId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

// Mark as Read
export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
});

// Retry Failed Notification
export const retryNotificationSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

// Query params
export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  recipientType: recipientTypeEnum.optional(),
  customerId: z.string().optional(),
  employeeId: z.string().optional(),
  channel: channelEnum.optional(),
  type: notificationTypeEnum.optional(),
  status: statusEnum.optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'scheduledFor', 'sentAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Template Query params
export const templateQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: notificationTypeEnum.optional(),
  channel: channelEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// Types
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type SendTemplateNotificationInput = z.infer<typeof sendTemplateNotificationSchema>;
export type ScheduleAppointmentReminderInput = z.infer<typeof scheduleAppointmentReminderSchema>;
export type SendBulkNotificationInput = z.infer<typeof sendBulkNotificationSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type RetryNotificationInput = z.infer<typeof retryNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type TemplateQueryInput = z.infer<typeof templateQuerySchema>;
