import { db } from '../db';
import { batches, NewBatch, Batch } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Service for managing batch data
 */
export class BatchService {
  /**
   * Get all batches
   */
  async getAllBatches(): Promise<Batch[]> {
    try {
      const results = await db.select().from(batches);
      return results;
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw error;
    }
  }

  /**
   * Get a single batch by ID
   */
  async getBatchById(id: number): Promise<Batch | null> {
    try {
      const result = await db.select().from(batches).where(eq(batches.id, id));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching batch with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new batch
   */
  async createBatch(batchData: NewBatch): Promise<Batch> {
    try {
      const result = await db.insert(batches).values(batchData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  /**
   * Update an existing batch
   */
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

  /**
   * Delete a batch by ID
   */
  async deleteBatch(id: number): Promise<boolean> {
    try {
      const result = await db.delete(batches).where(eq(batches.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting batch with ID ${id}:`, error);
      throw error;
    }
  }
}