
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
// @ts-ignore
import ConvertAPI from 'convertapi';

const execPromise = util.promisify(exec);

// Paths - Verified by debug_conversion.cjs
const LIBREOFFICE_PATH = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
const GHOSTSCRIPT_PATH = 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe';
const TESSERACT_PATH = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';

export const pdfService = {
    // --- Core Local Methods ---

    // Helper for executing commands
    async _exec(command: string): Promise<{ stdout: string, stderr: string }> {
        console.log(`Executing: ${command}`);
        return await execPromise(command);
    },

    // LibreOffice Conversion
    async convertWithLibreOffice(inputPath: string, outputDir: string, targetFormat: string): Promise<string> {
        try {
            console.log(`[Local] Converting ${path.basename(inputPath)} -> ${targetFormat} via LibreOffice...`);

            // Create temp profile to avoid locking issues
            const tempBase = 'C:/Temp';
            if (!fs.existsSync(tempBase)) try { fs.mkdirSync(tempBase); } catch (e) { }
            const tempProfileDir = `${tempBase}/LO_Service_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            let filterArg = '';
            if (path.extname(inputPath).toLowerCase() === '.pdf' && targetFormat === 'docx') {
                filterArg = ' --infilter="writer_pdf_import"';
            }

            const command = `"${LIBREOFFICE_PATH}" -env:UserInstallation=file:///${tempProfileDir} --headless${filterArg} --convert-to ${targetFormat} --outdir "${outputDir}" "${inputPath}"`;

            await pdfService._exec(command);

            // Determine expected output filename
            const basename = path.basename(inputPath, path.extname(inputPath));
            const expectedOutput = path.join(outputDir, `${basename}.${targetFormat}`);

            if (fs.existsSync(expectedOutput)) {
                console.log(`[Local] Success: ${expectedOutput}`);
                return expectedOutput;
            } else {
                throw new Error('LibreOffice finished but output file is missing.');
            }

        } catch (error: any) {
            console.error('[Local] LibreOffice Failed:', error.message);
            // Fallback
            if (process.env.CONVERT_API_SECRET) {
                console.log('Falling back to ConvertAPI...');
                return pdfService.convertWithConvertAPI(inputPath, outputDir, targetFormat);
            }
            throw error;
        }
    },

    // Ghostscript Compression
    async compressPdfLocal(inputPath: string, outputPath: string): Promise<string> {
        try {
            console.log(`[Local] Compressing ${path.basename(inputPath)} via Ghostscript...`);
            // -dPDFSETTINGS=/ebook (150dpi)
            const settings = '/ebook';
            const command = `"${GHOSTSCRIPT_PATH}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${settings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

            await pdfService._exec(command);

            if (fs.existsSync(outputPath)) return outputPath;
            throw new Error('Ghostscript output missing');

        } catch (error: any) {
            console.error('[Local] Compression Failed:', error.message);
            // Fallback
            if (process.env.CONVERT_API_SECRET) {
                const outputDir = path.dirname(outputPath);
                const result = await pdfService.convertWithConvertAPI(inputPath, outputDir, 'pdf', { Compress: true });
                if (result !== outputPath) {
                    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); fs.renameSync(result, outputPath); } catch (e) { return result; }
                }
                return outputPath;
            }
            throw error;
        }
    },

    // Ghostscript Repair
    async repairPdfLocal(inputPath: string, outputPath: string): Promise<string> {
        try {
            console.log(`[Local] Repairing via Ghostscript...`);
            const command = `"${GHOSTSCRIPT_PATH}" -o "${outputPath}" -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress -dNOPAUSE -dBATCH "${inputPath}"`;
            await pdfService._exec(command);

            if (fs.existsSync(outputPath)) return outputPath;
            throw new Error('Repaired file missing');
        } catch (error: any) {
            console.error('[Local] Repair Failed:', error.message);
            throw error;
        }
    },

    // Ghostscript PDF -> JPG
    async convertPdfToJpgLocal(inputPath: string, outputPath: string): Promise<string> {
        try {
            console.log(`[Local] PDF -> JPG via Ghostscript...`);
            const command = `"${GHOSTSCRIPT_PATH}" -sDEVICE=jpeg -dJPEGQ=90 -r150 -dNOPAUSE -dBATCH -dFirstPage=1 -dLastPage=1 -sOutputFile="${outputPath}" "${inputPath}"`;
            await pdfService._exec(command);

            if (fs.existsSync(outputPath)) return outputPath;
            throw new Error('JPG output missing');
        } catch (error: any) {
            console.error('[Local] JPG Conversion Failed:', error.message);
            // Fallback
            if (process.env.CONVERT_API_SECRET) {
                return pdfService.convertWithConvertAPI(inputPath, path.dirname(outputPath), 'jpg');
            }
            throw error;
        }
    },

    // Tesseract OCR
    async ocrLocal(inputPath: string, outputPath: string): Promise<string> {
        try {
            console.log(`[Local] OCR via Tesseract...`);
            const outputBase = outputPath.replace('.pdf', '');
            // Note: Tesseract adds .pdf extension automatically to outputBase
            const command = `"${TESSERACT_PATH}" "${inputPath}" "${outputBase}" -l por+eng pdf`;

            await pdfService._exec(command);

            const expectedOutput = `${outputBase}.pdf`;

            if (fs.existsSync(expectedOutput)) {
                if (expectedOutput !== outputPath) {
                    // Check if files are different before rename (should be fine as we are overwriting/creating new)
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    fs.renameSync(expectedOutput, outputPath);
                }
                return outputPath;
            }
            throw new Error('OCR output missing');

        } catch (error: any) {
            console.error('[Local] OCR Failed:', error.message);
            // Fallback
            if (process.env.CONVERT_API_SECRET) {
                return pdfService.convertWithConvertAPI(inputPath, path.dirname(outputPath), 'pdf', { Ocr: true });
            }
            throw error;
        }
    },

    // --- Core Engine (ConvertAPI - Fallback) ---
    async convertWithConvertAPI(inputPath: string, outputDir: string, targetFormat: string, options: any = {}): Promise<string> {
        const secret = process.env.CONVERT_API_SECRET;
        if (!secret || secret.includes('your_secret')) {
            // throw new Error('ConvertAPI Secret missing.');
            // Don't throw if just fallback, but returns nothing
            return '';
        }

        const convertapi = new ConvertAPI(secret);

        try {
            console.log(`☁️ ConvertAPI: Uploading ${path.basename(inputPath)} -> ${targetFormat}...`);
            const inputFormat = inputPath.toLowerCase().endsWith('.pdf') ? 'pdf' : path.extname(inputPath).replace('.', '');
            const result = await convertapi.convert(targetFormat, { File: inputPath, ...options }, inputFormat);

            const outputFilename = `${path.basename(inputPath, path.extname(inputPath))}_api.${targetFormat}`;
            const outputPath = path.join(outputDir, outputFilename);
            await result.saveFiles(outputPath);
            console.log(`☁️ ConvertAPI: Success -> ${outputPath}`);
            return outputPath;

        } catch (error: any) {
            console.error('☁️ ConvertAPI Failed:', error.message);
            throw new Error(`Cloud conversion failed: ${error.message}`);
        }
    },

    // --- Security ---
    async protectPdfApi(inputPath: string, outputDir: string, password: string): Promise<string> {
        return pdfService.convertWithConvertAPI(inputPath, outputDir, 'pdf', { Encrypt: true, UserPassword: password, OwnerPassword: password });
    },

    async unlockPdfApi(inputPath: string, outputDir: string, password?: string): Promise<string> {
        return pdfService.convertWithConvertAPI(inputPath, outputDir, 'pdf', { Encrypt: false, Password: password });
    }
};
