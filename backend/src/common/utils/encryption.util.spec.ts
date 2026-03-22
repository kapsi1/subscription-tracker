import { decrypt, encrypt } from './encryption.util';

describe('EncryptionUtil', () => {
  const secret = 'test-secret-key-12345678901234567890123456789012';
  const text = 'sensitive-data-to-encrypt';

  it('should encrypt and decrypt correctly', () => {
    const encrypted = encrypt(text, secret);
    expect(encrypted).toContain(':');

    const decrypted = decrypt(encrypted, secret);
    expect(decrypted).toBe(text);
  });

  it('should fail to decrypt with wrong secret', () => {
    const encrypted = encrypt(text, secret);
    const wrongSecret = 'wrong-secret-key-12345678901234567890123456789012';

    expect(() => {
      decrypt(encrypted, wrongSecret);
    }).toThrow();
  });
});
