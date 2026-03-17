import express from 'express';
import { systemController } from '../controllers/systemController';

const router = express.Router();

// POST /api/system/reset-database
router.post('/reset-database', systemController.resetDatabase);

export default router;
