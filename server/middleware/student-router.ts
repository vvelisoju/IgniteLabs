import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, isStudent } from '../auth';

const router = express.Router();

// Helper to handle async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

// Get student profile and batch information
router.get('/profile', isAuthenticated, isStudent, asyncHandler(async (req: Request, res: Response) => {
  // Cache control - force fresh data
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const studentId = req.user?.id;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID not found' });
  }
  
  // Get student profile
  const student = await storage.getStudentById(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found' });
  }
  
  // Get batch information
  const batch = await storage.getBatchById(student.batch_id);
  
  // Get payment history
  const payments = await storage.getStudentPayments(studentId);
  
  // Combine the information
  const studentProfile = {
    ...student,
    batch,
    payments
  };
  
  res.json(studentProfile);
}));

// Get assigned courses and materials
router.get('/courses', isAuthenticated, isStudent, asyncHandler(async (req: Request, res: Response) => {
  // This would need to be expanded when course functionality is added
  // For now, returning a placeholder
  res.json({
    message: 'Course information will be available here'
  });
}));

// Get assignments
router.get('/assignments', isAuthenticated, isStudent, asyncHandler(async (req: Request, res: Response) => {
  // This would need to be expanded when assignment functionality is added
  // For now, returning a placeholder
  res.json({
    message: 'Assignment information will be available here'
  });
}));

export default router;