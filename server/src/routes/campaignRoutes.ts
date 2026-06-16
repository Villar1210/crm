import { Router } from 'express';
import { campaignController } from '../controllers/campaignController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/public', campaignController.getPublic);
router.get('/', authenticate, campaignController.getAll);
router.get('/:id', authenticate, campaignController.getById);
router.post('/', authenticate, campaignController.create);
router.put('/:id', authenticate, campaignController.update);
router.delete('/:id', authenticate, campaignController.delete);

export default router;
