import { Router } from 'express';
import { batchController } from '../controllers/batchController';

const router = Router();

// GET /api/batches - Get all batches
router.get('/', batchController.getAllBatches);

// GET /api/batches/:id - Get a batch by ID
router.get('/:id', batchController.getBatchById);

// POST /api/batches - Create a new batch
router.post('/', batchController.createBatch);

// PUT /api/batches/:id - Update a batch
router.put('/:id', batchController.updateBatch);

// DELETE /api/batches/:id - Delete a batch
router.delete('/:id', batchController.deleteBatch);

export default router;