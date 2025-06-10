import { db } from '../db';
import { students, NewStudent, Student, payments, Payment, NewPayment } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import Decimal from 'decimal.js';

/**
 * Service for managing student data
 */
export class StudentService {
  /**
   * Get all students with optional filtering
   */
  async getAllStudents(filters: Partial<Student> = {}): Promise<Student[]> {
    try {
      // Start with a basic query
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

  /**
   * Get a single student by ID
   */
  async getStudentById(id: number): Promise<Student | null> {
    try {
      const result = await db.select().from(students).where(eq(students.id, id));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching student with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new student
   */
  async createStudent(studentData: NewStudent): Promise<Student> {
    try {
      // Calculate fee due
      const totalFee = new Decimal(studentData.totalFee.toString());
      const feePaid = studentData.feePaid 
        ? new Decimal(studentData.feePaid.toString()) 
        : new Decimal(0);
      
      const feeDue = totalFee.minus(feePaid);
      
      // Create student with calculated fee due
      const newStudentData = {
        ...studentData,
        feeDue: feeDue.toString()
      };
      
      const result = await db.insert(students).values(newStudentData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  /**
   * Update an existing student
   */
  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | null> {
    try {
      // First check if the student exists
      const existingStudent = await this.getStudentById(id);
      
      if (!existingStudent) {
        return null;
      }
      
      // Calculate fee due if totalFee or feePaid is being updated
      if (studentData.totalFee !== undefined || studentData.feePaid !== undefined) {
        const totalFee = studentData.totalFee !== undefined 
          ? new Decimal(studentData.totalFee.toString()) 
          : new Decimal(existingStudent.totalFee.toString());
          
        const feePaid = studentData.feePaid !== undefined 
          ? new Decimal(studentData.feePaid.toString()) 
          : new Decimal(existingStudent.feePaid.toString());
          
        const feeDue = totalFee.minus(feePaid);
        
        // Update studentData with calculated feeDue
        studentData = {
          ...studentData,
          feeDue: feeDue.toString()
        };
      }
      
      // Add updatedAt timestamp
      const updatedStudent = {
        ...studentData,
        updatedAt: new Date(),
      };
      
      const result = await db
        .update(students)
        .set(updatedStudent)
        .where(eq(students.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error updating student with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a student by ID
   */
  async deleteStudent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(students).where(eq(students.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting student with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all payments for a student
   */
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

  /**
   * Create a new payment for a student
   */
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
        const currentFeePaid = new Decimal(student.feePaid.toString());
        const paymentAmount = new Decimal(paymentData.amount.toString());
        const totalFee = new Decimal(student.totalFee.toString());
        
        const newFeePaid = currentFeePaid.plus(paymentAmount);
        const newFeeDue = totalFee.minus(newFeePaid);
        
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

  /**
   * Convert a lead to a student
   */
  async convertLeadToStudent(leadId: number, studentData: Omit<NewStudent, 'convertedFromLeadId'>): Promise<Student> {
    try {
      // Create a new student with the lead ID reference
      const newStudentData: NewStudent = {
        ...studentData,
        convertedFromLeadId: leadId
      };
      
      return await this.createStudent(newStudentData);
    } catch (error) {
      console.error(`Error converting lead with ID ${leadId} to student:`, error);
      throw error;
    }
  }
}