const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execPromise = util.promisify(exec);

// Paths - Must match service
const LIBREOFFICE_PATH = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
const GHOSTSCRIPT_PATH = 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe';

async function test() {
    console.log('--- STARTING DEEP CONVERSION DIAGNOSTIC ---');
    const tempDir = path.join(__dirname, 'debug_output');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // 1. Create a dummy PDF (Text -> PDF via LibreOffice)
    // This we know works from previous test, but we need a valid PDF input.
    console.log('\n[1/3] Creating Input PDF...');
    const txtFile = path.join(tempDir, 'input.txt');
    fs.writeFileSync(txtFile, 'This is a test PDF for conversion debugging.');

    // Use simple C:/Temp profile logic from service
    const tempBase = 'C:/Temp';
    if (!fs.existsSync(tempBase)) try { fs.mkdirSync(tempBase); } catch (e) { }
    const tempProfileDir = `${tempBase}/LO_Debug_${Date.now()}`; /* Forward slashes */

    const createPdfCommand = `"${LIBREOFFICE_PATH}" -env:UserInstallation=file:///${tempProfileDir} --headless --convert-to pdf --outdir "${tempDir}" "${txtFile}"`;
    try {
        await execPromise(createPdfCommand);
        console.log('PDF Created.');
    } catch (e) {
        console.error('PDF Creation Failed:', e.message);
        return;
    }

    const inputPdf = path.join(tempDir, 'input.pdf');
    if (!fs.existsSync(inputPdf)) {
        console.error('PDF file missing!');
        return;
    }

    // 2. Test PDF -> DOCX (The likely failure point)
    console.log('\n[2/3] Testing PDF -> DOCX (with filter)...');

    // Exact command structure from pdfService.ts
    // inputPath ends with .pdf, so filterArg is added.
    const filterArg = ' --infilter="writer_pdf_import"';
    const outputDir = tempDir;
    // New profile to simulate clean state
    const convertProfileDir = `${tempBase}/LO_Debug_Convert_${Date.now()}`;

    const command = `"${LIBREOFFICE_PATH}" -env:UserInstallation=file:///${convertProfileDir} --headless${filterArg} --convert-to docx --outdir "${outputDir}" "${inputPdf}"`;

    console.log('Command:', command);

    try {
        const { stdout, stderr } = await execPromise(command);
        console.log('STDOUT:', stdout);
        console.log('STDERR:', stderr);

        const outputDocx = path.join(outputDir, 'input.docx');
        if (fs.existsSync(outputDocx)) {
            console.log('SUCCESS: input.docx created.');
            console.log('Size:', fs.statSync(outputDocx).size, 'bytes');
        } else {
            console.error('FAILURE: input.docx NOT found.');
        }
    } catch (e) {
        console.error('EXEC ERROR:', e.message);
    }

    // 3. Test PDF -> JPG (Ghostscript)
    console.log('\n[3/3] Testing PDF -> JPG (Ghostscript)...');
    const outputJpg = path.join(tempDir, 'input.jpg');
    const gsCommand = `"${GHOSTSCRIPT_PATH}" -sDEVICE=jpeg -dJPEGQ=90 -r300 -dNOPAUSE -dBATCH -dFirstPage=1 -dLastPage=1 -sOutputFile="${outputJpg}" "${inputPdf}"`;
    try {
        await execPromise(gsCommand);
        if (fs.existsSync(outputJpg)) {
            console.log('SUCCESS: input.jpg created.');
        } else {
            console.error('FAILURE: input.jpg NOT found.');
        }
    } catch (e) {
        console.error('GS ERROR:', e.message);
    }
}

test();
