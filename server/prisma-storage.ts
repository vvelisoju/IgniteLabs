import { prisma } from './prisma';
import { Decimal } from 'decimal.js';
import { hashPassword } from './auth';
import { emailService } from './services/email.service';
import { SETTINGS_KEYS } from './services/settings';
import { 
  Prisma,
  users,
  leads,
  students,
  payments,
  batches,
  follow_ups,
  follow_up_comments,
  settings,
  lead_status,
  payment_method,
  user_role
} from '../generated/prisma';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

// Type definitions based on Prisma models
export type User = users;
export type Lead = leads;
export type Student = students;
export type Payment = payments;
export type Batch = batches;
export type FollowUp = follow_ups;
export type FollowUpComment = follow_up_comments;
export type Setting = settings;

// Insert types
export type InsertUser = Prisma.usersCreateInput;
export type InsertLead = Prisma.leadsCreateInput;
export type InsertBatch = Prisma.batchesCreateInput;
export type InsertPayment = Prisma.paymentsCreateInput;
export type InsertFollowUp = Prisma.follow_upsCreateInput;
export type InsertFollowUpComment = Prisma.follow_up_commentsCreateInput;
export type InsertSetting = Prisma.settingsCreateInput;

// Extend InsertStudent with extra fields for lead conversion
export interface InsertStudent extends Prisma.studentsCreateInput {
  initialPayment?: string;
  paymentMethod?: payment_method;
  paymentNotes?: string;
  reference?: string;
}

export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User management
  getUserById(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: InsertUser): Promise<User>;
  getUsersByRole(role: user_role): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
  
  // Lead management
  getLeadById(id: number): Promise<Lead | null>;
  getAllLeads(filters?: Partial<{ status: lead_status; assignedTo: number; source: string; }>): Promise<Lead[]>;
  createLead(leadData: InsertLead): Promise<Lead>;
  updateLead(id: number, leadData: Partial<Lead>): Promise<Lead | null>;
  deleteLead(id: number): Promise<boolean>;
  
  // Student management
  getStudentById(id: number): Promise<Student | null>;
  getAllStudents(filters?: Partial<{ batchId: number; isActive: boolean; }>): Promise<Student[]>;
  createStudent(studentData: InsertStudent): Promise<Student>;
  updateStudent(id: number, studentData: Partial<Student>): Promise<Student | null>;
  deleteStudent(id: number): Promise<boolean>;
  truncateDuplicateStudents(phone: string): Promise<boolean>;
  
  // Convert lead to student
  convertLeadToStudent(leadId: number, studentData: Omit<InsertStudent, 'convertedFromLeadId'>): Promise<Student>;
  
  // Payment management
  getStudentPayments(studentId: number): Promise<Payment[]>;
  recordPayment(paymentData: InsertPayment): Promise<Payment>;
  getPaymentById(id: number): Promise<Payment | null>;
  getAllPayments(): Promise<Payment[]>;
  updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | null>;
  
  // Batch management
  getBatchById(id: number): Promise<Batch | null>;
  getAllBatches(): Promise<Batch[]>;
  getBatchesByTrainer(trainerId: number): Promise<Batch[]>;
  createBatch(batchData: InsertBatch): Promise<Batch>;
  updateBatch(id: number, batchData: Partial<Batch>): Promise<Batch | null>;
  deleteBatch(id: number): Promise<boolean>;
  
  // Follow-up management
  getFollowUpById(id: number): Promise<FollowUp | null>;
  getLeadFollowUps(leadId: number): Promise<FollowUp[]>;
  getAllFollowUps(filters?: Partial<{ leadId: number; assignedTo: number; createdBy: number; status: string; isCompleted: boolean; }>): Promise<FollowUp[]>;
  createFollowUp(followUpData: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: number, followUpData: Partial<FollowUp>): Promise<FollowUp | null>;
  deleteFollowUp(id: number): Promise<boolean>;
  completeFollowUp(id: number): Promise<FollowUp | null>;
  
  // Follow-up comments
  getFollowUpComments(followUpId: number): Promise<FollowUpComment[]>;
  addFollowUpComment(commentData: InsertFollowUpComment): Promise<FollowUpComment>;
  
  // Follow-up analytics and scheduling
  getFollowUpsByDate(date: Date): Promise<FollowUp[]>;
  getFollowUpsByDateRange(startDate: Date, endDate: Date): Promise<FollowUp[]>;
  getFollowUpsByAssignedUser(userId: number): Promise<FollowUp[]>;
  getOverdueFollowUps(): Promise<FollowUp[]>;
  
  // Settings management
  getSetting(tenantId: number, key: string): Promise<string | null>;
  getSettings(tenantId: number, keys: string[]): Promise<Record<string, string>>;
  updateSetting(tenantId: number, key: string, value: string): Promise<boolean>;
  getOrganizationDetails(tenantId: number): Promise<{
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    gstin?: string;
    logo?: string;
  }>;
}

const PostgresSessionStore = connectPg(session);

export class PrismaStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: 'sessions',
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUserById(id: number): Promise<User | null> {
    return await prisma.users.findUnique({
      where: { id }
    });
  }
  
  async getUserByUsername(username: string): Promise<User | null> {
    console.log(`Looking up user with username or email: ${username}`);
    try {
      // First try to find by username
      let user = await prisma.users.findFirst({
        where: { username }
      });
      
      // If not found by username, try to find by email
      if (!user) {
        user = await prisma.users.findFirst({
          where: { email: username }
        });
        if (user) {
          console.log(`User found by email instead of username`);
        }
      }
      
      console.log(`User lookup result: ${user ? 'found' : 'not found'}`);
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return null;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.users.findFirst({
      where: { email }
    });
  }
  
  async getUsersByEmail(email: string): Promise<User[]> {
    return await prisma.users.findMany({
      where: { email }
    });
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    console.log('Create user data before transform:', JSON.stringify(userData));
    
    const transformedData: any = {};
    
    // Map all camelCase fields to snake_case
    if ('username' in userData) transformedData.username = userData.username;
    if ('password' in userData) transformedData.password = userData.password;
    if ('email' in userData) transformedData.email = userData.email;
    if ('name' in userData) transformedData.name = userData.name;
    if ('role' in userData) transformedData.role = userData.role;
    if ('phone' in userData) transformedData.phone = userData.phone;
    if ('specialization' in userData) transformedData.specialization = userData.specialization;
    if ('bio' in userData) transformedData.bio = userData.bio;
    if ('status' in userData) transformedData.status = userData.status;
    if ('tenantId' in (userData as any)) transformedData.tenant_id = (userData as any).tenantId;
    
    console.log('Transformed user data:', JSON.stringify(transformedData));
    
    return await prisma.users.create({
      data: transformedData
    });
  }
  
  async getUsersByRole(role: user_role): Promise<User[]> {
    return await prisma.users.findMany({
      where: { role }
    });
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    console.log('Update user data before transform:', JSON.stringify(userData));
    
    const transformedData: any = {
      updated_at: new Date()
    };
    
    // Map all camelCase fields to snake_case
    if ('username' in userData) transformedData.username = userData.username;
    if ('password' in userData) transformedData.password = userData.password;
    if ('email' in userData) transformedData.email = userData.email;
    if ('name' in userData) transformedData.name = userData.name;
    if ('role' in userData) transformedData.role = userData.role;
    if ('phone' in userData) transformedData.phone = userData.phone;
    if ('specialization' in userData) transformedData.specialization = userData.specialization;
    if ('bio' in userData) transformedData.bio = userData.bio;
    if ('status' in userData) transformedData.status = userData.status;
    if ('tenantId' in (userData as any)) transformedData.tenant_id = (userData as any).tenantId;
    
    console.log('Transformed user data for update:', JSON.stringify(transformedData));
    
    return await prisma.users.update({
      where: { id },
      data: transformedData
    });
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.users.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  // Lead methods
  async getLeadById(id: number): Promise<Lead | null> {
    return await prisma.leads.findUnique({
      where: { id }
    });
  }
  
  async getAllLeads(filters: Partial<{ status: lead_status; assignedTo: number; source: string; }> = {}): Promise<Lead[]> {
    console.log('Get all leads filters before transform:', JSON.stringify(filters));
    
    const whereClause: any = {};
    
    // Map camelCase filter keys to snake_case database fields
    if ('status' in filters) whereClause.status = filters.status;
    if ('source' in filters) whereClause.source = filters.source;
    if ('assignedTo' in filters) whereClause.assigned_to = filters.assignedTo;
    
    console.log('Transformed filters:', JSON.stringify(whereClause));
    
    return await prisma.leads.findMany({
      where: whereClause,
      orderBy: { updated_at: 'desc' }
    });
  }
  
  async createLead(leadData: InsertLead): Promise<Lead> {
    // Transform camelCase to snake_case for Prisma
    console.log('Create lead data before transform:', JSON.stringify(leadData));
    
    const transformedData: any = {};
    
    // Map all camelCase fields to snake_case
    if ('name' in leadData) transformedData.name = leadData.name;
    if ('phone' in leadData) transformedData.phone = leadData.phone;
    if ('email' in leadData) transformedData.email = leadData.email;
    if ('source' in leadData) transformedData.source = leadData.source;
    if ('course' in leadData) transformedData.course = leadData.course;
    if ('status' in leadData) transformedData.status = leadData.status;
    if ('notes' in leadData) transformedData.notes = leadData.notes;
    if ('assignedTo' in (leadData as any)) transformedData.assigned_to = (leadData as any).assignedTo;
    if ('tenantId' in (leadData as any)) transformedData.tenant_id = (leadData as any).tenantId;
    
    console.log('Transformed data:', JSON.stringify(transformedData));
    
    return await prisma.leads.create({
      data: transformedData
    });
  }
  
  async updateLead(id: number, leadData: Partial<Lead>): Promise<Lead | null> {
    // Transform camelCase to snake_case for Prisma
    console.log('Update lead data before transform:', JSON.stringify(leadData));
    
    const transformedData: any = {
      updated_at: new Date()
    };
    
    // Map all camelCase fields to snake_case
    if ('name' in leadData) transformedData.name = leadData.name;
    if ('email' in leadData) transformedData.email = leadData.email;
    if ('phone' in leadData) transformedData.phone = leadData.phone;
    if ('source' in leadData) transformedData.source = leadData.source;
    if ('course' in leadData) transformedData.course = leadData.course;
    if ('status' in leadData) transformedData.status = leadData.status;
    if ('notes' in leadData) transformedData.notes = leadData.notes;
    if ('assignedTo' in (leadData as any)) transformedData.assigned_to = (leadData as any).assignedTo;
    if ('tenantId' in (leadData as any)) transformedData.tenant_id = (leadData as any).tenantId;
    
    console.log('Transformed lead data for update:', JSON.stringify(transformedData));
    
    return await prisma.leads.update({
      where: { id },
      data: transformedData
    });
  }
  
  async deleteLead(id: number): Promise<boolean> {
    try {
      // First delete any follow-ups
      await prisma.follow_ups.deleteMany({
        where: { lead_id: id }
      });
      
      // Then delete the lead
      await prisma.leads.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }
  
  // Student methods
  async getStudentById(id: number): Promise<Student | null> {
    return await prisma.students.findUnique({
      where: { id }
    });
  }
  
  async getAllStudents(filters: Partial<{ batchId: number; isActive: boolean; }> = {}): Promise<Student[]> {
    const whereClause: any = {};
    
    if (filters.batchId !== undefined) {
      whereClause.batch_id = filters.batchId;
    }
    
    if (filters.isActive !== undefined) {
      whereClause.is_active = filters.isActive;
    }
    
    return await prisma.students.findMany({
      where: whereClause,
      orderBy: { enrollment_date: 'desc' }
    });
  }
  
  async createStudent(studentData: InsertStudent): Promise<Student> {
    console.log('Create student data before transform:', JSON.stringify(studentData));
    
    // Check if data is coming in camelCase or snake_case
    let feeAmount;
    if ('totalFee' in (studentData as any)) {
      feeAmount = (studentData as any).totalFee;
    } else if ('total_fee' in studentData) {
      feeAmount = studentData.total_fee;
    } else {
      throw new Error('Total fee is required');
    }
    
    // Calculate fee due amount
    const totalFee = new Decimal(feeAmount.toString());
    
    // Extract non-prisma fields
    const { initialPayment, paymentMethod, paymentNotes, reference, ...rest } = studentData;
    
    // Get initial payment amount
    const initialPaymentAmount = initialPayment ? new Decimal(initialPayment.toString()) : new Decimal(0);
    
    // Calculate fee due
    const feeDue = totalFee.minus(initialPaymentAmount);
    
    // Transform data for Prisma
    const transformedData: any = {
      fee_paid: initialPaymentAmount,
      fee_due: feeDue,
      total_fee: totalFee
    };
    
    // Map all camelCase fields to snake_case
    if ('name' in rest) transformedData.name = rest.name;
    if ('email' in rest) transformedData.email = rest.email;
    if ('phone' in rest) transformedData.phone = rest.phone;
    if ('parentMobile' in (rest as any)) transformedData.parent_mobile = (rest as any).parentMobile;
    if ('enrollmentDate' in (rest as any)) transformedData.enrollment_date = new Date((rest as any).enrollmentDate);
    
    // Prioritize batch_id (snake_case version) if it exists
    // Also ensure batch_id is properly converted to a number
    if ('batch_id' in rest) {
      const batchId = typeof rest.batch_id === 'string' ? parseInt(rest.batch_id, 10) : rest.batch_id;
      transformedData.batch_id = isNaN(batchId) ? null : batchId;
      console.log('Using batch_id:', rest.batch_id, '→', transformedData.batch_id);
    } else if ('batchId' in (rest as any)) {
      const batchId = typeof (rest as any).batchId === 'string' ? parseInt((rest as any).batchId, 10) : (rest as any).batchId;
      transformedData.batch_id = isNaN(batchId) ? null : batchId;
      console.log('Using batchId:', (rest as any).batchId, '→', transformedData.batch_id);
    } else if ('batch' in (rest as any)) {
      const batchId = typeof (rest as any).batch === 'string' ? parseInt((rest as any).batch, 10) : (rest as any).batch;
      transformedData.batch_id = isNaN(batchId) ? null : batchId;
      console.log('Using batch:', (rest as any).batch, '→', transformedData.batch_id);
    }
    
    if ('isActive' in (rest as any)) transformedData.is_active = (rest as any).isActive;
    if ('notes' in rest) transformedData.notes = rest.notes;
    if ('convertedFromLeadId' in (rest as any)) transformedData.converted_from_lead_id = (rest as any).convertedFromLeadId;
    if ('tenantId' in (rest as any)) transformedData.tenant_id = (rest as any).tenantId;
    
    console.log('Transformed student data:', JSON.stringify(transformedData));

    try {
      // First check if the batch exists
      if (transformedData.batch_id) {
        const batch = await prisma.batches.findUnique({
          where: { id: transformedData.batch_id }
        });
        
        if (!batch) {
          throw new Error(`Batch with ID ${transformedData.batch_id} not found`);
        }
      }
      
      // Using the hashPassword and emailService imported at the top of the file
      
      // Use a transaction to create both user and student
      return await prisma.$transaction(async (tx) => {
        // Generate a username from the email or name
        const email = transformedData.email;
        const username = email ? email.split('@')[0] : transformedData.name.toLowerCase().replace(/\s+/g, '.');
        
        // Check if username already exists
        const existingUser = await tx.users.findFirst({
          where: { username }
        });
        
        // If username exists, append a number to make it unique
        let finalUsername = username;
        if (existingUser) {
          const timestamp = Date.now().toString().slice(-4);
          finalUsername = `${username}${timestamp}`;
        }
        
        // Generate a random password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        
        // Hash the password for storage
        const hashedPassword = await hashPassword(tempPassword);
        
        console.log(`Creating user account for student ${transformedData.name} with username ${finalUsername}`);
        
        // Create user account for the student
        const user = await tx.users.create({
          data: {
            username: finalUsername,
            password: hashedPassword, // Properly hashed password
            email: transformedData.email,
            name: transformedData.name,
            phone: transformedData.phone,
            role: 'student',
            tenant_id: transformedData.tenant_id || 1
          }
        });
        
        // Associate the user ID with the student
        transformedData.user_id = user.id;
        
        // Ensure batch_id is set and is an integer
        // Handle batch_id specifically - make sure we convert it to a number
        if (transformedData.batch_id === undefined || transformedData.batch_id === null) {
          console.error('No batch_id found in transformed data:', transformedData);
          throw new Error('A valid batch_id is required for student creation');
        }
        
        // Convert batch_id to integer
        if (typeof transformedData.batch_id === 'string') {
          const parsed = parseInt(transformedData.batch_id);
          if (isNaN(parsed)) {
            console.error(`Invalid batch_id format: ${transformedData.batch_id}`);
            throw new Error('Invalid batch_id format');
          }
          transformedData.batch_id = parsed;
        } else if (typeof transformedData.batch_id !== 'number') {
          console.error(`Unexpected batch_id type: ${typeof transformedData.batch_id}`);
          throw new Error('Invalid batch_id type');
        }
        
        // Validate that it's a positive number
        if (transformedData.batch_id <= 0) {
          console.error(`Invalid batch_id value: ${transformedData.batch_id}`);
          throw new Error('A valid batch_id is required for student creation');
        }
        
        // Create the student
        const student = await tx.students.create({
          data: {
            ...transformedData,
            // Ensure all required fields are present and properly typed
            name: transformedData.name,
            phone: transformedData.phone,
            email: transformedData.email || null,
            parent_mobile: transformedData.parent_mobile || null,
            batch_id: transformedData.batch_id,
            enrollment_date: transformedData.enrollment_date || new Date(),
            total_fee: transformedData.total_fee,
            fee_paid: transformedData.fee_paid || new Prisma.Decimal("0"),
            fee_due: transformedData.fee_due || transformedData.total_fee,
            user_id: transformedData.user_id,
            tenant_id: transformedData.tenant_id || 1
          }
        });
        
        // Send email with login credentials
        try {
          console.log('Sending student credentials email to', transformedData.email);
          emailService.sendStudentCredentialsEmail(
            transformedData.email,
            transformedData.name,
            finalUsername,
            tempPassword,
            transformedData.tenant_id || 1
          ).catch(err => {
            console.error('Failed to send student credentials email:', err);
          });
        } catch (emailError) {
          console.error('Error sending student credentials email:', emailError);
          // Don't throw error here, as we still want to return the student even if email fails
        }
        
        return student;
      });
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }
  
  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | null> {
    console.log('Update student data before transform:', JSON.stringify(studentData));
    
    const transformedData: any = {
      updated_at: new Date()
    };
    
    // Map all camelCase fields to snake_case
    if ('name' in studentData) transformedData.name = studentData.name;
    if ('email' in studentData) transformedData.email = studentData.email;
    if ('phone' in studentData) transformedData.phone = studentData.phone;
    if ('enrollmentDate' in (studentData as any)) transformedData.enrollment_date = (studentData as any).enrollmentDate;
    
    // Handle batch_id conversion - ensure it's a number
    if ('batch_id' in studentData) {
      const batchId = typeof studentData.batch_id === 'string' ? parseInt(studentData.batch_id, 10) : studentData.batch_id;
      transformedData.batch_id = isNaN(batchId as number) ? null : batchId;
      console.log('Update - Using batch_id:', studentData.batch_id, '→', transformedData.batch_id);
    } else if ('batchId' in (studentData as any)) {
      const batchId = typeof (studentData as any).batchId === 'string' ? parseInt((studentData as any).batchId, 10) : (studentData as any).batchId;
      transformedData.batch_id = isNaN(batchId as number) ? null : batchId;
      console.log('Update - Using batchId:', (studentData as any).batchId, '→', transformedData.batch_id);
    }
    
    // Handle total_fee field with proper conversion
    if ('total_fee' in studentData) {
      transformedData.total_fee = studentData.total_fee;
      console.log('Update - Using total_fee:', studentData.total_fee, '→', transformedData.total_fee);
    } else if ('totalFee' in (studentData as any)) {
      transformedData.total_fee = (studentData as any).totalFee;
      console.log('Update - Using totalFee:', (studentData as any).totalFee, '→', transformedData.total_fee);
    } else if ('totalFees' in (studentData as any)) {
      transformedData.total_fee = (studentData as any).totalFees;
      console.log('Update - Using totalFees:', (studentData as any).totalFees, '→', transformedData.total_fee);
    }
    
    // Handle fee_paid field with proper conversion
    if ('fee_paid' in studentData) {
      transformedData.fee_paid = studentData.fee_paid;
      console.log('Update - Using fee_paid:', studentData.fee_paid, '→', transformedData.fee_paid);
    } else if ('feePaid' in (studentData as any)) {
      transformedData.fee_paid = (studentData as any).feePaid;
      console.log('Update - Using feePaid:', (studentData as any).feePaid, '→', transformedData.fee_paid);
    } else if ('amountPaid' in (studentData as any)) {
      transformedData.fee_paid = (studentData as any).amountPaid;
      console.log('Update - Using amountPaid:', (studentData as any).amountPaid, '→', transformedData.fee_paid);
    }
    
    // Handle fee_due field with proper conversion
    if ('fee_due' in studentData) {
      transformedData.fee_due = studentData.fee_due;
      console.log('Update - Using fee_due:', studentData.fee_due, '→', transformedData.fee_due);
    } else if ('feeDue' in (studentData as any)) {
      transformedData.fee_due = (studentData as any).feeDue;
      console.log('Update - Using feeDue:', (studentData as any).feeDue, '→', transformedData.fee_due);
    }
    if ('isActive' in (studentData as any)) transformedData.is_active = (studentData as any).isActive;
    if ('notes' in studentData) transformedData.notes = studentData.notes;
    if ('tenantId' in (studentData as any)) transformedData.tenant_id = (studentData as any).tenantId;
    
    console.log('Transformed student data for update:', JSON.stringify(transformedData));
    
    return await prisma.students.update({
      where: { id },
      data: transformedData
    });
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    try {
      // First delete all associated payments
      await prisma.payments.deleteMany({
        where: { student_id: id }
      });
      
      // Then delete the student
      await prisma.students.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }
  
  // New function to truncate students with duplicate phone numbers
  async truncateDuplicateStudents(phone: string): Promise<boolean> {
    try {
      console.log(`Attempting to truncate students with phone: ${phone}`);
      
      // Find all students with this phone number
      const duplicates = await prisma.students.findMany({
        where: { phone }
      });
      
      if (duplicates.length === 0) {
        console.log('No duplicate students found with this phone number');
        return false;
      }
      
      console.log(`Found ${duplicates.length} students with duplicate phone number`);
      
      // Delete all but the most recently created student (if any)
      if (duplicates.length > 0) {
        // Sort by created_at descending to keep the most recent one
        duplicates.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        
        // Skip the first one (most recent) and delete the rest
        for (let i = 1; i < duplicates.length; i++) {
          console.log(`Deleting duplicate student id ${duplicates[i].id}`);
          
          // Delete associated payments
          await prisma.payments.deleteMany({
            where: { student_id: duplicates[i].id }
          });
          
          // Delete the student
          await prisma.students.delete({
            where: { id: duplicates[i].id }
          });
          
          // If student has an associated user account, delete that too
          if (duplicates[i].user_id) {
            await prisma.users.delete({
              where: { id: duplicates[i].user_id }
            }).catch(e => console.error(`Failed to delete user ${duplicates[i].user_id}:`, e));
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error truncating duplicate students:', error);
      return false;
    }
  }
  
  // Lead conversion method
  async convertLeadToStudent(leadId: number, studentData: Omit<InsertStudent, 'convertedFromLeadId'>): Promise<Student> {
    console.log('Convert lead data before transform:', JSON.stringify(studentData));
    
    // Get the lead to convert
    const lead = await this.getLeadById(leadId);
    if (!lead) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }
    
    // Extract special fields with camelCase field names as they're passed from the frontend
    const { initialPayment, paymentMethod, paymentNotes, reference, totalFee, batch_id: batchId , enrollmentDate, ...rest } = studentData as any;
    
    console.log('Extracted fields:', { 
      initialPayment, 
      paymentMethod, 
      totalFee, 
      batchId,
      enrollmentDate,
      remainingFields: Object.keys(rest) 
    });
    
    // Start a transaction
    return await prisma.$transaction(async (tx) => {
      // Calculate fee amounts - Use extracted camelCase variables
      const paymentAmt = initialPayment ? new Decimal(initialPayment.toString()) : new Decimal("0");
      const totalFeeDecimal = totalFee ? new Decimal(totalFee.toString()) : new Decimal("0");
      const feeDue = totalFeeDecimal.minus(paymentAmt);
      
      console.log('Fee calculations:', {
        paymentAmt: paymentAmt.toString(),
        totalFeeDecimal: totalFeeDecimal.toString(),
        feeDue: feeDue.toString()
      });
      
      // Transform data for Prisma
      const transformedData: any = {
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        converted_from_lead_id: leadId,
        fee_paid: paymentAmt,
        fee_due: feeDue,
        total_fee: totalFeeDecimal
      };
      
      // Handle batch_id conversion for lead to student
      if (batchId) {
        const batchIdAsNumber = typeof batchId === 'string' ? parseInt(batchId, 10) : batchId;
        transformedData.batch_id = isNaN(batchIdAsNumber as number) ? null : batchIdAsNumber;
        console.log('Lead conversion - Using batchId:', batchId, '→', transformedData.batch_id);
      } else {
        console.warn('No batch_id provided for lead conversion');
      }
      
      // Add enrollment date directly from extracted variable
      if (enrollmentDate) {
        transformedData.enrollment_date = new Date(enrollmentDate);
      }
      
      // Map any remaining fields from rest
      if ('name' in rest) transformedData.name = rest.name;
      if ('email' in rest) transformedData.email = rest.email;
      if ('phone' in rest) transformedData.phone = rest.phone;
      if ('isActive' in (rest as any)) transformedData.is_active = (rest as any).isActive;
      if ('notes' in rest) transformedData.notes = rest.notes;
      if ('tenantId' in (rest as any)) transformedData.tenant_id = (rest as any).tenantId;
      
      console.log('Transformed student data for lead conversion:', JSON.stringify(transformedData));
      
      // Create the student
      const student = await tx.students.create({
        data: transformedData
      });
      
      // Record initial payment if provided
      if (paymentAmt.greaterThan(0) && paymentMethod) {
        const paymentData = {
          student_id: student.id,
          amount: paymentAmt,
          payment_date: new Date(),
          payment_method: paymentMethod,
          reference: reference || '',
          notes: paymentNotes || 'Initial payment during enrollment',
          next_payment_due_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
        };
        
        console.log('Creating payment:', JSON.stringify(paymentData));
        
        await tx.payments.create({
          data: paymentData
        });
      }
      
      // Update lead status to 'converted'
      await tx.leads.update({
        where: { id: leadId },
        data: { 
          status: lead_status.converted,
          updated_at: new Date()
        }
      });
      
      return student;
    });
  }
  
  // Payment methods
  async getStudentPayments(studentId: number): Promise<Payment[]> {
    return await prisma.payments.findMany({
      where: { student_id: studentId },
      orderBy: { payment_date: 'desc' }
    });
  }
  
  async recordPayment(paymentData: InsertPayment): Promise<Payment> {
    console.log('Record payment data before transform:', JSON.stringify(paymentData));
    
    // Transform the payment data
    const transformedPaymentData: any = {};
    
    // Map all camelCase fields to snake_case
    if ('studentId' in (paymentData as any)) transformedPaymentData.student_id = (paymentData as any).studentId;
    else if ('student_id' in paymentData) transformedPaymentData.student_id = paymentData.student_id;
    
    if ('amount' in paymentData) transformedPaymentData.amount = paymentData.amount;
    // Format dates as ISO strings
    if ('paymentDate' in (paymentData as any)) {
      const paymentDate = (paymentData as any).paymentDate;
      if (paymentDate && !paymentDate.includes('T')) {
        // If date doesn't have time part, add it to make it ISO compatible
        transformedPaymentData.payment_date = `${paymentDate}T00:00:00.000Z`;
      } else {
        transformedPaymentData.payment_date = paymentDate;
      }
    }
    else if ('payment_date' in paymentData) {
      const paymentDate = paymentData.payment_date;
      if (paymentDate && typeof paymentDate === 'string' && !paymentDate.includes('T')) {
        transformedPaymentData.payment_date = `${paymentDate}T00:00:00.000Z`;
      } else {
        transformedPaymentData.payment_date = paymentDate;
      }
    }
    
    if ('paymentMethod' in (paymentData as any)) transformedPaymentData.payment_method = (paymentData as any).paymentMethod;
    else if ('payment_method' in paymentData) transformedPaymentData.payment_method = paymentData.payment_method;
    
    if ('reference' in paymentData) transformedPaymentData.reference = paymentData.reference;
    if ('notes' in paymentData) transformedPaymentData.notes = paymentData.notes;
    
    // Format next payment due date
    if ('nextPaymentDueDate' in (paymentData as any)) {
      const nextDate = (paymentData as any).nextPaymentDueDate;
      if (nextDate && !nextDate.includes('T')) {
        transformedPaymentData.next_payment_due_date = `${nextDate}T00:00:00.000Z`;
      } else {
        transformedPaymentData.next_payment_due_date = nextDate;
      }
    }
    else if ('next_payment_due_date' in paymentData) {
      const nextDate = paymentData.next_payment_due_date;
      if (nextDate && typeof nextDate === 'string' && !nextDate.includes('T')) {
        transformedPaymentData.next_payment_due_date = `${nextDate}T00:00:00.000Z`;
      } else {
        transformedPaymentData.next_payment_due_date = nextDate;
      }
    }
    
    if ('tenantId' in (paymentData as any)) transformedPaymentData.tenant_id = (paymentData as any).tenantId;
    else if ('tenant_id' in paymentData) transformedPaymentData.tenant_id = paymentData.tenant_id;
    
    console.log('Transformed payment data:', JSON.stringify(transformedPaymentData));
    
    // Ensure we have a student_id
    if (!transformedPaymentData.student_id) {
      throw new Error('Missing student_id in payment data');
    }
    
    return await prisma.$transaction(async (tx) => {
      // Record the payment
      const payment = await tx.payments.create({
        data: transformedPaymentData
      });
      
      // Get the student to update fee info
      const student = await tx.students.findUnique({
        where: { id: transformedPaymentData.student_id }
      });
      
      if (!student) {
        throw new Error(`Student with ID ${transformedPaymentData.student_id} not found`);
      }
      
      // Calculate new fee amounts
      const currentFeePaid = new Decimal(student.fee_paid.toString());
      const currentFeeDue = new Decimal(student.fee_due.toString());
      const paymentAmount = new Decimal(transformedPaymentData.amount.toString());
      
      const newFeePaid = currentFeePaid.plus(paymentAmount);
      const newFeeDue = currentFeeDue.minus(paymentAmount);
      
      // Update student fee status
      await tx.students.update({
        where: { id: transformedPaymentData.student_id },
        data: {
          fee_paid: newFeePaid,
          fee_due: newFeeDue,
          updated_at: new Date()
        }
      });
      
      return payment;
    });
  }
  
  async getPaymentById(id: number): Promise<Payment | null> {
    return await prisma.payments.findUnique({
      where: { id }
    });
  }
  
  async getAllPayments(): Promise<Payment[]> {
    return await prisma.payments.findMany({
      orderBy: { payment_date: 'desc' }
    });
  }
  
  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | null> {
    console.log('Update payment data before transform:', JSON.stringify(paymentData));
    
    // Get existing payment to calculate fee difference
    const existingPayment = await this.getPaymentById(id);
    if (!existingPayment) {
      console.error(`Payment with ID ${id} not found`);
      return null;
    }
    
    // Transform camelCase to snake_case for Prisma
    const transformedData: any = {};
    
    // Handle amount change
    let amountDifference: Decimal | null = null;
    if ('amount' in paymentData && paymentData.amount) {
      // Convert both values to Decimal for proper comparison
      const oldAmount = new Decimal(existingPayment.amount.toString());
      const newAmount = new Decimal(paymentData.amount.toString());
      
      // Only update if amounts are different
      if (!oldAmount.equals(newAmount)) {
        transformedData.amount = paymentData.amount;
        // Calculate the difference for updating student fee records
        amountDifference = newAmount.minus(oldAmount);
      }
    }
    
    // Map all camelCase fields to snake_case
    if ('studentId' in (paymentData as any)) transformedData.student_id = (paymentData as any).studentId;
    
    // Format payment date
    if ('paymentDate' in (paymentData as any)) {
      const paymentDate = (paymentData as any).paymentDate;
      if (paymentDate && !paymentDate.includes('T')) {
        // If date doesn't have time part, add it to make it ISO compatible
        transformedData.payment_date = `${paymentDate}T00:00:00.000Z`;
      } else {
        transformedData.payment_date = paymentDate;
      }
    }
    
    if ('paymentMethod' in (paymentData as any)) transformedData.payment_method = (paymentData as any).paymentMethod;
    if ('reference' in paymentData) transformedData.reference = paymentData.reference;
    if ('notes' in paymentData) transformedData.notes = paymentData.notes;
    if ('status' in paymentData) transformedData.status = paymentData.status;
    if ('receiptNumber' in (paymentData as any)) transformedData.receipt_number = (paymentData as any).receiptNumber;
    if ('transactionId' in (paymentData as any)) transformedData.transaction_id = (paymentData as any).transactionId;
    
    // Format next payment due date
    if ('nextPaymentDueDate' in (paymentData as any)) {
      const nextDate = (paymentData as any).nextPaymentDueDate;
      if (nextDate && !nextDate.includes('T')) {
        transformedData.next_payment_due_date = `${nextDate}T00:00:00.000Z`;
      } else {
        transformedData.next_payment_due_date = nextDate;
      }
    }
    
    if ('tenantId' in (paymentData as any)) transformedData.tenant_id = (paymentData as any).tenantId;
    
    console.log('Transformed payment data for update:', JSON.stringify(transformedData));
    
    return await prisma.$transaction(async (tx) => {
      // Update the payment
      const payment = await tx.payments.update({
        where: { id },
        data: transformedData
      });
      
      // If amount has changed, update student fee info
      if (amountDifference && !amountDifference.isZero()) {
        // Get the student to update fee info
        const student = await tx.students.findUnique({
          where: { id: payment.student_id }
        });
        
        if (!student) {
          throw new Error(`Student with ID ${payment.student_id} not found`);
        }
        
        // Calculate new fee amounts
        const currentFeePaid = new Decimal(student.fee_paid.toString());
        const currentFeeDue = new Decimal(student.fee_due.toString());
        
        const newFeePaid = currentFeePaid.plus(amountDifference);
        const newFeeDue = currentFeeDue.minus(amountDifference);
        
        // Update student fee status
        await tx.students.update({
          where: { id: payment.student_id },
          data: {
            fee_paid: newFeePaid,
            fee_due: newFeeDue,
            updated_at: new Date()
          }
        });
      }
      
      return payment;
    });
  }
  
  // Batch methods
  async getBatchById(id: number): Promise<Batch | null> {
    if (!id || isNaN(Number(id))) {
      console.error(`Invalid batch ID provided: ${id}`);
      return null;
    }
    
    console.log(`Looking up batch with ID: ${id}`);
    try {
      return await prisma.batches.findUnique({
        where: { 
          id: Number(id) // Ensure it's a proper number
        }
      });
    } catch (error) {
      console.error(`Error fetching batch with ID ${id}:`, error);
      return null;
    }
  }
  
  async getAllBatches(): Promise<Batch[]> {
    return await prisma.batches.findMany({
      orderBy: { start_date: 'asc' }
    });
  }
  
  async getBatchesByTrainer(trainerId: number): Promise<Batch[]> {
    return await prisma.batches.findMany({
      where: { trainer_id: trainerId },
      orderBy: { start_date: 'asc' }
    });
  }
  
  async createBatch(batchData: InsertBatch): Promise<Batch> {
    console.log('Create batch data before transform:', JSON.stringify(batchData));
    
    const transformedData: any = {};
    
    // Map all fields to snake_case format for Prisma
    if ('name' in batchData) transformedData.name = batchData.name;
    if ('description' in batchData) transformedData.description = batchData.description;
    
    // Handle date fields with proper formats (accept both camelCase and snake_case)
    if ('startDate' in (batchData as any)) {
      try {
        transformedData.start_date = new Date((batchData as any).startDate);
      } catch (error) {
        console.error('Error parsing startDate:', error);
        throw new Error(`Invalid start date format: ${(batchData as any).startDate}`);
      }
    } else if ('start_date' in (batchData as any)) {
      try {
        transformedData.start_date = new Date((batchData as any).start_date);
      } catch (error) {
        console.error('Error parsing start_date:', error);
        throw new Error(`Invalid start date format: ${(batchData as any).start_date}`);
      }
    }
    
    if ('endDate' in (batchData as any)) {
      try {
        transformedData.end_date = new Date((batchData as any).endDate);
      } catch (error) {
        console.error('Error parsing endDate:', error);
        throw new Error(`Invalid end date format: ${(batchData as any).endDate}`);
      }
    } else if ('end_date' in (batchData as any)) {
      try {
        transformedData.end_date = new Date((batchData as any).end_date);
      } catch (error) {
        console.error('Error parsing end_date:', error);
        throw new Error(`Invalid end date format: ${(batchData as any).end_date}`);
      }
    }
    
    // Handle fee field which is required by schema
    if ('fee' in (batchData as any)) {
      transformedData.fee = new Decimal((batchData as any).fee.toString());
    } else {
      throw new Error('Fee is required for batch creation');
    }
    
    // Handle capacity field
    if ('capacity' in (batchData as any)) {
      transformedData.capacity = (batchData as any).capacity;
    }
    
    // Map trainer field to trainer_id (accept both camelCase and snake_case)
    if ('trainer' in (batchData as any)) {
      transformedData.trainer_id = (batchData as any).trainer;
    } else if ('trainerId' in (batchData as any)) {
      transformedData.trainer_id = (batchData as any).trainerId;
    } else if ('trainer_id' in (batchData as any)) {
      transformedData.trainer_id = (batchData as any).trainer_id;
    }
    
    // Handle isActive field (accept both camelCase and snake_case)
    if ('isActive' in (batchData as any)) {
      transformedData.is_active = (batchData as any).isActive;
    } else if ('is_active' in (batchData as any)) {
      transformedData.is_active = (batchData as any).is_active;
    } else {
      // Default to active if not specified
      transformedData.is_active = true;
    }
    
    // Handle tenant_id (accept both camelCase and snake_case)
    if ('tenantId' in (batchData as any)) {
      transformedData.tenant_id = (batchData as any).tenantId;
    } else if ('tenant_id' in (batchData as any)) {
      transformedData.tenant_id = (batchData as any).tenant_id;
    } else {
      // Default to tenant 1 if not specified
      transformedData.tenant_id = 1;
    }
    
    console.log('Transformed batch data:', JSON.stringify(transformedData));
    
    try {
      return await prisma.batches.create({
        data: transformedData
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }
  
  async updateBatch(id: number, batchData: Partial<Batch>): Promise<Batch | null> {
    console.log('Update batch data before transform:', JSON.stringify(batchData));
    
    const transformedData: any = {
      updated_at: new Date()
    };
    
    // Map all camelCase fields to snake_case
    if ('name' in batchData) transformedData.name = batchData.name;
    if ('description' in batchData) transformedData.description = batchData.description;
    
    // Handle date fields with proper formats
    if ('startDate' in (batchData as any)) {
      try {
        transformedData.start_date = new Date((batchData as any).startDate);
      } catch (error) {
        console.error('Error parsing startDate:', error);
        throw new Error(`Invalid start date format: ${(batchData as any).startDate}`);
      }
    }
    
    if ('endDate' in (batchData as any)) {
      try {
        transformedData.end_date = new Date((batchData as any).endDate);
      } catch (error) {
        console.error('Error parsing endDate:', error);
        throw new Error(`Invalid end date format: ${(batchData as any).endDate}`);
      }
    }
    
    // Handle fee field
    if ('fee' in (batchData as any)) {
      transformedData.fee = new Decimal((batchData as any).fee.toString());
    }
    
    // Handle capacity field (renamed from maxStudents)
    if ('capacity' in (batchData as any)) {
      transformedData.capacity = (batchData as any).capacity;
    } else if ('maxStudents' in (batchData as any)) {
      transformedData.capacity = (batchData as any).maxStudents;
    }
    
    // Map trainer field to trainer_id
    if ('trainer' in (batchData as any)) {
      transformedData.trainer_id = (batchData as any).trainer;
    } else if ('trainerId' in (batchData as any)) {
      transformedData.trainer_id = (batchData as any).trainerId;
    }
    
    // Handle isActive field
    if ('isActive' in (batchData as any)) {
      transformedData.is_active = (batchData as any).isActive;
    }
    
    if ('status' in batchData) transformedData.status = batchData.status;
    if ('tenantId' in (batchData as any)) transformedData.tenant_id = (batchData as any).tenantId;
    
    console.log('Transformed batch data for update:', JSON.stringify(transformedData));
    
    try {
      return await prisma.batches.update({
        where: { id },
        data: transformedData
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  }
  
  async deleteBatch(id: number): Promise<boolean> {
    try {
      // Check if there are students in this batch
      const studentsInBatch = await prisma.students.findMany({
        where: { batch_id: id },
        take: 1
      });
      
      if (studentsInBatch.length > 0) {
        throw new Error('Cannot delete batch with enrolled students');
      }
      
      await prisma.batches.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      return false;
    }
  }
  
  // Follow-up methods
  async getFollowUpById(id: number): Promise<FollowUp | null> {
    return await prisma.follow_ups.findUnique({
      where: { id }
    });
  }
  
  async getLeadFollowUps(leadId: number): Promise<FollowUp[]> {
    return await prisma.follow_ups.findMany({
      where: { lead_id: leadId },
      orderBy: { follow_up_date: 'asc' }
    });
  }
  
  async getAllFollowUps(filters: Partial<{ 
    leadId: number; 
    assignedTo: number; 
    createdBy: number; 
    status: string; 
    isCompleted: boolean; 
  }> = {}): Promise<FollowUp[]> {
    console.log('Get all follow-ups filters before transform:', JSON.stringify(filters));
    
    const whereClause: any = {};
    
    if (filters.leadId !== undefined) {
      whereClause.lead_id = filters.leadId;
    }
    
    if (filters.assignedTo !== undefined) {
      whereClause.assigned_to = filters.assignedTo;
    }
    
    if (filters.createdBy !== undefined) {
      whereClause.created_by = filters.createdBy;
    }
    
    if (filters.status !== undefined) {
      whereClause.status = filters.status;
    }
    
    if (filters.isCompleted !== undefined) {
      whereClause.is_completed = filters.isCompleted;
    }
    
    return await prisma.follow_ups.findMany({
      where: whereClause,
      orderBy: { follow_up_date: 'asc' }
    });
  }
  
  async createFollowUp(followUpData: InsertFollowUp): Promise<FollowUp> {
    console.log('Create follow-up data before transform:', JSON.stringify(followUpData));
    
    const transformedData: any = {};
    
    // Handle lead_id field (support both formats)
    if ('leadId' in (followUpData as any)) {
      const leadId = (followUpData as any).leadId;
      // Make sure leadId is a number
      transformedData.lead_id = typeof leadId === 'string' ? parseInt(leadId, 10) : leadId;
      console.log(`Using leadId: ${(followUpData as any).leadId} → ${transformedData.lead_id}`);
    } else if ('lead_id' in followUpData) {
      const leadId = followUpData.lead_id;
      // Make sure lead_id is a number
      transformedData.lead_id = typeof leadId === 'string' ? parseInt(leadId, 10) : leadId;
      console.log(`Using lead_id: ${followUpData.lead_id} → ${transformedData.lead_id}`);
    }
    
    // Ensure lead_id is present
    if (!transformedData.lead_id) {
      throw new Error('Missing lead_id in follow-up data');
    }
    
    // Handle date fields with proper ISO format
    if ('followUpDate' in (followUpData as any)) {
      try {
        const dateValue = (followUpData as any).followUpDate;
        
        // Handle different date formats
        if (typeof dateValue === 'string') {
          // If date string doesn't have time part, add it
          if (!dateValue.includes('T')) {
            transformedData.follow_up_date = new Date(`${dateValue}T00:00:00.000Z`);
          } else {
            transformedData.follow_up_date = new Date(dateValue);
          }
        } else if (dateValue instanceof Date) {
          transformedData.follow_up_date = dateValue;
        } else {
          throw new Error(`Invalid date type: ${typeof dateValue}`);
        }
        
        console.log(`Transformed followUpDate: ${transformedData.follow_up_date.toISOString()}`);
      } catch (error) {
        console.error('Error parsing followUpDate:', error);
        throw new Error(`Invalid follow-up date format: ${(followUpData as any).followUpDate}`);
      }
    } else {
      // If no date is provided, use current date
      transformedData.follow_up_date = new Date();
      console.log(`No followUpDate provided, using current date: ${transformedData.follow_up_date.toISOString()}`);
    }
    
    if ('comments' in followUpData) transformedData.comments = followUpData.comments;
    if ('status' in followUpData) transformedData.status = followUpData.status;
    if ('assignedTo' in (followUpData as any)) transformedData.assigned_to = (followUpData as any).assignedTo;
    if ('createdBy' in (followUpData as any)) transformedData.created_by = (followUpData as any).createdBy;
    if ('isCompleted' in (followUpData as any)) transformedData.is_completed = (followUpData as any).isCompleted;
    if ('type' in followUpData) transformedData.type = followUpData.type;
    
    // Handle next follow-up date
    if ('nextFollowUpDate' in (followUpData as any)) {
      try {
        const dateValue = (followUpData as any).nextFollowUpDate;
        
        // Handle different date formats
        if (typeof dateValue === 'string') {
          // If date string doesn't have time part, add it
          if (!dateValue.includes('T')) {
            transformedData.next_follow_up_date = new Date(`${dateValue}T00:00:00.000Z`);
          } else {
            transformedData.next_follow_up_date = new Date(dateValue);
          }
        } else if (dateValue instanceof Date) {
          transformedData.next_follow_up_date = dateValue;
        } else {
          throw new Error(`Invalid date type: ${typeof dateValue}`);
        }
        
        console.log(`Transformed nextFollowUpDate: ${transformedData.next_follow_up_date.toISOString()}`);
      } catch (error) {
        console.error('Error parsing nextFollowUpDate:', error);
        throw new Error(`Invalid next follow-up date format: ${(followUpData as any).nextFollowUpDate}`);
      }
    }
    
    if ('tenantId' in (followUpData as any)) transformedData.tenant_id = (followUpData as any).tenantId;
    
    console.log('Transformed follow-up data:', JSON.stringify(transformedData, (key, value) => {
      // Special handling for Date objects in logging
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
    
    try {
      // Validate the lead exists
      if (transformedData.lead_id) {
        const lead = await prisma.leads.findUnique({
          where: { id: transformedData.lead_id }
        });
        
        if (!lead) {
          throw new Error(`Lead with ID ${transformedData.lead_id} not found`);
        }
      }
      
      return await prisma.follow_ups.create({
        data: transformedData
      });
    } catch (error) {
      console.error('Error creating follow-up:', error);
      throw error;
    }
  }
  
  async updateFollowUp(id: number, followUpData: Partial<FollowUp>): Promise<FollowUp | null> {
    console.log('Update follow-up data before transform:', JSON.stringify(followUpData));
    
    const transformedData: any = {
      updated_at: new Date()
    };
    
    // Map all camelCase fields to snake_case
    if ('leadId' in (followUpData as any)) transformedData.lead_id = (followUpData as any).leadId;
    
    // Handle date fields with proper ISO format
    if ('followUpDate' in (followUpData as any)) {
      try {
        transformedData.follow_up_date = new Date((followUpData as any).followUpDate);
        console.log(`Transformed followUpDate for update: ${transformedData.follow_up_date.toISOString()}`);
      } catch (error) {
        console.error('Error parsing followUpDate:', error);
        throw new Error(`Invalid follow-up date format: ${(followUpData as any).followUpDate}`);
      }
    }
    
    if ('comments' in followUpData) transformedData.comments = followUpData.comments;
    if ('status' in followUpData) transformedData.status = followUpData.status;
    if ('assignedTo' in (followUpData as any)) transformedData.assigned_to = (followUpData as any).assignedTo;
    if ('createdBy' in (followUpData as any)) transformedData.created_by = (followUpData as any).createdBy;
    if ('isCompleted' in (followUpData as any)) transformedData.is_completed = (followUpData as any).isCompleted;
    if ('type' in followUpData) transformedData.type = followUpData.type;
    
    // Handle next follow-up date
    if ('nextFollowUpDate' in (followUpData as any)) {
      try {
        transformedData.next_follow_up_date = new Date((followUpData as any).nextFollowUpDate);
        console.log(`Transformed nextFollowUpDate for update: ${transformedData.next_follow_up_date.toISOString()}`);
      } catch (error) {
        console.error('Error parsing nextFollowUpDate:', error);
        throw new Error(`Invalid next follow-up date format: ${(followUpData as any).nextFollowUpDate}`);
      }
    }
    
    if ('tenantId' in (followUpData as any)) transformedData.tenant_id = (followUpData as any).tenantId;
    
    console.log('Transformed follow-up data for update:', JSON.stringify(transformedData));
    
    try {
      return await prisma.follow_ups.update({
        where: { id },
        data: transformedData
      });
    } catch (error) {
      console.error('Error updating follow-up:', error);
      throw error;
    }
  }
  
  async deleteFollowUp(id: number): Promise<boolean> {
    try {
      // Delete comments first
      await prisma.follow_up_comments.deleteMany({
        where: { follow_up_id: id }
      });
      
      // Then delete the follow-up
      await prisma.follow_ups.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      return false;
    }
  }
  
  async completeFollowUp(id: number): Promise<FollowUp | null> {
    return await prisma.follow_ups.update({
      where: { id },
      data: {
        is_completed: true,
        completed_at: new Date(),
        updated_at: new Date()
      }
    });
  }
  
  // Follow-up comments
  async getFollowUpComments(followUpId: number): Promise<FollowUpComment[]> {
    return await prisma.follow_up_comments.findMany({
      where: { follow_up_id: followUpId },
      orderBy: { created_at: 'asc' }
    });
  }
  
  async addFollowUpComment(commentData: InsertFollowUpComment): Promise<FollowUpComment> {
    console.log('Create follow-up comment data before transform:', JSON.stringify(commentData));
    
    const transformedData: any = {};
    
    // Map all camelCase fields to snake_case
    if ('followUpId' in (commentData as any)) transformedData.follow_up_id = (commentData as any).followUpId;
    if ('comment' in commentData) transformedData.comment = commentData.comment;
    if ('createdBy' in (commentData as any)) transformedData.created_by = (commentData as any).createdBy;
    if ('tenantId' in (commentData as any)) transformedData.tenant_id = (commentData as any).tenantId;
    
    console.log('Transformed follow-up comment data:', JSON.stringify(transformedData));
    
    return await prisma.follow_up_comments.create({
      data: transformedData
    });
  }
  
  // Follow-up analytics and scheduling
  async getFollowUpsByDate(date: Date): Promise<FollowUp[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await prisma.follow_ups.findMany({
      where: {
        follow_up_date: {
          gte: startOfDay,
          lte: endOfDay
        },
        is_completed: false
      },
      orderBy: { follow_up_date: 'asc' }
    });
  }
  
  async getFollowUpsByDateRange(startDate: Date, endDate: Date): Promise<FollowUp[]> {
    return await prisma.follow_ups.findMany({
      where: {
        follow_up_date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { follow_up_date: 'asc' }
    });
  }
  
  async getFollowUpsByAssignedUser(userId: number): Promise<FollowUp[]> {
    console.log('Getting follow-ups for assigned user ID:', userId);
    return await prisma.follow_ups.findMany({
      where: { assigned_to: userId },
      orderBy: { follow_up_date: 'asc' }
    });
  }
  
  async getOverdueFollowUps(): Promise<FollowUp[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Getting overdue follow-ups: today is', today.toISOString());
    
    return await prisma.follow_ups.findMany({
      where: {
        follow_up_date: {
          lt: today
        },
        is_completed: false
      },
      orderBy: { follow_up_date: 'asc' }
    });
  }
  
  // Settings methods
  async getSetting(tenantId: number, key: string): Promise<string | null> {
    console.log('Get setting for tenantId:', tenantId, 'key:', key);
    const setting = await prisma.settings.findUnique({
      where: {
        tenant_id_key: {
          tenant_id: tenantId,
          key: key
        }
      }
    });
    
    return setting ? setting.value : null;
  }
  
  async getSettings(tenantId: number, keys: string[]): Promise<Record<string, string>> {
    console.log('Get settings for tenantId:', tenantId, 'keys:', keys);
    const settings = await prisma.settings.findMany({
      where: {
        tenant_id: tenantId,
        key: {
          in: keys
        }
      }
    });
    
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    console.log('Retrieved settings:', Object.keys(result).length);
    return result;
  }
  
  async updateSetting(tenantId: number, key: string, value: string): Promise<boolean> {
    console.log('Update setting for tenantId:', tenantId, 'key:', key, 'value length:', value ? value.length : 0);
    try {
      await prisma.settings.upsert({
        where: {
          tenant_id_key: {
            tenant_id: tenantId,
            key: key
          }
        },
        update: {
          value: value,
          updated_at: new Date()
        },
        create: {
          tenant_id: tenantId,
          key: key,
          value: value
        }
      });
      
      console.log('Setting updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  }
  
  async getOrganizationDetails(tenantId: number): Promise<{
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    gstin?: string;
    logo?: string;
  }> {
    console.log('Getting organization details for tenantId:', tenantId);
    const keys = [
      SETTINGS_KEYS.ORG_NAME,
      SETTINGS_KEYS.ORG_ADDRESS,
      SETTINGS_KEYS.ORG_PHONE,
      SETTINGS_KEYS.ORG_EMAIL,
      SETTINGS_KEYS.ORG_WEBSITE,
      SETTINGS_KEYS.ORG_GSTIN,
      SETTINGS_KEYS.ORG_LOGO
    ];
    
    const settings = await this.getSettings(tenantId, keys);
    
    const details = {
      name: settings[SETTINGS_KEYS.ORG_NAME] || 'Default Organization',
      address: settings[SETTINGS_KEYS.ORG_ADDRESS] || 'Default Address',
      phone: settings[SETTINGS_KEYS.ORG_PHONE] || 'Default Phone',
      email: settings[SETTINGS_KEYS.ORG_EMAIL] || 'Default Email',
      website: settings[SETTINGS_KEYS.ORG_WEBSITE],
      gstin: settings[SETTINGS_KEYS.ORG_GSTIN],
      logo: settings[SETTINGS_KEYS.ORG_LOGO]
    };
    
    console.log('Retrieved organization details', JSON.stringify({
      name: details.name,
      email: details.email,
      hasLogo: !!details.logo
    }));
    
    return details;
  }
}

// Create and export the storage instance
export const storage = new PrismaStorage();