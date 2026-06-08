import { Router } from 'express';
import { getSystemSettings, updateSystemSettings, getSiteSettings, updateSiteSettings } from '../controllers/settingsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);
router.get('/site', getSiteSettings); // Leitura pública
router.post('/site', authenticate, requireRole('super_admin'), updateSiteSettings);
router.put('/site', authenticate, requireRole('super_admin'), updateSiteSettings);

export default router;
