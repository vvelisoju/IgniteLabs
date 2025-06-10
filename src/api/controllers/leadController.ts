import { Request, Response } from 'express';
import { LeadService } from '../../services/leadService';
import { insertLeadSchema } from '../../db/schema';
import { ZodError } from 'zod';

const leadService = new LeadService();

export const leadController = {
  /**
   * Get all leads
   */
  async getAllLeads(req: Request, res: Response) {
    try {
      // Extract filter parameters
      const { status } = req.query;
      
      // Apply filters if provided
      const filters: any = {};
      if (status) filters.status = status;
      
      const leads = await leadService.getAllLeads(filters);
      res.json(leads);
    } catch (error) {
      console.error('Error in getAllLeads controller:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  },

  /**
   * Get a lead by ID
   */
  async getLeadById(req: Request, res: Response) {
    try {
      const leadId = parseInt(req.params.id);
      
      if (isNaN(leadId)) {
        return res.status(400).json({ error: 'Invalid lead ID' });
      }
      
      const lead = await leadService.getLeadById(leadId);
      
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Error in getLeadById controller:', error);
      res.status(500).json({ error: 'Failed to fetch lead' });
    }
  },

  /**
   * Create a new lead
   */
  async createLead(req: Request, res: Response) {
    try {
      // Validate the request body
      const leadData = insertLeadSchema.parse(req.body);
      
      const newLead = await leadService.createLead(leadData);
      res.status(201).json(newLead);
    } catch (error) {
      console.error('Error in createLead controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to create lead' });
    }
  },

  /**
   * Update a lead
   */
  async updateLead(req: Request, res: Response) {
    try {
      const leadId = parseInt(req.params.id);
      
      if (isNaN(leadId)) {
        return res.status(400).json({ error: 'Invalid lead ID' });
      }
      
      // Validate the request body (partial validation)
      const leadData = insertLeadSchema.partial().parse(req.body);
      
      const updatedLead = await leadService.updateLead(leadId, leadData);
      
      if (!updatedLead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error('Error in updateLead controller:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to update lead' });
    }
  },

  /**
   * Delete a lead
   */
  async deleteLead(req: Request, res: Response) {
    try {
      const leadId = parseInt(req.params.id);
      
      if (isNaN(leadId)) {
        return res.status(400).json({ error: 'Invalid lead ID' });
      }
      
      const success = await leadService.deleteLead(leadId);
      
      if (!success) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error in deleteLead controller:', error);
      res.status(500).json({ error: 'Failed to delete lead' });
    }
  }
};