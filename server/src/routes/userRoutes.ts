import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadAvatar, getUsers, updateUser, createUser, resetUserPassword, deleteUser, updatePreferences } from '../controllers/userController';

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

router.get('/', authenticate, getUsers);
router.post('/', authenticate, requireRole('super_admin'), createUser);
router.put('/:id', authenticate, requireRole('admin', 'super_admin'), updateUser);
router.post('/:id/reset-password', authenticate, requireRole('admin', 'super_admin'), resetUserPassword);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteUser);
router.post('/:id/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);
router.put('/me/preferences', authenticate, updatePreferences);

export default router;
