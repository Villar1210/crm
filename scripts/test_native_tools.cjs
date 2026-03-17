const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execPromise = util.promisify(exec);

// Paths
const LIBREOFFICE_PATH = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
const GHOSTSCRIPT_PATH = 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe';
const TESSERACT_PATH = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';

async function test() {
    console.log('--- STARTING NATIVE TOOLS VERIFICATION ---');
    const tempDir = path.join(__dirname, 'native_test_output');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // 1. Check binaries
    console.log('\n[1/4] checking Binaries...');
    console.log('LibreOffice:', fs.existsSync(LIBREOFFICE_PATH) ? 'OK' : 'MISSING');
    console.log('Ghostscript:', fs.existsSync(GHOSTSCRIPT_PATH) ? 'OK' : 'MISSING');
    console.log('Tesseract:', fs.existsSync(TESSERACT_PATH) ? 'OK' : 'MISSING');

    // 2. Create Dummy Files
    console.log('\n[2/4] Creating Test Files...');
    const txtFile = path.join(tempDir, 'source.txt');
    fs.writeFileSync(txtFile, 'This is a test file for PDF conversion.');
    console.log('Created source.txt');

    // 3. Test LibreOffice (TXT -> PDF)
    console.log('\n[3/4] Testing LibreOffice (TXT -> PDF)...');
    try {
        const loCommand = `"${LIBREOFFICE_PATH}" --headless --convert-to pdf --outdir "${tempDir}" "${txtFile}"`;
        await execPromise(loCommand);
        if (fs.existsSync(path.join(tempDir, 'source.pdf'))) {
            console.log('SUCCESS: LibreOffice created source.pdf');
        } else {
            console.error('FAILURE: LibreOffice did not create PDF.');
        }
    } catch (e) {
        console.error('ERROR LibreOffice:', e.message);
    }

    // 4. Test Ghostscript (Compress PDF)
    console.log('\n[4/4] Testing Ghostscript (Compress PDF)...');
    try {
        const inputPdf = path.join(tempDir, 'source.pdf');
        if (fs.existsSync(inputPdf)) {
            const outputPdf = path.join(tempDir, 'compressed.pdf');
            const gsCommand = `"${GHOSTSCRIPT_PATH}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPdf}" "${inputPdf}"`;
            await execPromise(gsCommand);
            if (fs.existsSync(outputPdf)) {
                console.log('SUCCESS: Ghostscript created compressed.pdf');
            } else {
                console.error('FAILURE: Ghostscript did not create output.');
            }
        } else {
            console.log('SKIPPING Ghostscript (no input PDF)');
        }
    } catch (e) {
        console.error('ERROR Ghostscript:', e.message);
    }

    // 5. Test Tesseract (OCR)
    console.log('\n[5/5] Testing Tesseract (OCR)...');
    // Note: Tesseract needs an image usually, or PDF. 
    // Let's create a dummy image-based PDF or just run version check to confirm execution.
    try {
        const tessCommand = `"${TESSERACT_PATH}" --version`;
        const { stdout } = await execPromise(tessCommand);
        console.log('SUCCESS: Tesseract Version:', stdout.split('\n')[0]);
    } catch (e) {
        console.error('ERROR Tesseract:', e.message);
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

test();
