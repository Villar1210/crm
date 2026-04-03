import express from 'express';
import { systemController } from '../controllers/systemController';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

// POST /api/system/reset-database — requires JWT + super_admin role
router.post('/reset-database', authenticate, requireRole('super_admin'), systemController.resetDatabase);

export default router;
