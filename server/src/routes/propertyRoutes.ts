import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getProperties, getPublicProperties, getPropertyById, createProperty, updateProperty, deleteProperty } from '../controllers/propertyController';

const router = Router();

router.get('/public', getPublicProperties);
router.get('/', authenticate, getProperties);
router.post('/', authenticate, createProperty);
router.put('/:id', authenticate, updateProperty);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteProperty);
router.get('/:id', getPropertyById);

export default router;
