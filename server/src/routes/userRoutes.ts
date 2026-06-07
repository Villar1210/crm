import { uploadAvatar, Router } from 'express';
import { uploadAvatar, getUsers, updateUser, createUser, resetUserPassword, deleteUser } from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

router.post('/:id/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
