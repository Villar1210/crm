import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY;
const ENCRYPTION_KEY = KEY_HEX ? Buffer.from(KEY_HEX, 'hex') : null;
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) return text;
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `enc:${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
    if (!text.startsWith('enc:')) return text;
    if (!ENCRYPTION_KEY) return text;
    const [, ivHex, encryptedHex] = text.split(':');
    const decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
}
