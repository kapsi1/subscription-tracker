import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

export class EncryptionUtil {
  private static algorithm = 'aes-256-cbc';

  private static getKey(secret: string): Buffer {
    return scryptSync(secret, 'salt', 32);
  }

  static encrypt(text: string, secret: string): string {
    const iv = randomBytes(16);
    const key = this.getKey(secret);
    const cipher = createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string, secret: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = this.getKey(secret);
    const decipher = createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
