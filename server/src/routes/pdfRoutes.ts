import express from 'express';
import multer from 'multer';
import path from 'path';
import { pdfController } from '../controllers/pdfController';

const router = express.Router();

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
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Routes

// PDF-Lib (Native)
router.post('/merge', upload.array('files', 20), pdfController.merge);
router.post('/images-to-pdf', upload.array('files', 50), pdfController.imagesToPdf);
router.post('/split', upload.single('file'), pdfController.split);
router.post('/rotate', upload.single('file'), pdfController.rotate);
router.post('/protect', upload.single('file'), pdfController.protect);
router.post('/unlock', upload.single('file'), pdfController.unlock);
router.post('/delete-pages', upload.single('file'), pdfController.deletePages);
router.post('/watermark', upload.single('file'), pdfController.watermark);
router.post('/page-numbers', upload.single('file'), pdfController.pageNumbers);
router.post('/sign', upload.array('files', 2), pdfController.sign);

// Local Service (LibreOffice/Ghostscript/Tesseract)
router.post('/compress', upload.single('file'), pdfController.compress);
router.post('/repair', upload.single('file'), pdfController.repair);
router.post('/ocr', upload.single('file'), pdfController.ocr);

router.post('/word-to-pdf', upload.single('file'), pdfController.wordToPdf);
router.post('/excel-to-pdf', upload.single('file'), pdfController.excelToPdf);
router.post('/ppt-to-pdf', upload.single('file'), pdfController.pptToPdf);

router.post('/pdf-to-word', upload.single('file'), pdfController.pdfToWord);
router.post('/pdf-to-excel', upload.single('file'), pdfController.pdfToExcel);
router.post('/pdf-to-ppt', upload.single('file'), pdfController.pdfToPpt);

router.post('/pdf-to-jpg', upload.single('file'), pdfController.pdfToJpg);

export default router;
