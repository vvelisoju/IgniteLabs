// Types and validation schemas for client-side components
import { z } from 'zod';
import { Decimal } from 'decimal.js';

// Re-export types from prisma client
import {
  users,
  leads,
  students,
  payments,
  batches,
  assignments,
  courses,
  tenants,
  follow_ups,
  follow_up_comments,
  settings
} from '../generated/prisma';

// Define enums exactly as they appear in prisma schema
export const user_role = {
  admin: 'admin',
  manager: 'manager',
  trainer: 'trainer',
  student: 'student'
} as const;

export const lead_status = {
  new: 'new',
  contacted: 'contacted',
  qualified: 'qualified',
  dropped: 'dropped',
  converted: 'converted'
} as const;

export const payment_method = {
  cash: 'cash',
  check: 'check',
  bank_transfer: 'bank_transfer',
  online: 'online',
  other: 'other'
} as const;

export const assignment_status = {
  pending: 'pending',
  submitted: 'submitted',
  reviewed: 'reviewed',
  approved: 'approved',
  rejected: 'rejected'
} as const;

// Re-export types with appropriate names
export type User = users;
export type Lead = leads;
export type Student = students;
export type Payment = payments;
export type Batch = batches;
export type Assignment = assignments;
export type Course = courses;
export type AssignmentSubmission = any; // Define actual type based on schema
export type CourseContent = any; // Define actual type based on schema
export type Tenant = tenants;
export type FollowUp = follow_ups;
export type FollowUpComment = follow_up_comments;
export type Setting = settings;

// Re-export enums
export { user_role as userRoleEnum };
export { lead_status as leadStatusEnum };
export { payment_method as paymentMethodEnum };

// Define content type enum equivalent
export const contentTypeEnum = {
  TEXT: 'text',
  CODE: 'code',
  MARKDOWN: 'markdown',
  IMAGE: 'image',
  VIDEO: 'video',
  FILE: 'file',
  LINK: 'link'
};

// Login and registration validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' })
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(1, { message: 'Name is required' }),
  role: z.enum(['admin', 'manager', 'trainer', 'student'])
});

export type RegisterData = z.infer<typeof registerSchema>;

// Batch related schemas
export const insertBatchSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  trainer_id: z.number().optional(),
  fee: z.string().or(z.number()).transform(val => new Decimal(String(val))),
  capacity: z.number().optional(),
  tenant_id: z.number().optional()
});

export type InsertBatch = z.infer<typeof insertBatchSchema>;

// Student related schema
export const insertStudentSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Valid email is required' }).optional().or(z.literal('')),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  parent_mobile: z.string().optional(),
  alternate_phone: z.string().optional(),
  batch_id: z.number().optional(),
  enrollment_date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  fee_total: z.string().or(z.number()).transform(val => new Decimal(String(val))),
  converted_from_lead_id: z.number().optional(),
  status: z.string().default('active'),
  tenant_id: z.number().optional()
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;

// Assignment related schemas
export const insertAssignmentSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  due_date: z.coerce.date().optional(),
  batch_id: z.number().optional(),
  course_id: z.number().optional(),
  points: z.number().optional(),
  is_active: z.boolean().optional().default(true)
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

// Course related schemas
export const insertCourseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  batch_id: z.number().optional(),
  is_active: z.boolean().optional().default(true)
});

export const insertCourseContentSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().optional(),
  course_id: z.number(),
  content_type: z.string().default('text'),
  order: z.number().optional()
});

export const insertLessonPlanSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().optional(),
  course_id: z.number(),
  day_number: z.number(),
  order: z.number().optional()
});

export const insertDailyCourseContentSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().optional(),
  course_id: z.number(),
  day_number: z.number(),
  content_type: z.string().default('text'),
  order: z.number().optional()
});

// Code snippet schema
export const insertCodeSnippetSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  code: z.string().min(1, { message: 'Code is required' }),
  language: z.string().optional(),
  description: z.string().optional(),
  user_id: z.number().optional()
});

export type InsertCodeSnippet = z.infer<typeof insertCodeSnippetSchema>;

// Lead related schemas
export const insertLeadSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }).optional().or(z.literal('')),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  source: z.string().optional().or(z.literal('')),
  course: z.string().optional().or(z.literal('')),
  status: z.enum(['new', 'contacted', 'qualified', 'dropped', 'converted']).default('new'),
  notes: z.string().optional().or(z.literal('')),
  assigned_to: z.number().optional().nullable()
});

export type InsertLead = z.infer<typeof insertLeadSchema>;

// Payment related schemas
export const insertPaymentSchema = z.object({
  student_id: z.number(),
  amount: z.string().or(z.number()).transform(val => new Decimal(String(val))),
  payment_date: z.coerce.date().default(() => new Date()),
  payment_method: z.enum(['cash', 'check', 'bank_transfer', 'online', 'other']).default('cash'),
  reference: z.string().optional(),
  notes: z.string().optional()
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Follow-up related schemas
export const insertFollowUpSchema = z.object({
  lead_id: z.number(),
  follow_up_date: z.union([
    z.string().transform(val => {
      try {
        // Handle DD-MM-YYYY format
        if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
          const [day, month, year] = val.split('-');
          return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        }
        
        // Handle YYYY-MM-DD format (from HTML date inputs)
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return new Date(val + 'T00:00:00.000Z');
        }
        
        // Handle any other date string
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date;
      } catch (error) {
        console.error('Date parsing error:', error);
        throw new Error('Invalid date format');
      }
    }),
    z.date()
  ]),
  comments: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  assigned_to: z.number().optional().nullable(),
  is_completed: z.boolean().default(false),
  status: z.string().optional().default('pending'),
  created_by: z.number().optional().nullable(),
  type: z.string().optional().default('Call'),
  next_follow_up_date: z.union([
    z.string().transform(val => {
      try {
        // Handle DD-MM-YYYY format
        if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
          const [day, month, year] = val.split('-');
          return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        }
        
        // Handle YYYY-MM-DD format (from HTML date inputs)
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return new Date(val + 'T00:00:00.000Z');
        }
        
        // Handle any other date string
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date;
      } catch (error) {
        console.error('Date parsing error:', error);
        throw new Error('Invalid date format');
      }
    }),
    z.date()
  ]).optional().nullable(),
});

export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;

export const insertFollowUpCommentSchema = z.object({
  follow_up_id: z.number(),
  comment: z.string().min(1, { message: 'Comment is required' }),
  user_id: z.number()
});

export type InsertFollowUpComment = z.infer<typeof insertFollowUpCommentSchema>;