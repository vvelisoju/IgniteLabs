import { Router } from 'express';
import leadRoutes from './leadRoutes';
import batchRoutes from './batchRoutes';
import studentRoutes from './studentRoutes';

const router = Router();

// Register all API routes
router.use('/leads', leadRoutes);
router.use('/batches', batchRoutes);
router.use('/students', studentRoutes);

export default router;