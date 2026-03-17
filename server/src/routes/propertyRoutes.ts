import { Router } from 'express';
import { getProperties, createProperty, updateProperty, deleteProperty } from '../controllers/propertyController';

const router = Router();

router.get('/', getProperties);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;
