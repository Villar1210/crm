import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pdfController } from '../controllers/pdfController';
import { authenticate } from '../middleware/auth';
import { isPdf, isImage } from '../lib/fileValidation';

const router = express.Router();

router.use(authenticate);

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

// Configure Multer
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024, files: 20 }, // 50MB por arquivo, max 20 arquivos
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new Error(`Tipo de arquivo nao permitido: ${file.mimetype}`));
    },
});

function cleanupFiles(req: Request) {
    const files = req.file ? [req.file] : (req.files as Express.Multer.File[] | undefined) || [];
    for (const f of files) {
        try { fs.unlinkSync(f.path); } catch { /* ignore */ }
    }
}

function validatePdf(req: Request, res: Response, next: NextFunction) {
    const files = req.file ? [req.file] : (req.files as Express.Multer.File[] | undefined) || [];
    for (const f of files) {
        if (!isPdf(f.path)) {
            cleanupFiles(req);
            return res.status(400).json({ error: 'Arquivo invalido. Apenas PDFs sao aceitos.' });
        }
    }
    next();
}

function validateImage(req: Request, res: Response, next: NextFunction) {
    const files = req.file ? [req.file] : (req.files as Express.Multer.File[] | undefined) || [];
    for (const f of files) {
        if (!isImage(f.path)) {
            cleanupFiles(req);
            return res.status(400).json({ error: 'Arquivo invalido. Apenas imagens JPG/PNG/GIF sao aceitas.' });
        }
    }
    next();
}

// Routes

// PDF-Lib (Native)
router.post('/merge', upload.array('files', 20), validatePdf, pdfController.merge);
router.post('/images-to-pdf', upload.array('files', 50), validateImage, pdfController.imagesToPdf);
router.post('/split', upload.single('file'), validatePdf, pdfController.split);
router.post('/rotate', upload.single('file'), validatePdf, pdfController.rotate);
router.post('/protect', upload.single('file'), validatePdf, pdfController.protect);
router.post('/unlock', upload.single('file'), validatePdf, pdfController.unlock);
router.post('/delete-pages', upload.single('file'), validatePdf, pdfController.deletePages);
router.post('/watermark', upload.single('file'), validatePdf, pdfController.watermark);
router.post('/page-numbers', upload.single('file'), validatePdf, pdfController.pageNumbers);
router.post('/sign', upload.array('files', 2), pdfController.sign);

// Local Service (LibreOffice/Ghostscript/Tesseract)
router.post('/compress', upload.single('file'), validatePdf, pdfController.compress);
router.post('/repair', upload.single('file'), validatePdf, pdfController.repair);
router.post('/ocr', upload.single('file'), pdfController.ocr);

router.post('/word-to-pdf', upload.single('file'), pdfController.wordToPdf);
router.post('/excel-to-pdf', upload.single('file'), pdfController.excelToPdf);
router.post('/ppt-to-pdf', upload.single('file'), pdfController.pptToPdf);

router.post('/pdf-to-word', upload.single('file'), validatePdf, pdfController.pdfToWord);
router.post('/pdf-to-excel', upload.single('file'), validatePdf, pdfController.pdfToExcel);
router.post('/pdf-to-ppt', upload.single('file'), validatePdf, pdfController.pdfToPpt);

router.post('/pdf-to-jpg', upload.single('file'), validatePdf, pdfController.pdfToJpg);

export default router;
