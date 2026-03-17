import { Request, Response } from 'express';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { pdfService } from '../services/pdfService';

export const pdfController = {

    // --- Helper to handle service calls ---
    _handleConversion: async (req: Request, res: Response, serviceCall: Function, outputExt: string) => {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: 'File required' });

            // Output path usually in same dir
            const outputFilename = `${path.basename(file.originalname, path.extname(file.originalname))}_converted${outputExt}`;
            const outputPath = path.join(path.dirname(file.path), outputFilename);

            // Call service
            // Note: service might return a different path if it auto-names, but our service usually takes input/outputDir or input/outputPath
            // pdfService methods vary. Let's adapt.

            let resultPath = '';

            // LibreOffice takes output DIR
            if (serviceCall.name === 'convertWithLibreOffice') {
                resultPath = await serviceCall(file.path, path.dirname(file.path), outputExt.replace('.', ''));
            } else {
                // Others take output PATH
                resultPath = await serviceCall(file.path, outputPath);
            }

            if (!fs.existsSync(resultPath)) throw new Error('Conversion failed, output missing');

            // Download
            res.download(resultPath, outputFilename, () => {
                // Cleanup
                try { fs.unlinkSync(file.path); } catch (e) { }
                try { fs.unlinkSync(resultPath); } catch (e) { }
            });

        } catch (error: any) {
            console.error('Conversion Endpoint Error:', error);
            res.status(500).json({ error: `Conversion failed: ${error.message}` });
        }
    },


    // --- Existing pdf-lib methods ---
    merge: async (req: Request, res: Response) => {
        try {
            const files = req.files as Express.Multer.File[];
            if (!files || files.length < 2) return res.status(400).json({ error: 'Please upload at least 2 PDF files.' });

            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                try {
                    const pdfBytes = fs.readFileSync(file.path);
                    const pdf = await PDFDocument.load(pdfBytes);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                } catch (e) {
                    console.error(`Error processing file ${file.originalname}:`, e);
                }
            }

            const pdfBytes = await mergedPdf.save();
            const filename = `merged_${Date.now()}.pdf`;

            files.forEach(file => { try { fs.unlinkSync(file.path); } catch (e) { } });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(pdfBytes));
        } catch (error) {
            console.error('Merge error:', error);
            res.status(500).json({ error: 'Failed to merge PDFs' });
        }
    },

    imagesToPdf: async (req: Request, res: Response) => {
        try {
            const files = req.files as Express.Multer.File[];
            if (!files || files.length < 1) return res.status(400).json({ error: 'Please upload at least 1 image.' });

            const pdfDoc = await PDFDocument.create();
            for (const file of files) {
                try {
                    const imageBytes = fs.readFileSync(file.path);
                    let image;
                    if (file.mimetype.includes('jpeg') || file.mimetype.includes('jpg')) {
                        image = await pdfDoc.embedJpg(imageBytes);
                    } else if (file.mimetype.includes('png')) {
                        image = await pdfDoc.embedPng(imageBytes);
                    } else continue;

                    const page = pdfDoc.addPage();
                    const { width, height } = image.scale(1);
                    page.setSize(width, height);
                    page.drawImage(image, { x: 0, y: 0, width, height });
                } catch (e) { console.error(e); }
            }

            const pdfBytes = await pdfDoc.save();
            const filename = `images_converted_${Date.now()}.pdf`;

            files.forEach(file => { try { fs.unlinkSync(file.path); } catch (e) { } });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(pdfBytes));
        } catch (error) {
            console.error('Images to PDF error:', error);
            res.status(500).json({ error: 'Failed to convert images' });
        }
    },

    split: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
            const ranges = req.body.ranges || "all";

            const pdfBytes = fs.readFileSync(file.path);
            const srcPdf = await PDFDocument.load(pdfBytes);
            const destPdf = await PDFDocument.create();
            const totalPages = srcPdf.getPageCount();
            const indicesToKeep: number[] = [];

            if (ranges === "all") {
                for (let i = 0; i < totalPages; i++) indicesToKeep.push(i);
            } else {
                const parts = ranges.split(',');
                for (const part of parts) {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(Number);
                        for (let i = start; i <= end; i++) {
                            if (i >= 1 && i <= totalPages) indicesToKeep.push(i - 1);
                        }
                    } else {
                        const page = Number(part);
                        if (page >= 1 && page <= totalPages) indicesToKeep.push(page - 1);
                    }
                }
            }
            const uniqueIndices = [...new Set(indicesToKeep)].sort((a, b) => a - b);
            const copiedPages = await destPdf.copyPages(srcPdf, uniqueIndices);
            copiedPages.forEach((page) => destPdf.addPage(page));

            const outBytes = await destPdf.save();
            const filename = `split_${Date.now()}.pdf`;

            try { fs.unlinkSync(file.path); } catch (e) { }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(outBytes));
        } catch (error) {
            console.error('Split error:', error);
            res.status(500).json({ error: 'Failed to split' });
        }
    },

    rotate: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const angle = parseInt(req.body.angle as string) || 90;
            if (!file) return res.status(400).json({ error: 'No file' });

            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + angle));
            });

            const outBytes = await pdfDoc.save();
            const filename = `rotated_${Date.now()}.pdf`;
            try { fs.unlinkSync(file.path); } catch (e) { }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(outBytes));
        } catch (e) { res.status(500).json({ error: 'Failed to rotate' }); }
    },

    protect: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const password = req.body.password;
            if (!file || !password) return res.status(400).json({ error: 'File and password required' });
            // Use API for reliability
            return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.protectPdfApi(i, dir, password), '.pdf');
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    },

    unlock: async (req: Request, res: Response) => {
        try {
            const password = req.body.password;
            // Use API for reliability
            return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.unlockPdfApi(i, dir, password), '.pdf');
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    },

    deletePages: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const pagesToRemoveStr = req.body.pages;
            if (!file || !pagesToRemoveStr) return res.status(400).json({ error: 'File and page numbers required' });

            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const pagesToRemove = pagesToRemoveStr.split(',')
                .map((p: string) => parseInt(p.trim()) - 1)
                .filter((p: number) => !isNaN(p) && p >= 0 && p < pdfDoc.getPageCount())
                .sort((a: number, b: number) => b - a);

            for (const p of pagesToRemove) pdfDoc.removePage(p);

            const outBytes = await pdfDoc.save();
            const filename = `cleaned_${Date.now()}.pdf`;
            try { fs.unlinkSync(file.path); } catch (e) { }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(outBytes));
        } catch (e) { res.status(500).json({ error: 'Failed to delete pages' }); }
    },

    watermark: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const text = req.body.text || 'CONFIDENTIAL';
            if (!file) return res.status(400).json({ error: 'File required' });

            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            pages.forEach(page => {
                const { width, height } = page.getSize();
                page.drawText(text, {
                    x: width / 2 - (text.length * 15),
                    y: height / 2,
                    size: 50,
                    font,
                    color: rgb(0.7, 0.7, 0.7),
                    rotate: degrees(45),
                    opacity: 0.5
                });
            });

            const outBytes = await pdfDoc.save();
            const filename = `watermarked_${Date.now()}.pdf`;
            try { fs.unlinkSync(file.path); } catch (e) { }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(outBytes));
        } catch (e) { res.status(500).json({ error: 'Failed to watermark' }); }
    },

    pageNumbers: async (req: Request, res: Response) => {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: 'File required' });

            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            pages.forEach((page, idx) => {
                const { width } = page.getSize();
                const text = `${idx + 1} / ${pages.length}`;
                page.drawText(text, { x: width - 50, y: 20, size: 10, font, color: rgb(0, 0, 0) });
            });

            const outBytes = await pdfDoc.save();
            const filename = `numbered_${Date.now()}.pdf`;
            try { fs.unlinkSync(file.path); } catch (e) { }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(outBytes));
        } catch (e) { res.status(500).json({ error: 'Failed to add page numbers' }); }
    },

    sign: async (req: Request, res: Response) => {
        try {
            const files = req.files as Express.Multer.File[];
            if (!files || files.length < 2) return res.status(400).json({ error: 'Please upload PDF and Signature Image.' });

            let pdfFile = files.find(f => f.mimetype === 'application/pdf');
            let imgFile = files.find(f => f.mimetype.startsWith('image/'));

            if (!pdfFile || !imgFile) {
                // Flashback to simple index based if check fails
                if (files[0].mimetype === 'application/pdf') { pdfFile = files[0]; imgFile = files[1]; }
                else { pdfFile = files[1]; imgFile = files[0]; }
            }

            const pdfBytes = fs.readFileSync(pdfFile.path);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const imgBytes = fs.readFileSync(imgFile.path);

            let image;
            if (imgFile.mimetype.includes('png')) image = await pdfDoc.embedPng(imgBytes);
            else if (imgFile.mimetype.includes('jpg') || imgFile.mimetype.includes('jpeg')) image = await pdfDoc.embedJpg(imgBytes);
            else return res.status(400).json({ error: 'Image must be PNG or JPG' });

            const pages = pdfDoc.getPages();
            const lastPage = pages[pages.length - 1];
            const { width } = lastPage.getSize();

            // Auto-scale to reasonable size (e.g. 150px width)
            const targetWidth = 150;
            const imgDims = image.scale(targetWidth / image.width);

            lastPage.drawImage(image, {
                x: width - imgDims.width - 20,
                y: 20,
                width: imgDims.width,
                height: imgDims.height,
            });

            const outBytes = await pdfDoc.save();
            const filename = `signed_${Date.now()}.pdf`;

            files.forEach(file => { try { fs.unlinkSync(file.path); } catch (e) { } });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(Buffer.from(outBytes));
        } catch (error) {
            console.error('Sign error:', error);
            res.status(500).json({ error: 'Failed to sign PDF' });
        }
    },

    // --- New Service-Based Endpoints ---

    compress: async (req: Request, res: Response) => {
        // Use Ghostscript for REAL compression
        return pdfController._handleConversion(req, res, pdfService.compressPdfLocal, '.pdf');
    },

    repair: async (req: Request, res: Response) => {
        return pdfController._handleConversion(req, res, pdfService.repairPdfLocal, '.pdf');
    },

    ocr: async (req: Request, res: Response) => {
        return pdfController._handleConversion(req, res, pdfService.ocrLocal, '.pdf');
    },

    // Office Office Conversions (LibreOffice)
    wordToPdf: async (req: Request, res: Response) => {
        return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.convertWithLibreOffice(i, dir, 'pdf'), '.pdf');
    },
    excelToPdf: async (req: Request, res: Response) => {
        return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.convertWithLibreOffice(i, dir, 'pdf'), '.pdf');
    },
    pptToPdf: async (req: Request, res: Response) => {
        return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.convertWithLibreOffice(i, dir, 'pdf'), '.pdf');
    },

    // PDF to Office (Explicit API for Excel/PPT)
    pdfToWord: async (req: Request, res: Response) => {
        return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.convertWithLibreOffice(i, dir, 'docx'), '.docx');
    },
    pdfToExcel: async (req: Request, res: Response) => {
        // Switch to API explicitly
        return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.convertWithConvertAPI(i, dir, 'xlsx'), '.xlsx');
    },
    pdfToPpt: async (req: Request, res: Response) => {
        // Switch to API explicitly
        return pdfController._handleConversion(req, res, (i: string, dir: string) => pdfService.convertWithConvertAPI(i, dir, 'pptx'), '.pptx');
    },

    pdfToJpg: async (req: Request, res: Response) => {
        return pdfController._handleConversion(req, res, pdfService.convertPdfToJpgLocal, '.jpg');
    }
};
