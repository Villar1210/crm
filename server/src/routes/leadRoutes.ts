import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getLeads, createLead, updateLead, deleteLead, deleteAllLeads, uploadDocument } from '../controllers/leadController';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
];

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB por arquivo
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
        }
    },
});

router.get('/', getLeads);
router.delete('/', deleteAllLeads); // Bulk delete by ownerId
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// Upload Route
router.post('/:id/documents', upload.single('file'), uploadDocument);

export default router;
