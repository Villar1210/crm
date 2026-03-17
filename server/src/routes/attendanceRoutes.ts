import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController';

const router = Router();

router.post('/events', attendanceController.saveEvents);
router.get('/summary', attendanceController.getSummary);

export default router;
