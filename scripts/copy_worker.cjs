
const fs = require('fs');
const path = require('path');

try {
    const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.js');
    console.log('Found worker at:', workerPath);

    // Ensure public exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    const dest = path.join(publicDir, 'pdf.worker.min.js');
    fs.copyFileSync(workerPath, dest);
    console.log('Successfully copied to:', dest);
} catch (e) {
    console.error('Failed to copy worker:', e);
}
