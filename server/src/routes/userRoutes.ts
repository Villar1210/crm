import { Router } from 'express';
import { getUsers, updateUser, createUser } from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);

export default router;
