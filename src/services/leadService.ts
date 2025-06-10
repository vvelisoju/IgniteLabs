import { db } from '../db';
import { leads, NewLead, Lead } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Service for managing lead data
 */
export class LeadService {
  /**
   * Get all leads with optional filtering
   */
  async getAllLeads(filters: Partial<Lead> = {}): Promise<Lead[]> {
    try {
      // Start with a basic query
      let query = db.select().from(leads);
      
      // Apply filters if provided
      if (filters.status) {
        query = query.where(eq(leads.status, filters.status));
      }
      
      // Always sort by creation date (newest first)
      const results = await query.orderBy(leads.createdAt);
      
      return results;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get a single lead by ID
   */
  async getLeadById(id: number): Promise<Lead | null> {
    try {
      const result = await db.select().from(leads).where(eq(leads.id, id));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching lead with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: NewLead): Promise<Lead> {
    try {
      const result = await db.insert(leads).values(leadData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update an existing lead
   */
  async updateLead(id: number, leadData: Partial<Lead>): Promise<Lead | null> {
    try {
      // First check if the lead exists
      const existingLead = await this.getLeadById(id);
      
      if (!existingLead) {
        return null;
      }
      
      // Add updatedAt timestamp
      const updatedLead = {
        ...leadData,
        updatedAt: new Date(),
      };
      
      const result = await db
        .update(leads)
        .set(updatedLead)
        .where(eq(leads.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error updating lead with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a lead by ID
   */
  async deleteLead(id: number): Promise<boolean> {
    try {
      const result = await db.delete(leads).where(eq(leads.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting lead with ID ${id}:`, error);
      throw error;
    }
  }
}