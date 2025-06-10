import { Request, Response } from 'express';
import { BatchService } from '../../services/batchService';
import { insertBatchSchema } from '../../db/schema';
import { ZodError } from 'zod';

const batchService = new BatchService();

export const batchController = {
  /**
   * Get all batches
   */
  async getAllBatches(req: Request, res: Response) {
    try {
      const batches = await batchService.getAllBatches();
      res.json(batches);
    } catch (error) {
      console.error('Error in getAllBatches controller:', error);
      res.status(500).json({ error: 'Failed to fetch batches' });
    }
  },

  /**
   * Get a batch by ID
   */
  async getBatchById(req: Request, res: Response) {
    try {
      const batchId = parseInt(req.params.id);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ error: 'Invalid batch ID' });
      }
      
      const batch = await batchService.getBatchById(batchId);
      
      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      res.json(batch);
    } catch (error) {
      console.error('Error in getBatchById controller:', error);
      res.status(500).json({ error: 'Failed to fetch batch' });
    }
  },

  /**
   * Create a new batch
   */
  async createBatch(req: Request, res: Response) {
    try {
      // Validate the request body
      const batchData = insertBatchSchema.parse(req.body);
      
      const newBatch = await batchService.createBatch(batchData);
      res.status(201).json(newBatch);
    } catch (error) {
      console.error('Error in createBatch controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to create batch' });
    }
  },

  /**
   * Update a batch
   */
  async updateBatch(req: Request, res: Response) {
    try {
      const batchId = parseInt(req.params.id);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ error: 'Invalid batch ID' });
      }
      
      // Validate the request body (partial validation)
      const batchData = insertBatchSchema.partial().parse(req.body);
      
      const updatedBatch = await batchService.updateBatch(batchId, batchData);
      
      if (!updatedBatch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      res.json(updatedBatch);
    } catch (error) {
      console.error('Error in updateBatch controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to update batch' });
    }
  },

  /**
   * Delete a batch
   */
  async deleteBatch(req: Request, res: Response) {
    try {
      const batchId = parseInt(req.params.id);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ error: 'Invalid batch ID' });
      }
      
      const success = await batchService.deleteBatch(batchId);
      
      if (!success) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error in deleteBatch controller:', error);
      res.status(500).json({ error: 'Failed to delete batch' });
    }
  }
};