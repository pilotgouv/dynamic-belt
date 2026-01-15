
import crypto from 'crypto';

// Use a fallback for dev if env is missing, but log warning.
// IN PROD, CONNECTIONS_ENCRYPTION_KEY MUST BE SET (32 chars hex or base64).
const ALGORITHM = 'aes-256-gcm';
const KEY_STRING = process.env.CONNECTIONS_ENCRYPTION_KEY || '00000000000000000000000000000000'; // 32 chars for fallback

export function encrypt(text: string): string {
    const key = Buffer.from(KEY_STRING.padEnd(32).slice(0, 32)); // Ensure 32 bytes
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Return IV:TAG:ENCRYPTED
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
    const key = Buffer.from(KEY_STRING.padEnd(32).slice(0, 32));
    const parts = text.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted string format');

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
