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

const upload = multer({ storage });

router.get('/', getLeads);
router.delete('/', deleteAllLeads); // Bulk delete by ownerId
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// Upload Route
router.post('/:id/documents', upload.single('file'), uploadDocument);

export default router;
