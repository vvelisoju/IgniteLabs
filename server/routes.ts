import express, { Request, Response, NextFunction, Express } from 'express';
import { createServer, Server } from 'http';
import { storage } from './storage';
import { setupAuth, isAuthenticated, isAdmin, isManager, isTrainer, isStudent, hashPassword } from './auth';
import authRouter from './middleware/auth-router';
import trainerRouter from './middleware/trainer-router';
import studentRouter from './middleware/student-router';
import { prisma } from './prisma';
import { generateInvoice, generateInvoiceBuffer } from './utils/invoiceGenerator_with_terms';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { emailService } from './services/email.service';
import { 
  insertLeadSchema, 
  insertStudentSchema, 
  insertBatchSchema, 
  insertPaymentSchema,
  insertFollowUpSchema,
  insertFollowUpCommentSchema
} from '../shared/schema';

// Enum values from Prisma schema
const leadStatusEnum = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  DROPPED: 'dropped',
  CONVERTED: 'converted'
};

const paymentMethodEnum = {
  CASH: 'cash',
  CHECK: 'check',
  BANK_TRANSFER: 'bank_transfer',
  ONLINE: 'online',
  OTHER: 'other'
};

// Settings keys
const SETTINGS_KEYS = {
  MAILGUN_API_KEY: 'mailgun_api_key',
  MAILGUN_DOMAIN: 'mailgun_domain',
  MAILGUN_FROM_EMAIL: 'mailgun_from_email',
  COMPANY_NAME: 'company_name',
  COMPANY_ADDRESS: 'company_address',
  COMPANY_PHONE: 'company_phone',
  COMPANY_EMAIL: 'company_email',
  COMPANY_WEBSITE: 'company_website',
  COMPANY_LOGO: 'company_logo',
  INVOICE_TERMS: 'invoice_terms'
};

// Set up multer for file uploads
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve('./uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const logoUpload = multer({ 
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with passport and session
  setupAuth(app);
  
  // Register auth router for /api/auth endpoints
  app.use('/api/auth', authRouter);
  
  // Register role-specific routers
  app.use('/api/trainer', trainerRouter);
  app.use('/api/student', studentRouter);

  // Helper to handle async route handlers
  const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Lead management endpoints - Admin/Manager access only
  app.get('/api/leads', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const filters = req.query as any;
    const leads = await storage.getAllLeads(filters);
    res.json(leads);
  }));

  app.get('/api/leads/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const lead = await storage.getLeadById(Number(req.params.id));
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  }));

  // Allow public lead registration (no authentication required)
app.post('/api/leads', asyncHandler(async (req: Request, res: Response) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      
      // Set the default tenant to 1 for public leads
      if (!leadData.tenant_id) {
        leadData.tenant_id = 1;
      }
      
      const lead = await storage.createLead(leadData);
      
      console.log('Lead created successfully:', lead.id, lead.name, lead.email);
      
      // Send email notification to admin about new lead
      try {
        // Check if Mailgun is initialized
        console.log('Attempting to send lead notification email');
        
        // Get email settings before sending
        const emailEnabled = await emailService.isEmailEnabled(lead.tenant_id || 1);
        const notificationType = await emailService.isNotificationTypeEnabled(
          SETTINGS_KEYS.EMAIL_ADMIN_LEAD_NOTIFICATION, 
          lead.tenant_id || 1
        );
        
        console.log('Email notification settings:', {
          emailEnabled, 
          leadNotificationsEnabled: notificationType
        });
        
        // Force reinitialization of Mailgun client
        await emailService.initializeMailgun(lead.tenant_id || 1);
        
        // Send the notification
        const sent = await emailService.sendLeadNotificationEmail(
          lead.name,
          lead.email || '',
          lead.phone,
          lead.source || 'Website',
          lead.tenant_id || 1
        );
        
        console.log('Lead notification email sent:', sent);
      } catch (emailError) {
        console.error('Failed to send lead notification email:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(lead);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      res.status(400).json({ error: error.message });
    }
  }));

  // Allow public lead updates (no authentication required)
  app.put('/api/leads/:id', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const id = Number(req.params.id);
      const leadData = req.body;
      
      console.log('Received lead update request:', JSON.stringify({
        id,
        data: leadData
      }));
      
      // Validate status if provided
      if (leadData.status && !Object.values(leadStatusEnum).includes(leadData.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      const updatedLead = await storage.updateLead(id, leadData);
      if (!updatedLead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      console.log('Lead updated successfully:', updatedLead.id);
      res.json(updatedLead);
    } catch (error: any) {
      console.error('Error updating lead:', error);
      res.status(400).json({ error: error.message });
    }
  }));

  app.delete('/api/leads/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteLead(id);
    if (!success) {
      return res.status(404).json({ error: 'Lead not found or could not be deleted' });
    }
    res.status(204).send();
  }));

  // Student management endpoints - Admin/Manager access only
  app.get('/api/students', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const filters = req.query as any;
    
    // Default to active students if isActive filter is not explicitly set
    if (filters.isActive === undefined) {
      filters.isActive = true;
    } else if (filters.isActive === 'false') {
      filters.isActive = false;
    } else if (filters.isActive === 'true') {
      filters.isActive = true;
    }
    
    const students = await storage.getAllStudents(filters);
    res.json(students);
  }));

  app.get('/api/students/:id', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const student = await storage.getStudentById(Number(req.params.id));
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  }));

  app.post('/api/students', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('Create student request body:', req.body);
      
      // Transform request data to match expected format
      // Handle different field name conventions and ensure consistent types
      
      // Parse total fee from any of the possible field names, ensuring string conversion
      const totalFeeRaw = req.body.total_fee || req.body.totalFee || req.body.totalFees || req.body.feeTotal || 0;
      const totalFee = String(totalFeeRaw); // Convert to string for consistency
      
      // Parse initial payment, ensuring string conversion
      const initialPaymentRaw = req.body.fee_paid || req.body.feePaid || req.body.initialPayment || 0;
      const initialPayment = String(initialPaymentRaw);
      
      // Calculate fee due, ensuring string conversion
      const totalFeeNum = parseFloat(totalFee);
      const initialPaymentNum = parseFloat(initialPayment);
      const feeDue = Math.max(0, totalFeeNum - initialPaymentNum);
      
      console.log('Fee calculations:', {
        totalFeeRaw,
        totalFee,
        totalFeeNum,
        initialPaymentRaw,
        initialPayment,
        initialPaymentNum,
        feeDue
      });

      // Handle batch ID with special care
      let batchId = req.body.batch_id || req.body.batchId || req.body.batch;
      if (typeof batchId === 'string') {
        batchId = parseInt(batchId, 10);
        if (isNaN(batchId)) {
          return res.status(400).json({ error: 'Invalid batch ID format' });
        }
      }
      if (!batchId || batchId <= 0) {
        return res.status(400).json({ error: 'Valid batch ID is required' });
      }

      const studentData = {
        name: req.body.studentName || req.body.name || 'New Student',
        phone: req.body.phone || '',
        email: req.body.email || null,
        parent_mobile: req.body.parentMobile || req.body.parent_mobile || null,
        enrollment_date: new Date(req.body.enrollmentDate || new Date()),
        batch_id: batchId,
        total_fee: totalFee,
        fee_due: String(feeDue), // Convert to string for consistency
        fee_paid: initialPayment,
        status: req.body.status || req.body.enrollmentStatus || 'active',
        notes: req.body.notes || null,
        tenant_id: req.user?.tenant_id || 1,
        // Additional fields for payment processing
        initialPayment: initialPayment,
        paymentMethod: req.body.paymentMethod || 'cash',
        paymentNotes: req.body.paymentNotes,
        reference: req.body.reference
      };
      
      console.log('Transformed student data:', studentData);
      
      try {
        const student = await storage.createStudent(studentData);
        
        // Get batch details for email
        const batch = student.batch_id ? await storage.getBatchById(student.batch_id) : null;
        if (batch && student.email) {
          // Format the date
          const startDate = new Date(batch.start_date).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          });
          
          // Send registration confirmation email
          try {
            await emailService.sendStudentRegistrationEmail(
              student.email,
              student.name,
              batch.name,
              startDate,
              student.tenant_id || 1
            );
          } catch (emailError) {
            console.error('Failed to send student registration email:', emailError);
            // Don't fail the request if email fails
          }
        }
        
        res.status(201).json(student);
      } catch (createError: any) {
        // Check if this is a unique constraint violation on phone
        if (createError.code === 'P2002' && 
            createError.meta && 
            createError.meta.target && 
            createError.meta.target.includes('phone')) {
          
          console.log('Student creation failed due to duplicate phone number. Attempting to resolve...');
          
          // First try to truncate the duplicate data
          const phone = studentData.phone;
          const truncated = await storage.truncateDuplicateStudents(phone);
          
          if (truncated) {
            console.log('Successfully truncated duplicate students. Retrying creation...');
            
            // Retry student creation after truncation
            try {
              const student = await storage.createStudent(studentData);
              
              // Get batch details for email
              const batch = student.batch_id ? await storage.getBatchById(student.batch_id) : null;
              if (batch && student.email) {
                // Format the date
                const startDate = new Date(batch.start_date).toLocaleDateString('en-US', {
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                });
                
                // Send registration confirmation email
                try {
                  await emailService.sendStudentRegistrationEmail(
                    student.email,
                    student.name,
                    batch.name,
                    startDate,
                    student.tenant_id || 1
                  );
                } catch (emailError) {
                  console.error('Failed to send student registration email:', emailError);
                }
              }
              
              return res.status(201).json(student);
            } catch (retryError) {
              console.error('Failed to create student after truncation:', retryError);
              // If retry fails, continue to normal error flow
            }
          }
          
          // If truncation didn't work or there was an error retrying, find existing student
          try {
            const students = await prisma.$queryRaw`SELECT * FROM students WHERE phone = ${studentData.phone}`;
            
            if (students && students.length > 0) {
              return res.status(409).json({ 
                error: "Failed to create enrollment: Unique constraint failed on the fields: (`phone`)", 
                duplicateFound: true,
                existingStudent: students[0]
              });
            }
          } catch (findError) {
            console.error('Error finding existing student:', findError);
          }
        }
        
        // If it's another error or we can't find the duplicate, throw the original error
        throw createError;
      }
    } catch (error: any) {
      console.error('Error creating student:', error);
      res.status(400).json({ 
        error: error.message || "Failed to create enrollment" 
      });
    }
  }));

  app.put('/api/students/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const id = Number(req.params.id);
      const studentData = req.body;
      const updatedStudent = await storage.updateStudent(id, studentData);
      if (!updatedStudent) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      res.json(updatedStudent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }));

  app.delete('/api/students/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const success = await storage.deleteStudent(id);
    if (!success) {
      return res.status(404).json({ error: 'Student not found or could not be deleted' });
    }
    res.status(204).send();
  }));
  
  // Handle enrollment updates (alias for students update) - Admin/Manager access only
  app.put('/api/enrollments/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const studentData = req.body;
      
      // Cache control - force fresh data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Log the incoming data for debugging
      console.log('Enrollment update - Raw received data:', JSON.stringify(studentData));
      
      // Ensure fee fields are properly handled
      // The incoming data might have various property names for the same values
      const processedData: any = { ...studentData };
      
      // Handle totalFee field
      if ('total_fee' in studentData) {
        processedData.total_fee = studentData.total_fee;
      } else if ('totalFee' in studentData) {
        processedData.total_fee = studentData.totalFee;
      } else if ('totalFees' in studentData) {
        processedData.total_fee = studentData.totalFees;
      }
      
      // Handle feePaid field
      if ('fee_paid' in studentData) {
        processedData.fee_paid = studentData.fee_paid;
      } else if ('feePaid' in studentData) {
        processedData.fee_paid = studentData.feePaid;
      } else if ('amountPaid' in studentData) {
        processedData.fee_paid = studentData.amountPaid;
      }
      
      // Calculate feeDue if totalFee and feePaid are present
      if (processedData.total_fee !== undefined && processedData.fee_paid !== undefined) {
        const totalFee = parseFloat(processedData.total_fee);
        const feePaid = parseFloat(processedData.fee_paid);
        
        if (!isNaN(totalFee) && !isNaN(feePaid)) {
          processedData.fee_due = Math.max(0, totalFee - feePaid).toString();
        }
      }
      
      console.log('Enrollment update - Processed data:', JSON.stringify(processedData));
      
      const updatedStudent = await storage.updateStudent(id, processedData);
      if (!updatedStudent) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }
      
      res.json(updatedStudent);
    } catch (error: any) {
      console.error('Error updating enrollment:', error);
      res.status(400).json({ error: error.message });
    }
  }));

  // Lead conversion endpoint - Admin/Manager access only
  app.post('/api/leads/:id/convert', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
      
    try {
      const leadId = Number(req.params.id);
      const studentData = req.body;

      console.log('Lead conversion request body:', studentData);
      
      // Validate the input
      if (!studentData.batch || !studentData.enrollmentDate || !studentData.totalFee) {
        return res.status(400).json({ error: 'Missing required fields (batch, enrollmentDate, totalFee)' });
      }
      
      // Validate payment data if initial payment is provided
      if (studentData.initialPayment && !studentData.paymentMethod) {
        return res.status(400).json({ error: 'Payment method is required when initial payment is provided' });
      }
      
      // Make sure reference field is present (can be empty) for database compatibility
      if (studentData.initialPayment && studentData.reference === undefined) {
        studentData.reference = '';
      }
      
      // Calculate total fee and fee due
      const totalFee = studentData.totalFee;
      const initialPayment = studentData.initialPayment || 0;
      const feeDue = Math.max(0, totalFee - initialPayment);

      // Convert the batch field to batch_id for database compatibility with prisma schema
      const formattedStudentData = {
        ...studentData,
        batch_id: Number(studentData.batch), // Map batch to batch_id (snake_case for Prisma)
        fee_due: feeDue, // Add fee_due field required by the model
        fee_paid: initialPayment || 0 // Explicitly set fee_paid field
      };
      
      // Remove the batch field as it's not in our database schema
      delete formattedStudentData.batch;
      
      console.log('Formatted student data:', formattedStudentData);
      
      // Convert lead to student
      const student = await storage.convertLeadToStudent(leadId, formattedStudentData);
      
      // Send registration email if student has an email
      if (student.email) {
        // Get batch details for email
        console.log('Looking up batch details for student with batch_id:', student.batch_id);
        const batch = await storage.getBatchById(student.batch_id); // Use snake_case from Prisma DB
        
        if (batch) {
          console.log('Found batch:', { 
            id: batch.id, 
            name: batch.name, 
            startDate: batch.start_date 
          });
          
          // Format the date - ensure we handle camelCase vs snake_case
          const startDate = new Date(batch.start_date).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          });
          
          console.log('Sending registration email to:', student.email, 'batch:', batch.name);
          
          // Send registration confirmation email
          try {
            await emailService.sendStudentRegistrationEmail(
              student.email,
              student.name,
              batch.name,
              startDate,
              student.tenant_id || 1 // Use snake_case from Prisma DB
            );
          } catch (emailError) {
            console.error('Failed to send student registration email:', emailError);
            // Don't fail the request if email fails
          }
        }
      }
      
      res.status(201).json(student);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }));

  // Payment management endpoints
  app.get('/api/students/:id/payments', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const studentId = Number(req.params.id);
    
    // Check if student exists
    const student = await storage.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const payments = await storage.getStudentPayments(studentId);
    res.json(payments);
  }));

  // Direct payments endpoint for working with enrollments - Admin/Manager access only
  app.post('/api/payments', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const paymentData = req.body;
      
      // Validate enrollmentId and studentId are present and are numbers
      if (!paymentData.enrollmentId || isNaN(Number(paymentData.enrollmentId))) {
        return res.status(400).json({ error: 'Valid enrollmentId is required' });
      }
      
      const enrollmentId = Number(paymentData.enrollmentId);
      
      // Since we may not have a direct enrollments table, we'll look up the student directly
      // Get the student using the studentId in the payload or from the enrollment
      let studentId = paymentData.studentId;
      
      // If no studentId is provided, find the student by checking enrollments
      if (!studentId) {
        // This logic assumes that the enrollmentId is the same as the studentId
        studentId = enrollmentId;
      }
      
      // Check if student exists
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found for this enrollment' });
      }
      
      // Add studentId to the payment data
      const completePaymentData = {
        ...paymentData,
        studentId: studentId,
        enrollmentId: enrollmentId,
        amount: paymentData.amount, // Keep as string as expected by schema
      };
      
      // Validate payment method if provided
      if (completePaymentData.paymentMethod && !Object.values(paymentMethodEnum).includes(completePaymentData.paymentMethod)) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
      
      try {
        // Ensure amount is a string before validation
        if (typeof completePaymentData.amount === 'number') {
          completePaymentData.amount = String(completePaymentData.amount);
        }
        
        const validatedPaymentData = insertPaymentSchema.parse(completePaymentData);
        // Record the payment
        const payment = await storage.recordPayment(validatedPaymentData);
        
        // Send email receipt if student has an email
        if (student.email) {
          // Get batch details
          console.log('Looking up batch details for payment receipt - student with batch_id:', student.batch_id);
          const batch = await storage.getBatchById(student.batch_id); // Use snake_case from Prisma DB
          
          if (batch) {
            console.log('Found batch for payment receipt:', { 
              id: batch.id, 
              name: batch.name
            });
            
            // Format the payment date
            const paymentDate = new Date(payment.payment_date).toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            });
            
            console.log('Sending payment receipt email to:', student.email, 'batch:', batch.name);
            
            // Send payment receipt email
            try {
              await emailService.sendPaymentReceiptEmail(
                student.email,
                student.name,
                payment.amount.toString(),
                paymentDate,
                batch.name,
                student.fee_due.toString(), // Use snake_case from Prisma DB
                student.tenant_id || 1 // Use snake_case from Prisma DB
              );
            } catch (emailError) {
              console.error('Failed to send payment receipt email:', emailError);
              // Don't fail the request if email fails
            }
          }
        }
        
        res.status(201).json(payment);
      } catch (validationError: any) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ error: `Validation error: ${validationError.message}` });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      res.status(400).json({ error: error.message });
    }
  }));
  
  // Get a single payment by ID - Authentication required
  app.get('/api/payments/:id', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ error: 'Invalid payment ID' });
      }
      
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      res.json(payment);
    } catch (error: any) {
      console.error('Error retrieving payment:', error);
      res.status(500).json({ error: error.message });
    }
  }));

  // Payment update endpoint - Admin/Manager access only
  app.put('/api/payments/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const paymentId = Number(req.params.id);
      
      // Check if payment exists
      const existingPayment = await storage.getPaymentById(paymentId);
      if (!existingPayment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      // Get payment data to update
      const paymentData = req.body;
      console.log('Payment update data received:', paymentData);
      
      // Validate payment method if provided
      if (paymentData.paymentMethod && !Object.values(paymentMethodEnum).includes(paymentData.paymentMethod)) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
      
      // Update the payment
      const updatedPayment = await storage.updatePayment(paymentId, paymentData);
      
      if (!updatedPayment) {
        return res.status(500).json({ error: 'Failed to update payment' });
      }
      
      // Send updated payment response
      res.json(updatedPayment);
    } catch (error: any) {
      console.error('Payment update error:', error);
      res.status(400).json({ error: error.message });
    }
  }));

  // Student payments endpoint (by student ID) - Admin/Manager access only
  app.post('/api/students/:id/payments', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const studentId = Number(req.params.id);
      
      // Check if student exists
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Validate the payment data
      const paymentData = {
        ...req.body,
        studentId
      };
      
      // Validate payment method if provided
      if (paymentData.paymentMethod && !Object.values(paymentMethodEnum).includes(paymentData.paymentMethod)) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
      
      // Ensure amount is a string before validation
      if (typeof paymentData.amount === 'number') {
        paymentData.amount = String(paymentData.amount);
      }
        
      const validatedPaymentData = insertPaymentSchema.parse(paymentData);
      
      // Record the payment
      const payment = await storage.recordPayment(validatedPaymentData);
      
      // Send email receipt if student has an email
      if (student.email) {
        // Get batch details
        const batch = await storage.getBatchById(student.batch_id); // Use snake_case from Prisma DB
        if (batch) {
          // Format the payment date
          const paymentDate = new Date(payment.payment_date || payment.paymentDate).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          });
          
          console.log('Sending payment receipt email to:', student.email, 'batch:', batch.name);
          
          // Send payment receipt email
          try {
            await emailService.sendPaymentReceiptEmail(
              student.email,
              student.name,
              payment.amount.toString(),
              paymentDate,
              batch.name,
              student.fee_due.toString(), // Use snake_case from Prisma DB
              student.tenant_id || 1 // Use snake_case from Prisma DB
            );
          } catch (emailError) {
            console.error('Failed to send payment receipt email:', emailError);
            // Don't fail the request if email fails
          }
        }
      }
      
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }));

  // Follow-up management endpoints
  app.get('/api/follow-ups', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const filters = req.query as any;
    const followUps = await storage.getAllFollowUps(filters);
    res.json(followUps);
  }));
  
  // Follow-up analytics and scheduling endpoints
  // These specific routes need to come before the /:id route to avoid conflicts
  app.get('/api/follow-ups/schedule/today', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const today = new Date();
    const followUps = await storage.getFollowUpsByDate(today);
    res.json(followUps);
  }));

  app.get('/api/follow-ups/schedule/range', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;
      
      if (!startDateStr || !endDateStr) {
        return res.status(400).json({ error: 'Both startDate and endDate query parameters are required' });
      }
      
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD format.' });
      }
      
      const followUps = await storage.getFollowUpsByDateRange(startDate, endDate);
      res.json(followUps);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }));

  app.get('/api/follow-ups/assigned/:userId', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const userId = Number(req.params.userId);
    
    // Check if user exists
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const followUps = await storage.getFollowUpsByAssignedUser(userId);
    res.json(followUps);
  }));

  app.get('/api/follow-ups/overdue', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const overdueFollowUps = await storage.getOverdueFollowUps();
    res.json(overdueFollowUps);
  }));

  // This more general route should come after all specific /follow-ups/ routes
  app.get('/api/follow-ups/:id', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const followUp = await storage.getFollowUpById(Number(req.params.id));
    if (!followUp) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    res.json(followUp);
  }));

  app.get('/api/leads/:id/follow-ups', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const leadId = Number(req.params.id);
    
    // Check if lead exists
    const lead = await storage.getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const followUps = await storage.getLeadFollowUps(leadId);
    res.json(followUps);
  }));

  app.post('/api/follow-ups', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const followUpData = insertFollowUpSchema.parse(req.body);
      
      // Check if lead exists
      const lead = await storage.getLeadById(followUpData.lead_id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      const followUp = await storage.createFollowUp(followUpData);
      res.status(201).json(followUp);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }));

  app.put('/api/follow-ups/:id', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const id = Number(req.params.id);
      const followUpData = req.body;
      
      const updatedFollowUp = await storage.updateFollowUp(id, followUpData);
      if (!updatedFollowUp) {
        return res.status(404).json({ error: 'Follow-up not found' });
      }
      
      res.json(updatedFollowUp);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }));

  app.delete('/api/follow-ups/:id', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const id = Number(req.params.id);
    const success = await storage.deleteFollowUp(id);
    if (!success) {
      return res.status(404).json({ error: 'Follow-up not found or could not be deleted' });
    }
    res.status(204).send();
  }));

  app.post('/api/follow-ups/:id/complete', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const id = Number(req.params.id);
    const completedFollowUp = await storage.completeFollowUp(id);
    if (!completedFollowUp) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    res.json(completedFollowUp);
  }));

  // Follow-up comments endpoints
  app.get('/api/follow-ups/:id/comments', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const followUpId = Number(req.params.id);
    
    // Check if follow-up exists
    const followUp = await storage.getFollowUpById(followUpId);
    if (!followUp) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    
    const comments = await storage.getFollowUpComments(followUpId);
    res.json(comments);
  }));

  app.post('/api/follow-ups/:id/comments', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const followUpId = Number(req.params.id);
      
      // Check if follow-up exists
      const followUp = await storage.getFollowUpById(followUpId);
      if (!followUp) {
        return res.status(404).json({ error: 'Follow-up not found' });
      }
      
      const commentData = {
        ...req.body,
        followUpId
      };
      
      const validatedCommentData = insertFollowUpCommentSchema.parse(commentData);
      const comment = await storage.addFollowUpComment(validatedCommentData);
      
      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }));

  // Batch management endpoints
  app.get('/api/batches', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const batches = await storage.getAllBatches();
    res.json(batches);
  }));
  
  app.get('/api/batches/active', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const batches = await storage.getAllBatches();
    const activeBatches = batches.filter(batch => batch.is_active);
    res.json(activeBatches);
  }));
  
  app.get('/api/batches/upcoming', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const today = new Date();
    const batches = await storage.getAllBatches();
    
    // Filter for batches that:
    // 1. Are active
    // 2. Start date is today or in the future
    const upcomingBatches = batches.filter(batch => {
      const startDate = new Date(batch.start_date);
      return batch.is_active && startDate >= today;
    });
    
    // Sort by start date (ascending)
    upcomingBatches.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    
    // For each batch, include the trainer information
    const upcomingBatchesWithTrainers = await Promise.all(upcomingBatches.map(async (batch) => {
      if (batch.trainer_id) {
        const trainer = await storage.getUserById(batch.trainer_id);
        return {
          ...batch,
          trainerName: trainer?.name || 'TBD',
          trainerSpecialization: trainer?.specialization || ''
        };
      }
      return {
        ...batch,
        trainerName: 'TBD',
        trainerSpecialization: ''
      };
    }));
    
    res.json(upcomingBatchesWithTrainers);
  }));

  app.get('/api/batches/:id', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const batch = await storage.getBatchById(Number(req.params.id));
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json(batch);
  }));

  app.post('/api/batches', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      console.log('Create batch request body:', req.body);

      // Pass through the request data in its original format
      // The storage layer will handle the transformation
      const batchData = {
        name: req.body.name,
        description: req.body.description || null,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        fee: req.body.fee,
        capacity: req.body.capacity || 20,
        is_active: req.body.is_active === undefined ? true : req.body.is_active,
        trainer_id: req.body.trainer_id || null,
        tenant_id: req.user?.tenant_id || 1
      };

      // Create the batch
      console.log('Transformed batch data:', batchData);
      const batch = await storage.createBatch(batchData);
      res.status(201).json(batch);
    } catch (error: any) {
      console.error('Error creating batch:', error);
      res.status(400).json({ error: error.message });
    }
  }));

  app.put('/api/batches/:id', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const id = Number(req.params.id);
      
      // Transform data with correct field names
      const batchData = {
        name: req.body.name,
        description: req.body.description || null,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        fee: req.body.fee,
        capacity: req.body.capacity || 20,
        is_active: req.body.is_active === undefined ? true : req.body.is_active,
        trainer_id: req.body.trainer_id || null,
        tenant_id: req.user?.tenant_id || 1
      };
      
      const updatedBatch = await storage.updateBatch(id, batchData);
      if (!updatedBatch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      res.json(updatedBatch);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }));

  app.delete('/api/batches/:id', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const id = Number(req.params.id);
    const success = await storage.deleteBatch(id);
    if (!success) {
      return res.status(404).json({ error: 'Batch not found or could not be deleted' });
    }
    res.status(204).send();
  }));

  // Get trainers for batch assignment
  app.get('/api/users/trainers', asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const users = await storage.getUsersByRole('trainer');
    
    // Transform user data to match the expected trainer interface
    const trainers = users.map(user => {
      // Create a new object with defaults for missing values
      return {
        ...user,
        phone: user.phone || '', // Default to empty string if not present
        specialization: user.specialization || '', // Default to empty string if not present
        bio: user.bio || '', // Default to empty string if not present
        status: user.status || 'active' // Default to 'active' if not present
      };
    });
    
    res.json(trainers);
  }));
  
  // Create a new trainer
  app.post('/api/trainers', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      // Create a new user with trainer role
      const userData = {
        ...req.body,
        role: 'trainer'
      };
      
      console.log('Create trainer request body:', req.body);
      
      // Check if username already exists
      if (userData.username) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          return res.status(400).json({ 
            error: `Username '${userData.username}' already exists. Please use a different username.` 
          });
        }
      }
      
      // Check if email already exists (if provided)
      if (userData.email) {
        const existingUsers = await storage.getUsersByEmail(userData.email);
        if (existingUsers && existingUsers.length > 0) {
          return res.status(400).json({ 
            error: `Email '${userData.email}' is already associated with another account. Please use a different email.` 
          });
        }
      }

      // Ensure password is hashed
      if (userData.password && !userData.password.includes('$')) {
        userData.password = await hashPassword(userData.password);
      }
      
      const trainer = await storage.createUser(userData);
      
      // Transform user data to match the expected trainer interface
      const trainerData = {
        ...trainer,
        phone: trainer.phone || '', // Default to empty string if not present
        specialization: trainer.specialization || '', // Default to empty string if not present
        bio: trainer.bio || '', // Default to empty string if not present
        status: trainer.status || 'active' // Default to 'active' if not present
      };
      
      res.status(201).json(trainerData);
    } catch (error: any) {
      console.error('Error creating trainer:', error);
      res.status(400).json({ error: error.message });
    }
  }));
  
  // Get trainer by ID - Authentication required
  app.get('/api/trainers/:id', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const id = Number(req.params.id);
    const user = await storage.getUserById(id);
    
    if (!user || user.role !== 'trainer') {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    // Transform user data to match the expected trainer interface
    const trainerData = {
      ...user,
      phone: user.phone || '', // Default to empty string if not present
      specialization: user.specialization || '', // Default to empty string if not present
      bio: user.bio || '', // Default to empty string if not present
      status: user.status || 'active' // Default to 'active' if not present
    };
    
    res.json(trainerData);
  }));
  
  // Update trainer - Admin/Manager access only
  app.put('/api/trainers/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const id = Number(req.params.id);
    const user = await storage.getUserById(id);
    
    if (!user || user.role !== 'trainer') {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    // Prevent changing role from trainer
    const userData = {
      ...req.body,
      role: 'trainer'
    };
    
    const updatedTrainer = await storage.updateUser(id, userData);
    
    // Transform updated user data to match the expected trainer interface
    const trainerData = updatedTrainer ? {
      ...updatedTrainer,
      phone: updatedTrainer.phone || '', // Default to empty string if not present
      specialization: updatedTrainer.specialization || '', // Default to empty string if not present
      bio: updatedTrainer.bio || '', // Default to empty string if not present
      status: updatedTrainer.status || 'active' // Default to 'active' if not present
    } : {};
    
    res.json(trainerData);
  }));
  
  // Delete trainer - Admin/Manager access only
  app.delete('/api/trainers/:id', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const id = Number(req.params.id);
    const user = await storage.getUserById(id);
    
    if (!user || user.role !== 'trainer') {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    // Check if trainer is assigned to any batches
    const assignedBatches = await storage.getBatchesByTrainer(id);
    if (assignedBatches.length > 0) {
      return res.status(400).json({ 
        error: 'Trainer cannot be deleted because they are assigned to batches',
        batches: assignedBatches
      });
    }
    
    const success = await storage.deleteUser(id);
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete trainer' });
    }
    
    res.status(204).send();
  }));
  
  // Get batches assigned to a trainer - Authentication required
  app.get('/api/trainers/:id/batches', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    // Cache control - force fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const id = Number(req.params.id);
    const user = await storage.getUserById(id);
    
    if (!user || user.role !== 'trainer') {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    const batches = await storage.getBatchesByTrainer(id);
    res.json(batches);
  }));

  // Invoice PDF endpoints - Require authentication
  app.get('/api/invoices/:paymentId', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      
      // Get payment data
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      // Get student data
      const student = await storage.getStudentById(payment.student_id);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Get batch data if student has a batch
      let batch = null;
      if (student.batch_id) {
        batch = await storage.getBatchById(student.batch_id);
      }
      
      // Get organization settings from database for the tenant
      const tenantId = req.user?.tenantId || 1; // Default to tenant 1 if not specified
      const organization = await storage.getOrganizationDetails(tenantId);
      
      // Generate invoice PDF as buffer
      const pdfBuffer = await generateInvoiceBuffer({
        payment,
        student: {
          id: student.id,
          name: student.name,
          email: student.email || undefined,
          phone: student.phone,
          batch: batch ? { name: batch.name } : undefined
        },
        organization
      });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment.id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send the PDF buffer as response
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ error: `Error generating invoice: ${error.message}` });
    }
  }));
  
  // Consolidated invoice for a student (all payments) - Require authentication
  app.get('/api/students/:studentId/invoices/consolidated', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Get student data
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Get all payments for the student
      const payments = await storage.getStudentPayments(studentId);
      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found for this student' });
      }
      
      // Calculate total amount from all payments
      const totalAmount = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.amount);
      }, 0);
      
      // Get batch data if student has a batch
      let batch = null;
      if (student.batch_id) {
        batch = await storage.getBatchById(student.batch_id);
      }
      
      // Get organization settings from database for the tenant
      const tenantId = req.user?.tenantId || 1; // Default to tenant 1 if not specified
      const organization = await storage.getOrganizationDetails(tenantId);
      
      const consolidatedPayment = {
        ...payments[0], // Use first payment as template
        id: 0, // Special ID for consolidated invoice
        amount: totalAmount.toString(),
        payment_date: new Date(), // Current date
        reference: 'Consolidated Invoice',
        notes: `Includes ${payments.length} payment(s) made between ${new Date(payments[0].payment_date).toLocaleDateString()} and ${new Date(payments[payments.length - 1].payment_date).toLocaleDateString()}`
      };
      
      // Generate invoice PDF as buffer
      const pdfBuffer = await generateInvoiceBuffer({
        payment: consolidatedPayment,
        student: {
          id: student.id,
          name: student.name,
          email: student.email || undefined,
          phone: student.phone,
          batch: batch ? { name: batch.name } : undefined
        },
        organization
      });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="consolidated-invoice-${student.id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send the PDF buffer as response
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating consolidated invoice:', error);
      res.status(500).json({ error: `Error generating consolidated invoice: ${error.message}` });
    }
  }));

  // Tenant management endpoints
  app.get('/api/tenants', isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(tenants).where(eq(tenants.active, true));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  app.get('/api/tenants/:id', isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = Number(req.params.id);
      const [result] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      
      if (!result) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  app.post('/api/tenants', isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, subdomain } = req.body;
      
      if (!name || !subdomain) {
        return res.status(400).json({ error: 'Name and subdomain are required' });
      }
      
      // Check if subdomain already exists
      const existingTenant = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
      if (existingTenant.length > 0) {
        return res.status(400).json({ error: 'Subdomain already exists' });
      }
      
      const [tenant] = await db.insert(tenants).values({
        name,
        subdomain,
        active: true
      }).returning();
      
      res.status(201).json(tenant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  app.put('/api/tenants/:id', isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = Number(req.params.id);
      const { name, subdomain, active } = req.body;
      
      // Check if tenant exists
      const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      if (tenant.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      // Check if subdomain is being changed and if it already exists
      if (subdomain && subdomain !== tenant[0].subdomain) {
        const existingTenant = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
        if (existingTenant.length > 0) {
          return res.status(400).json({ error: 'Subdomain already exists' });
        }
      }
      
      const [updatedTenant] = await db.update(tenants)
        .set({
          name: name || tenant[0].name,
          subdomain: subdomain || tenant[0].subdomain,
          active: active !== undefined ? active : tenant[0].active,
          updatedAt: new Date()
        })
        .where(eq(tenants.id, tenantId))
        .returning();
      
      res.json(updatedTenant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  // Organization settings endpoints - Require authentication
  app.get('/api/settings/organization', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get tenant ID from the authenticated user or use default
      const tenantId = req.user?.tenantId || 1;
      
      const organization = await storage.getOrganizationDetails(tenantId);
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));
  
  // Diagnostic endpoint for tenant configuration - Admin access only
  app.get('/api/diagnostic/tenant-info', isAuthenticated, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get tenant information using Prisma instead of Drizzle
      const allTenants = await prisma.tenant.findMany();
      
      // Get settings for the current tenant
      const tenantId = req.user?.tenantId || 1;
      const tenantSettings = await prisma.setting.findMany({
        where: {
          tenant_id: tenantId
        }
      });
      
      // Return diagnostic information
      res.json({
        tenant_count: allTenants.length,
        current_tenant: allTenants.find(t => t.id === tenantId),
        settings_count: tenantSettings.length,
        tenant_settings: tenantSettings.map(s => ({ key: s.key, value: s.value }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  app.put('/api/settings/organization', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get tenant ID from the authenticated user or use default
      const tenantId = req.user?.tenantId || 1;
      
      const {
        organization_name,
        organization_address,
        organization_phone,
        organization_email,
        organization_website,
        organization_gstin
      } = req.body;
      
      // Update settings one by one
      const updatePromises = [];
      
      if (organization_name) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.ORG_NAME,
          organization_name
        ));
      }
      
      if (organization_address) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.ORG_ADDRESS,
          organization_address
        ));
      }
      
      if (organization_phone) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.ORG_PHONE,
          organization_phone
        ));
      }
      
      if (organization_email) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.ORG_EMAIL,
          organization_email
        ));
      }
      
      if (organization_website) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.ORG_WEBSITE,
          organization_website
        ));
      }
      
      if (organization_gstin) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.ORG_GSTIN,
          organization_gstin
        ));
      }
      
      await Promise.all(updatePromises);
      
      // Get updated organization details
      const organization = await storage.getOrganizationDetails(tenantId);
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));

  // Logo upload endpoint - Admin/Manager access only
  app.post('/api/settings/organization/logo', isAuthenticated, isManager, logoUpload.single('logo'), asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No logo file provided' });
      }

      // Get tenant ID from the authenticated user or use default
      const tenantId = req.user?.tenantId || 1;
      
      // Get file path
      const logoPath = req.file.path;
      const relativePath = logoPath.split('/uploads/')[1]; // Extract relative path for easier serving
      
      // Update logo setting
      await storage.updateSetting(
        tenantId,
        SETTINGS_KEYS.ORG_LOGO,
        `/uploads/${relativePath}`
      );
      
      // Get updated organization details
      const organization = await storage.getOrganizationDetails(tenantId);
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));
  
  // Get email notification settings - Admin/Manager access only
  app.get('/api/settings/notifications/email', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Let's get the tenant ID from the request or use default (1)
      const tenantId = 1; // For multi-tenant version, get from req.user or req.headers
      
      // Get all email notification settings
      const settings = await Promise.all([
        storage.getSetting(tenantId, SETTINGS_KEYS.EMAIL_NOTIFICATIONS_ENABLED),
        storage.getSetting(tenantId, SETTINGS_KEYS.EMAIL_STUDENT_REGISTRATION),
        storage.getSetting(tenantId, SETTINGS_KEYS.EMAIL_PAYMENT_RECEIPT),
        storage.getSetting(tenantId, SETTINGS_KEYS.EMAIL_PAYMENT_REMINDER),
        storage.getSetting(tenantId, SETTINGS_KEYS.EMAIL_BATCH_START_REMINDER),
        storage.getSetting(tenantId, SETTINGS_KEYS.EMAIL_ADMIN_LEAD_NOTIFICATION)
      ]);
      
      // Format the response
      const emailSettings = {
        emailNotificationsEnabled: settings[0] === 'true',
        studentRegistration: settings[1] === 'true',
        paymentReceipt: settings[2] === 'true',
        paymentReminder: settings[3] === 'true',
        batchStartReminder: settings[4] === 'true',
        leadNotification: settings[5] === 'true'
      };
      
      res.json(emailSettings);
    } catch (error: any) {
      console.error('Error fetching email notification settings:', error);
      res.status(500).json({ error: 'Failed to fetch email notification settings' });
    }
  }));
  
  // Update email notification settings - Admin/Manager access only
  app.put('/api/settings/notifications/email', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Let's get the tenant ID from the request or use default (1)
      const tenantId = 1; // For multi-tenant version, get from req.user or req.headers
      
      // Extract data from the request
      const {
        emailNotificationsEnabled,
        studentRegistration,
        paymentReceipt,
        paymentReminder,
        batchStartReminder,
        leadNotification
      } = req.body;
      
      // Update settings one by one
      const updatePromises = [];
      
      if (emailNotificationsEnabled !== undefined) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.EMAIL_NOTIFICATIONS_ENABLED,
          String(emailNotificationsEnabled)
        ));
      }
      
      if (studentRegistration !== undefined) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.EMAIL_STUDENT_REGISTRATION,
          String(studentRegistration)
        ));
      }
      
      if (paymentReceipt !== undefined) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.EMAIL_PAYMENT_RECEIPT,
          String(paymentReceipt)
        ));
      }
      
      if (paymentReminder !== undefined) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.EMAIL_PAYMENT_REMINDER,
          String(paymentReminder)
        ));
      }
      
      if (batchStartReminder !== undefined) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.EMAIL_BATCH_START_REMINDER,
          String(batchStartReminder)
        ));
      }
      
      if (leadNotification !== undefined) {
        updatePromises.push(storage.updateSetting(
          tenantId,
          SETTINGS_KEYS.EMAIL_ADMIN_LEAD_NOTIFICATION,
          String(leadNotification)
        ));
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Return success response
      res.json({ success: true, message: 'Email notification settings updated successfully' });
    } catch (error: any) {
      console.error('Error updating email notification settings:', error);
      res.status(500).json({ error: 'Failed to update email notification settings' });
    }
  }));
  
  // Get email credentials (Mailgun) - Admin/Manager access only
  // Admin/Manager access only
  app.get('/api/settings/notifications/email/credentials', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    try {
      
      console.log('GET Credentials: Processing request');
      // Get credentials from the database
      const tenantId = 1; // Use default tenant for testing
      const dbCredentials = await emailService.getMailgunCredentials(tenantId);
      
      // Check if credentials are available (either in database or environment variables)
      const hasMailgunAPIKey = !!dbCredentials.apiKey || !!process.env.MAILGUN_API_KEY;
      const hasMailgunDomain = !!dbCredentials.domain || !!process.env.MAILGUN_DOMAIN;
      const hasMailgunFrom = !!dbCredentials.fromEmail || !!process.env.MAILGUN_FROM;
      
      // Prefer database values over environment variables
      const domain = dbCredentials.domain || process.env.MAILGUN_DOMAIN || '';
      const fromEmail = dbCredentials.fromEmail || process.env.MAILGUN_FROM || '';
      
      res.json({
        hasMailgunAPIKey,
        hasMailgunDomain,
        hasMailgunFrom,
        mailgunDomain: domain,
        mailgunFrom: fromEmail
      });
    } catch (error: any) {
      console.error('Error fetching email credentials:', error);
      res.status(500).json({ error: 'Failed to fetch email credentials' });
    }
  }));
  
  // Update email service credentials - Admin/Manager access only
  app.put('/api/settings/notifications/email/credentials', isAuthenticated, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('PUT Credentials: Processing request to update Mailgun credentials');
      
      const { apiKey, domain, fromEmail } = req.body;
      
      if (!apiKey || !domain || !fromEmail) {
        console.warn('Missing required fields in request:', { 
          hasApiKey: !!apiKey, 
          hasDomain: !!domain, 
          hasFromEmail: !!fromEmail 
        });
        return res.status(400).json({ 
          error: 'All credentials (API key, domain, and from email) are required' 
        });
      }
      
      console.log('Updating Mailgun credentials with values:', { 
        apiKeyLength: apiKey.length, 
        domain, 
        fromEmail 
      });
      
      const tenantId = 1; // Use default tenant for now
      
      try {
        // Save credentials to database
        const success = await emailService.saveMailgunCredentials(
          apiKey, 
          domain, 
          fromEmail, 
          tenantId
        );
        
        if (success) {
          // Re-initialize the Mailgun client with new credentials
          const initialized = await emailService.initializeMailgun(tenantId);
          console.log('Mailgun client reinitialized after update:', initialized);
          
          res.json({ 
            success: true, 
            message: 'Mailgun credentials updated successfully' 
          });
        } else {
          console.warn('Failed to update Mailgun credentials - returned false');
          res.status(500).json({ 
            error: 'Failed to update Mailgun credentials' 
          });
        }
      } catch (dbError: any) {
        console.error('Database error while saving Mailgun credentials:', dbError);
        throw new Error(`Database operation failed: ${dbError.message}`);
      }
    } catch (error: any) {
      console.error('Error updating Mailgun credentials:', error);
      res.status(500).json({ 
        error: `Failed to update Mailgun credentials: ${error.message}` 
      });
    }
  }));
  
  // Debug endpoint to check authentication - Public access for debugging
  app.get('/api/debug/auth-check', (req: Request, res: Response) => {
    console.log('Auth check - Session data:', req.session);
    console.log('Auth check - is authenticated:', req.isAuthenticated());
    console.log('Auth check - User data:', req.user);
    
    if (req.isAuthenticated()) {
      return res.json({
        authenticated: true,
        user: req.user,
        session: req.session
      });
    } else {
      return res.status(401).json({
        authenticated: false,
        message: 'User not authenticated'
      });
    }
  });
  
  // Test email configuration - Admin/Manager access only
  app.post('/api/settings/notifications/email/test', isAuthenticated, isManager, asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('Test email - User auth check:', req.user);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }
      
      // Send a test email
      await emailService.sendTestEmail(email);
      
      res.json({ success: true, message: 'Test email sent successfully' });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      res.status(500).json({ error: `Failed to send test email: ${error.message}` });
    }
  }));

  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Serve uploaded files
  const uploadsDir = path.resolve('./uploads');
  app.use('/uploads', (req, res, next) => {
    // Set Cache-Control headers for better performance
    res.header('Cache-Control', 'public, max-age=86400');
    next();
  }, express.static(uploadsDir));
  
  return httpServer;
}