import { db } from '../server/db';
import { 
  leads, batches, students, payments,
  type Lead, type Batch, type Student, type Payment,
  type NewLead, type NewBatch, type NewStudent, type NewPayment
} from './schema';
import { eq, and, asc } from 'drizzle-orm';

export interface IStorage {
  // Lead management
  getLeadById(id: number): Promise<Lead | null>;
  getAllLeads(filters?: Partial<Lead>): Promise<Lead[]>;
  createLead(leadData: NewLead): Promise<Lead>;
  updateLead(id: number, leadData: Partial<Lead>): Promise<Lead | null>;
  deleteLead(id: number): Promise<boolean>;
  
  // Batch management
  getBatchById(id: number): Promise<Batch | null>;
  getAllBatches(): Promise<Batch[]>;
  createBatch(batchData: NewBatch): Promise<Batch>;
  updateBatch(id: number, batchData: Partial<Batch>): Promise<Batch | null>;
  deleteBatch(id: number): Promise<boolean>;
  
  // Student management
  getStudentById(id: number): Promise<Student | null>;
  getAllStudents(filters?: Partial<Student>): Promise<Student[]>;
  createStudent(studentData: NewStudent): Promise<Student>;
  updateStudent(id: number, studentData: Partial<Student>): Promise<Student | null>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Convert lead to student
  convertLeadToStudent(leadId: number, studentData: Omit<NewStudent, 'convertedFromLeadId'>): Promise<Student>;
  
  // Payment management
  getStudentPayments(studentId: number): Promise<Payment[]>;
  addStudentPayment(studentId: number, paymentData: Omit<NewPayment, 'studentId'>): Promise<Payment>;
}

export class DatabaseStorage implements IStorage {
  // Lead management
  async getLeadById(id: number): Promise<Lead | null> {
    try {
      const result = await db.select().from(leads).where(eq(leads.id, id));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching lead with ID ${id}:`, error);
      throw error;
    }
  }

  async getAllLeads(filters: Partial<Lead> = {}): Promise<Lead[]> {
    try {
      let query = db.select().from(leads);
      
      // Apply filters if provided
      if (filters.status) {
        query = query.where(eq(leads.status, filters.status));
      }
      
      // Add additional filters as needed
      
      const results = await query.orderBy(asc(leads.createdAt));
      return results;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  async createLead(leadData: NewLead): Promise<Lead> {
    try {
      const result = await db.insert(leads).values(leadData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async updateLead(id: number, leadData: Partial<Lead>): Promise<Lead | null> {
    try {
      // Add updatedAt timestamp
      const updatedData = {
        ...leadData,
        updatedAt: new Date()
      };
      
      const result = await db
        .update(leads)
        .set(updatedData)
        .where(eq(leads.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error updating lead with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteLead(id: number): Promise<boolean> {
    try {
      const result = await db.delete(leads).where(eq(leads.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting lead with ID ${id}:`, error);
      throw error;
    }
  }

  // Batch management
  async getBatchById(id: number): Promise<Batch | null> {
    try {
      const result = await db.select().from(batches).where(eq(batches.id, id));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching batch with ID ${id}:`, error);
      throw error;
    }
  }

  async getAllBatches(): Promise<Batch[]> {
    try {
      const results = await db.select().from(batches);
      return results;
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw error;
    }
  }

  async createBatch(batchData: NewBatch): Promise<Batch> {
    try {
      const result = await db.insert(batches).values(batchData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  async updateBatch(id: number, batchData: Partial<Batch>): Promise<Batch | null> {
    try {
      const result = await db
        .update(batches)
        .set(batchData)
        .where(eq(batches.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error updating batch with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteBatch(id: number): Promise<boolean> {
    try {
      const result = await db.delete(batches).where(eq(batches.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting batch with ID ${id}:`, error);
      throw error;
    }
  }

  // Student management
  async getStudentById(id: number): Promise<Student | null> {
    try {
      const result = await db.select().from(students).where(eq(students.id, id));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching student with ID ${id}:`, error);
      throw error;
    }
  }

  async getAllStudents(filters: Partial<Student> = {}): Promise<Student[]> {
    try {
      let query = db.select().from(students);
      
      // Apply filters if provided
      if (filters.batchId) {
        query = query.where(eq(students.batchId, filters.batchId));
      }
      
      if (filters.isActive !== undefined) {
        query = query.where(eq(students.isActive, filters.isActive));
      }
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async createStudent(studentData: NewStudent): Promise<Student> {
    try {
      const result = await db.insert(students).values(studentData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | null> {
    try {
      // Add updatedAt timestamp
      const updatedData = {
        ...studentData,
        updatedAt: new Date()
      };
      
      const result = await db
        .update(students)
        .set(updatedData)
        .where(eq(students.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error updating student with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(students).where(eq(students.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting student with ID ${id}:`, error);
      throw error;
    }
  }

  // Convert lead to student
  async convertLeadToStudent(leadId: number, studentData: Omit<NewStudent, 'convertedFromLeadId'>): Promise<Student> {
    try {
      // Get the lead
      const lead = await this.getLeadById(leadId);
      
      if (!lead) {
        throw new Error(`Lead with ID ${leadId} not found`);
      }
      
      // Create new student with lead information
      const newStudentData: NewStudent = {
        ...studentData,
        convertedFromLeadId: leadId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || ''
      };
      
      // Create the student
      const student = await this.createStudent(newStudentData);
      
      // Update lead status to 'converted'
      await this.updateLead(leadId, { status: 'converted' });
      
      return student;
    } catch (error) {
      console.error(`Error converting lead with ID ${leadId} to student:`, error);
      throw error;
    }
  }

  // Payment management
  async getStudentPayments(studentId: number): Promise<Payment[]> {
    try {
      const result = await db
        .select()
        .from(payments)
        .where(eq(payments.studentId, studentId))
        .orderBy(payments.paymentDate);
      
      return result;
    } catch (error) {
      console.error(`Error fetching payments for student ID ${studentId}:`, error);
      throw error;
    }
  }

  async addStudentPayment(studentId: number, paymentData: Omit<NewPayment, 'studentId'>): Promise<Payment> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Add payment
        const newPayment = {
          ...paymentData,
          studentId
        };
        
        const paymentResult = await tx
          .insert(payments)
          .values(newPayment)
          .returning();
        
        // Get current student data
        const [student] = await tx
          .select()
          .from(students)
          .where(eq(students.id, studentId));
        
        if (!student) {
          throw new Error(`Student with ID ${studentId} not found`);
        }
        
        // Update student's feePaid and feeDue fields
        const currentFeePaid = Number(student.feePaid);
        const paymentAmount = Number(paymentData.amount);
        const totalFee = Number(student.totalFee);
        
        const newFeePaid = currentFeePaid + paymentAmount;
        const newFeeDue = totalFee - newFeePaid;
        
        // Update student record
        await tx
          .update(students)
          .set({
            feePaid: newFeePaid.toString(),
            feeDue: newFeeDue.toString(),
            updatedAt: new Date()
          })
          .where(eq(students.id, studentId));
        
        return paymentResult[0];
      });
    } catch (error) {
      console.error(`Error adding payment for student ID ${studentId}:`, error);
      throw error;
    }
  }
}