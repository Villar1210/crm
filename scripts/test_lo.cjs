const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execPromise = util.promisify(exec);

// Exact path from pdfService.ts
const LIBREOFFICE_PATH = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

async function test() {
    try {
        console.log('Starting Test (PDF -> DOCX)...');

        // 1. Setup Input
        const inputDir = path.join(__dirname, 'temp_test');
        if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir);

        // We verify against test.pdf from previous run.
        const inputFile = path.join(inputDir, 'test.pdf');

        if (!fs.existsSync(inputFile)) {
            console.error('ERROR: test.pdf not found in temp_test. Please provide a test PDF file.');
            // Fallback: Create a dummy valid-ish PDF? No, complex. 
            // Just fail and ask user to ensure PDF exists or run previous script logic.
            // Actually, let's just create a text file and rename it, though LO might reject it.
            // Best to assume previous step ran.
            return;
        }

        const outputDir = inputDir;

        // 3. Setup Temp Profile (Exact logic from service)
        const tempBase = 'C:/Temp';
        if (!fs.existsSync(tempBase)) {
            console.log(`Creating ${tempBase}...`);
            try { fs.mkdirSync(tempBase); } catch (e) { console.error('Failed to create C:/Temp', e); }
        }

        const tempProfileDir = `${tempBase}/LO_User_DOCX_TEST_${Date.now()}`;
        console.log('Temp Profile Dir:', tempProfileDir);

        // 4. Construct Command: PDF -> DOCX
        // IMPORTANT: LibreOffice requires "writer_pdf_import" filter to open PDFs for editing/conversion
        // Or simply "infilter=writer_pdf_import"
        const command = `"${LIBREOFFICE_PATH}" -env:UserInstallation=file:///${tempProfileDir} --headless --infilter="writer_pdf_import" --convert-to docx --outdir "${outputDir}" "${inputFile}"`;

        console.log('--- COMMAND ---');
        console.log(command);
        console.log('---------------');

        // 5. Execute
        const { stdout, stderr } = await execPromise(command);
        console.log('STDOUT:', stdout);
        console.log('STDERR:', stderr);

        // 6. Verify
        const outputFile = path.join(outputDir, 'test.docx');
        if (fs.existsSync(outputFile)) {
            console.log('SUCCESS: DOCX created at', outputFile);
            console.log('File size:', fs.statSync(outputFile).size, 'bytes');
        } else {
            console.error('FAILURE: Output file not found at', outputFile);
        }

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
        if (e.stdout) console.log('e.STDOUT:', e.stdout);
        if (e.stderr) console.log('e.STDERR:', e.stderr);
    }
}

test();
