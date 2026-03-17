import { Router } from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/settingsController';

const router = Router();

router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);

export default router;
