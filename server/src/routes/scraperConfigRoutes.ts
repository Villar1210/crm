import { Router } from 'express';
import { getSelectors, updateSelector, seedDefaults } from '../controllers/scraperConfigController';

const router = Router();

// Public route for extension
router.get('/selectors', getSelectors);

// Admin routes (should be protected in production, but keeping open for MV3 context simplicity for now)
router.post('/selectors', updateSelector);
router.post('/seed', seedDefaults);

export default router;
