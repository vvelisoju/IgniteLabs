import { Request, Response } from 'express';
import { StudentService } from '../../services/studentService';
import { insertStudentSchema, insertPaymentSchema } from '../../db/schema';
import { ZodError } from 'zod';

const studentService = new StudentService();

export const studentController = {
  /**
   * Get all students
   */
  async getAllStudents(req: Request, res: Response) {
    try {
      // Extract filter parameters
      const { batchId, isActive } = req.query;
      
      // Apply filters if provided
      const filters: any = {};
      
      if (batchId) {
        const batchIdNum = parseInt(batchId as string);
        if (!isNaN(batchIdNum)) {
          filters.batchId = batchIdNum;
        }
      }
      
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }
      
      const students = await studentService.getAllStudents(filters);
      res.json(students);
    } catch (error) {
      console.error('Error in getAllStudents controller:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  },

  /**
   * Get a student by ID
   */
  async getStudentById(req: Request, res: Response) {
    try {
      const studentId = parseInt(req.params.id);
      
      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      const student = await studentService.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      res.json(student);
    } catch (error) {
      console.error('Error in getStudentById controller:', error);
      res.status(500).json({ error: 'Failed to fetch student' });
    }
  },

  /**
   * Create a new student
   */
  async createStudent(req: Request, res: Response) {
    try {
      // Validate the request body
      const studentData = insertStudentSchema.parse(req.body);
      
      const newStudent = await studentService.createStudent(studentData);
      res.status(201).json(newStudent);
    } catch (error) {
      console.error('Error in createStudent controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to create student' });
    }
  },

  /**
   * Update a student
   */
  async updateStudent(req: Request, res: Response) {
    try {
      const studentId = parseInt(req.params.id);
      
      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      // Validate the request body (partial validation)
      const studentData = insertStudentSchema.partial().parse(req.body);
      
      const updatedStudent = await studentService.updateStudent(studentId, studentData);
      
      if (!updatedStudent) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      console.error('Error in updateStudent controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to update student' });
    }
  },

  /**
   * Delete a student
   */
  async deleteStudent(req: Request, res: Response) {
    try {
      const studentId = parseInt(req.params.id);
      
      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      const success = await studentService.deleteStudent(studentId);
      
      if (!success) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error in deleteStudent controller:', error);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  },

  /**
   * Get all payments for a student
   */
  async getStudentPayments(req: Request, res: Response) {
    try {
      const studentId = parseInt(req.params.id);
      
      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      // Check if student exists
      const student = await studentService.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      const payments = await studentService.getStudentPayments(studentId);
      res.json(payments);
    } catch (error) {
      console.error('Error in getStudentPayments controller:', error);
      res.status(500).json({ error: 'Failed to fetch student payments' });
    }
  },

  /**
   * Add a payment for a student
   */
  async addStudentPayment(req: Request, res: Response) {
    try {
      const studentId = parseInt(req.params.id);
      
      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      // Check if student exists
      const student = await studentService.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Omit studentId from validation as it will be provided from the URL parameter
      const { studentId: _, ...paymentDataWithoutStudentId } = insertPaymentSchema.parse(req.body);
      
      const newPayment = await studentService.addStudentPayment(studentId, paymentDataWithoutStudentId);
      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error in addStudentPayment controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to add student payment' });
    }
  },

  /**
   * Convert a lead to a student
   */
  async convertLeadToStudent(req: Request, res: Response) {
    try {
      const leadId = parseInt(req.params.leadId);
      
      if (isNaN(leadId)) {
        return res.status(400).json({ error: 'Invalid lead ID' });
      }
      
      // Validate the request body, but omit convertedFromLeadId as it will be set by the service
      const { convertedFromLeadId, ...studentDataWithoutLeadId } = insertStudentSchema.parse(req.body);
      
      const newStudent = await studentService.convertLeadToStudent(leadId, studentDataWithoutLeadId);
      res.status(201).json(newStudent);
    } catch (error) {
      console.error('Error in convertLeadToStudent controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to convert lead to student' });
    }
  }
};