import { Router } from 'express';
import { getProperties, createProperty, updateProperty, deleteProperty } from '../controllers/propertyController';

const router = Router();

router.get('/', getProperties);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteProperty);

export default router;
