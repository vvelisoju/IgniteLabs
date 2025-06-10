import { Router } from 'express';
import { studentController } from '../controllers/studentController';

const router = Router();

// GET /api/students - Get all students
router.get('/', studentController.getAllStudents);

// GET /api/students/:id - Get a student by ID
router.get('/:id', studentController.getStudentById);

// POST /api/students - Create a new student
router.post('/', studentController.createStudent);

// PUT /api/students/:id - Update a student
router.put('/:id', studentController.updateStudent);

// DELETE /api/students/:id - Delete a student
router.delete('/:id', studentController.deleteStudent);

// GET /api/students/:id/payments - Get all payments for a student
router.get('/:id/payments', studentController.getStudentPayments);

// POST /api/students/:id/payments - Add a payment for a student
router.post('/:id/payments', studentController.addStudentPayment);

// POST /api/leads/:leadId/convert - Convert a lead to a student
router.post('/convert-lead/:leadId', studentController.convertLeadToStudent);

export default router;