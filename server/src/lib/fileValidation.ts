import fs from 'fs';

export function isPdf(filePath: string): boolean {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString('ascii', 0, 4) === '%PDF';
}

export function isImage(filePath: string): boolean {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    const hex = buffer.toString('hex');
    return (
        hex.startsWith('ffd8ff') ||
        hex.startsWith('89504e47') ||
        hex.startsWith('47494638')
    );
}
