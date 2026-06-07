import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadAvatar, getUsers, updateUser, createUser, resetUserPassword, deleteUser } from '../controllers/userController';

const router = Router();

// Configuração multer para avatar
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/avatars');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
    }
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);
router.post('/:id/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
