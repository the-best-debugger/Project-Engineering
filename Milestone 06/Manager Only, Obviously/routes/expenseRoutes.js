import express from 'express';
import {
  getAllExpenses,
  getMyExpenses,
  createExpense,
  updateExpense,
  approveExpense,
  rejectExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, requireRole('manager', 'admin'), getAllExpenses);
router.get('/mine', protect, requireRole('user', 'manager', 'admin'), getMyExpenses);
router.post('/', protect, requireRole('user', 'manager', 'admin'), createExpense);
router.put('/:id', protect, requireRole('user', 'manager', 'admin'), updateExpense);
router.put('/:id/approve', protect, requireRole('manager', 'admin'), approveExpense);
router.put('/:id/reject', protect, requireRole('manager', 'admin'), rejectExpense);
router.delete('/:id', protect, requireRole('admin'), deleteExpense);

export default router;
