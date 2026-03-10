import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

export class EncryptionUtil {
  private static algorithm = 'aes-256-cbc';

  private static getKey(secret: string, salt: Buffer): Buffer {
    return scryptSync(secret, salt, 32);
  }

  static encrypt(text: string, secret: string): string {
    const iv = randomBytes(16);
    const salt = randomBytes(16);
    const key = EncryptionUtil.getKey(secret, salt);
    const cipher = createCipheriv(EncryptionUtil.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string, secret: string): string {
    const parts = encryptedText.split(':');
    let iv: Buffer, key: Buffer, encrypted: string;

    if (parts.length === 3) {
      const [saltHex, ivHex, enc] = parts;
      iv = Buffer.from(ivHex, 'hex');
      key = EncryptionUtil.getKey(secret, Buffer.from(saltHex, 'hex'));
      encrypted = enc;
    } else {
      const [ivHex, enc] = parts;
      iv = Buffer.from(ivHex, 'hex');
      key = EncryptionUtil.getKey(secret, Buffer.from('salt', 'utf8')); // Legacy unsecure salt for backwards compatibility
      encrypted = enc;
    }

    const decipher = createDecipheriv(EncryptionUtil.algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
