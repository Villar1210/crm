import { Router } from 'express';
import { getSystemSettings, updateSystemSettings, getSiteSettings, updateSiteSettings } from '../controllers/settingsController';

const router = Router();

router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);
router.get('/site', getSiteSettings);
router.post('/site', updateSiteSettings);
router.put('/site', updateSiteSettings);

export default router;
