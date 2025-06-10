import { Router } from 'express';
import { leadController } from '../controllers/leadController';

const router = Router();

// GET /api/leads - Get all leads
router.get('/', leadController.getAllLeads);

// GET /api/leads/:id - Get a lead by ID
router.get('/:id', leadController.getLeadById);

// POST /api/leads - Create a new lead
router.post('/', leadController.createLead);

// PUT /api/leads/:id - Update a lead
router.put('/:id', leadController.updateLead);

// DELETE /api/leads/:id - Delete a lead
router.delete('/:id', leadController.deleteLead);

export default router;