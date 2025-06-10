import { pgTable, serial, varchar, text, timestamp, integer, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Enum for lead status
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'dropped']);

// Enum for payment methods
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'upi', 'check', 'other']);

// Enum for payment status
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);

// Leads table
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }).notNull(),
  source: varchar('source', { length: 100 }),
  status: leadStatusEnum('status').notNull().default('new'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Batches table
export const batches = pgTable('batches', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  description: text('description'),
});

// Students table
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }).notNull(),
  batchId: integer('batch_id').references(() => batches.id),
  enrollmentDate: timestamp('enrollment_date').defaultNow(),
  totalFee: numeric('total_fee').notNull(),
  feePaid: numeric('fee_paid').default('0').notNull(),
  feeDue: numeric('fee_due').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
  convertedFromLeadId: integer('converted_from_lead_id').references(() => leads.id),
});

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  amount: numeric('amount').notNull(),
  paymentDate: timestamp('payment_date').defaultNow(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status: paymentStatusEnum('status').default('completed'),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relations
export const leadsRelations = relations(leads, ({ one }) => ({
  student: one(students, {
    fields: [leads.id],
    references: [students.convertedFromLeadId],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  batch: one(batches, {
    fields: [students.batchId],
    references: [batches.id],
  }),
  lead: one(leads, {
    fields: [students.convertedFromLeadId],
    references: [leads.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
}));

// Schemas for validation
export const insertLeadSchema = createInsertSchema(leads);
export const selectLeadSchema = createSelectSchema(leads);

export const insertBatchSchema = createInsertSchema(batches);
export const selectBatchSchema = createSelectSchema(batches);

export const insertStudentSchema = createInsertSchema(students);
export const selectStudentSchema = createSelectSchema(students);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

// Types for TypeScript
export type Lead = z.infer<typeof selectLeadSchema>;
export type NewLead = z.infer<typeof insertLeadSchema>;

export type Batch = z.infer<typeof selectBatchSchema>;
export type NewBatch = z.infer<typeof insertBatchSchema>;

export type Student = z.infer<typeof selectStudentSchema>;
export type NewStudent = z.infer<typeof insertStudentSchema>;

export type Payment = z.infer<typeof selectPaymentSchema>;
export type NewPayment = z.infer<typeof insertPaymentSchema>;