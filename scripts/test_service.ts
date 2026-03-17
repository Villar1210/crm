
import { pdfService } from '../server/src/services/pdfService.ts';
import path from 'path';
import fs from 'fs';

// Mock Express request/response not needed, we test the service directly.

async function testService() {
    console.log('--- TESTING PDF SERVICE IMPLEMENTATION ---');
    const tempDir = path.join(__dirname, 'service_test_output');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // 1. Create Input File
    const txtFile = path.join(tempDir, 'service_test.txt');
    fs.writeFileSync(txtFile, 'Testing pdfService integration with local tools.');

    console.log('\n[1] Testing LibreOffice (TXT -> PDF)...');
    try {
        const pdfPath = await pdfService.convertWithLibreOffice(txtFile, tempDir, 'pdf');
        console.log('Success:', pdfPath);

        // 2. Test PDF -> DOCX
        console.log('\n[2] Testing LibreOffice (PDF -> DOCX)...');
        const docxPath = await pdfService.convertWithLibreOffice(pdfPath, tempDir, 'docx');
        console.log('Success:', docxPath);

        // 3. Test Compression
        console.log('\n[3] Testing Ghostscript (Compress)...');
        const compressedPath = path.join(tempDir, 'compressed.pdf');
        await pdfService.compressPdfLocal(pdfPath, compressedPath);
        console.log('Success:', compressedPath);

        // 4. Test PDF -> JPG
        console.log('\n[4] Testing Ghostscript (PDF -> JPG)...');
        const jpgPath = path.join(tempDir, 'page.jpg');
        await pdfService.convertPdfToJpgLocal(pdfPath, jpgPath);
        console.log('Success:', jpgPath);

    } catch (error) {
        console.error('SERVICE TEST FAILED:', error);
    }
}

testService();
