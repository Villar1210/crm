import { Router } from 'express';
import { getUsers, updateUser, createUser, resetUserPassword, deleteUser } from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
