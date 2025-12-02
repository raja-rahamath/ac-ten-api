import { z } from 'zod';

// Work Order Item Schema (for materials)
const workOrderItemSchema = z.object({
  inventoryItemId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('piece'),
  unitCost: z.number().min(0),
});

// Work Order Labor Schema
const workOrderLaborSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  clockInAt: z.string().datetime(),
  clockOutAt: z.string().datetime().optional(),
  breakMinutes: z.number().int().min(0).default(0),
  travelStartAt: z.string().datetime().optional(),
  arrivedAt: z.string().datetime().optional(),
  hourlyRate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Work Order Checklist Item Schema
const checklistItemSchema = z.object({
  sortOrder: z.number().int().default(0),
  item: z.string().min(1, 'Checklist item text is required'),
  category: z.string().optional(),
  isRequired: z.boolean().default(true),
});

// Work Order Team Member Schema
const teamMemberSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  role: z.enum(['LEAD', 'TECHNICIAN', 'HELPER', 'SUPERVISOR']).default('TECHNICIAN'),
});

// Create Work Order Input
export const createWorkOrderSchema = z.object({
  // Required fields
  serviceRequestId: z.string().min(1, 'Service request ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  title: z.string().min(1, 'Title is required'),
  scheduledDate: z.string().datetime(),

  // Optional fields
  quoteId: z.string().optional(),
  estimateId: z.string().optional(),
  description: z.string().optional(),
  scope: z.string().optional(),
  specialInstructions: z.string().optional(),
  scheduledTime: z.string().optional(), // e.g., "09:00-12:00"
  estimatedDuration: z.number().int().positive().optional(), // in minutes
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('MEDIUM'),

  // Team assignment
  team: z.array(teamMemberSchema).optional(),

  // Materials
  items: z.array(workOrderItemSchema).optional(),

  // Checklists
  checklists: z.array(checklistItemSchema).optional(),
});

// Update Work Order Input
export const updateWorkOrderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  scope: z.string().optional(),
  specialInstructions: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
});

// Create from Quote
export const createFromQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  specialInstructions: z.string().optional(),
  team: z.array(teamMemberSchema).optional(),
});

// Create from Estimate
export const createFromEstimateSchema = z.object({
  estimateId: z.string().min(1, 'Estimate ID is required'),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  specialInstructions: z.string().optional(),
  team: z.array(teamMemberSchema).optional(),
});

// Assign Team
export const assignTeamSchema = z.object({
  team: z.array(teamMemberSchema).min(1, 'At least one team member is required'),
});

// Schedule Work Order
export const scheduleWorkOrderSchema = z.object({
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().int().positive().optional(),
});

// Start En Route
export const startEnRouteSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  notes: z.string().optional(),
});

// Arrive at Site
export const arriveAtSiteSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  notes: z.string().optional(),
});

// Start Work
export const startWorkSchema = z.object({
  notes: z.string().optional(),
});

// Clock In
export const clockInSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  notes: z.string().optional(),
});

// Clock Out
export const clockOutSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  breakMinutes: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

// Complete Checklist Item
export const completeChecklistSchema = z.object({
  checklistId: z.string().min(1, 'Checklist ID is required'),
  isCompleted: z.boolean(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

// Add Material Item
export const addItemSchema = z.object({
  inventoryItemId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('piece'),
  unitCost: z.number().min(0),
  isAdditional: z.boolean().default(true),
});

// Add Photo
export const addPhotoSchema = z.object({
  url: z.string().url('Invalid photo URL'),
  photoType: z.enum(['BEFORE', 'DURING', 'AFTER', 'ISSUE', 'SIGNATURE', 'OTHER']).default('DURING'),
  caption: z.string().optional(),
});

// Complete Work Order
export const completeWorkOrderSchema = z.object({
  workPerformed: z.string().min(1, 'Work performed description is required'),
  technicianNotes: z.string().optional(),
  technicianSignature: z.string().optional(),
  customerSignature: z.string().optional(),
  customerFeedback: z.string().optional(),
  additionalCost: z.number().min(0).default(0),
});

// Put on Hold
export const putOnHoldSchema = z.object({
  reason: z.string().min(1, 'Hold reason is required'),
});

// Resume from Hold
export const resumeFromHoldSchema = z.object({
  notes: z.string().optional(),
});

// Mark Requires Follow-up
export const requiresFollowUpSchema = z.object({
  reason: z.string().min(1, 'Follow-up reason is required'),
  notes: z.string().optional(),
});

// Cancel Work Order
export const cancelWorkOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

// Reschedule Work Order
export const rescheduleWorkOrderSchema = z.object({
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
  reason: z.string().min(1, 'Reschedule reason is required'),
});

// Query params
export const workOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum([
    'PENDING',
    'SCHEDULED',
    'CONFIRMED',
    'EN_ROUTE',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
    'REQUIRES_FOLLOWUP',
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
  serviceRequestId: z.string().optional(),
  customerId: z.string().optional(),
  assignedToId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'scheduledDate', 'workOrderNo', 'priority']).default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Types
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type CreateFromQuoteInput = z.infer<typeof createFromQuoteSchema>;
export type CreateFromEstimateInput = z.infer<typeof createFromEstimateSchema>;
export type AssignTeamInput = z.infer<typeof assignTeamSchema>;
export type ScheduleWorkOrderInput = z.infer<typeof scheduleWorkOrderSchema>;
export type StartEnRouteInput = z.infer<typeof startEnRouteSchema>;
export type ArriveAtSiteInput = z.infer<typeof arriveAtSiteSchema>;
export type StartWorkInput = z.infer<typeof startWorkSchema>;
export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type CompleteChecklistInput = z.infer<typeof completeChecklistSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type AddPhotoInput = z.infer<typeof addPhotoSchema>;
export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;
export type PutOnHoldInput = z.infer<typeof putOnHoldSchema>;
export type ResumeFromHoldInput = z.infer<typeof resumeFromHoldSchema>;
export type RequiresFollowUpInput = z.infer<typeof requiresFollowUpSchema>;
export type CancelWorkOrderInput = z.infer<typeof cancelWorkOrderSchema>;
export type RescheduleWorkOrderInput = z.infer<typeof rescheduleWorkOrderSchema>;
export type WorkOrderQueryInput = z.infer<typeof workOrderQuerySchema>;
