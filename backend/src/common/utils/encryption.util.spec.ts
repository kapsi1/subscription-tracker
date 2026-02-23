import { EncryptionUtil } from './encryption.util';

describe('EncryptionUtil', () => {
  const secret = 'test-secret-key-12345678901234567890123456789012';
  const text = 'sensitive-webhook-secret';

  it('should encrypt and decrypt correctly', () => {
    const encrypted = EncryptionUtil.encrypt(text, secret);
    expect(encrypted).toContain(':');
    
    const decrypted = EncryptionUtil.decrypt(encrypted, secret);
    expect(decrypted).toBe(text);
  });

  it('should fail to decrypt with wrong secret', () => {
    const encrypted = EncryptionUtil.encrypt(text, secret);
    const wrongSecret = 'wrong-secret-key-12345678901234567890123456789012';
    
    expect(() => {
      EncryptionUtil.decrypt(encrypted, wrongSecret);
    }).toThrow();
  });
});
