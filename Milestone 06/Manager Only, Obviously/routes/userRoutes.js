import express from 'express';
import { getAllUsers, updateUserRole, getUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, requireRole('admin'), getAllUsers);
router.put('/:id/role', protect, requireRole('admin'), updateUserRole);
router.get('/me', protect, requireRole('user', 'manager', 'admin'), getUserProfile);

export default router;
