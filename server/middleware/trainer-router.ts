import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, isTrainer } from '../auth';

const router = express.Router();

// Helper to handle async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

// Get batches assigned to the trainer
router.get('/batches', isAuthenticated, isTrainer, asyncHandler(async (req: Request, res: Response) => {
  // Cache control - force fresh data
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Get the current user (trainer) ID
  const trainerId = req.user?.id;
  if (!trainerId) {
    return res.status(400).json({ error: 'Trainer ID not found' });
  }
  
  // Get batches assigned to this trainer
  const trainerBatches = await storage.getBatchesByTrainer(trainerId);
  res.json(trainerBatches);
}));

// Get students in a specific batch assigned to the trainer
router.get('/batches/:batchId/students', isAuthenticated, isTrainer, asyncHandler(async (req: Request, res: Response) => {
  // Cache control - force fresh data
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const trainerId = req.user?.id;
  const batchId = Number(req.params.batchId);
  
  if (!trainerId) {
    return res.status(400).json({ error: 'Trainer ID not found' });
  }
  
  // First verify this batch is assigned to this trainer
  const trainerBatches = await storage.getBatchesByTrainer(trainerId);
  const batchBelongsToTrainer = trainerBatches.some(batch => batch.id === batchId);
  
  if (!batchBelongsToTrainer) {
    return res.status(403).json({ error: 'You do not have access to this batch' });
  }
  
  // Get students for this batch
  const students = await storage.getAllStudents({ batchId });
  res.json(students);
}));

export default router;