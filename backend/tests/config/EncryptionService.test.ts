import { StringEncryption } from '../../src/config/EncryptionService';

// Mock crypto module for consistent testing
jest.mock('crypto', () => ({
  pbkdf2Sync: jest.fn(),
  randomBytes: jest.fn(),
  createCipheriv: jest.fn(),
  createDecipheriv: jest.fn(),
}));

// Mock process.env
const originalEnv = process.env;

describe('StringEncryption', () => {
  let mockCrypto: jest.Mocked<typeof import('crypto')>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup crypto mocks
    mockCrypto = require('crypto') as jest.Mocked<typeof import('crypto')>;

    // Mock pbkdf2Sync to return a consistent key
    mockCrypto.pbkdf2Sync.mockReturnValue(
      Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
    );

    // Mock randomBytes for IV generation
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from('0123456789abcdef0123456789abcdef', 'hex') as any
    );

    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize successfully with valid ENCRYPTION_KEY', () => {
      process.env.ENCRYPTION_KEY = 'test-key-123';

      expect(() => new StringEncryption()).not.toThrow();
      expect(mockCrypto.pbkdf2Sync).toHaveBeenCalledWith(
        'test-key-123',
        'encryption-salt',
        100000,
        32,
        'sha256'
      );
    });

    it('should throw error when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => new StringEncryption()).toThrow(
        'Encryption key is required. Set ENCRYPTION_KEY environment variable ENCRYPTION_KEY.'
      );
    });

    it('should throw error when ENCRYPTION_KEY is empty', () => {
      process.env.ENCRYPTION_KEY = '';

      expect(() => new StringEncryption()).toThrow(
        'Encryption key is required. Set ENCRYPTION_KEY environment variable ENCRYPTION_KEY.'
      );
    });

    it('should accept encryptionKey parameter but ignore it', () => {
      process.env.ENCRYPTION_KEY = 'env-key';

      const encryption = new StringEncryption('ignored-key');

      expect(mockCrypto.pbkdf2Sync).toHaveBeenCalledWith(
        'env-key', // Should use env key, not parameter
        'encryption-salt',
        100000,
        32,
        'sha256'
      );
    });
  });

  describe('encrypt', () => {
    let encryption: StringEncryption;
    let mockCipher: any;

    beforeEach(() => {
      process.env.ENCRYPTION_KEY = 'test-key';
      encryption = new StringEncryption();

      // Mock cipher methods
      mockCipher = {
        setAAD: jest.fn(),
        update: jest.fn().mockReturnValue('encrypted-data'),
        final: jest.fn().mockReturnValue('final-data'),
        getAuthTag: jest
          .fn()
          .mockReturnValue(
            Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
          ),
      };
      mockCrypto.createCipheriv.mockReturnValue(mockCipher as any);
    });

    it('should encrypt a string successfully', () => {
      const result = encryption.encrypt('hello world');

      expect(mockCrypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.any(Buffer),
        expect.any(Buffer)
      );
      expect(mockCipher.setAAD).toHaveBeenCalledWith(
        Buffer.from('string-encryption', 'utf8')
      );
      expect(mockCipher.update).toHaveBeenCalledWith(
        'hello world',
        'utf8',
        'hex'
      );
      expect(mockCipher.final).toHaveBeenCalledWith('hex');
      expect(mockCipher.getAuthTag).toHaveBeenCalled();

      expect(result).toEqual({
        encrypted: 'encrypted-datafinal-data',
        iv: '0123456789abcdef0123456789abcdef', // hex representation of the mock IV
        tag: '0123456789abcdef0123456789abcdef', // hex representation of the mock auth tag
      });
    });

    it('should throw error for non-string input', () => {
      expect(() => encryption.encrypt(123 as any)).toThrow(
        'Input must be a string'
      );
      expect(() => encryption.encrypt(null as any)).toThrow(
        'Input must be a string'
      );
      expect(() => encryption.encrypt(undefined as any)).toThrow(
        'Input must be a string'
      );
      expect(() => encryption.encrypt({} as any)).toThrow(
        'Input must be a string'
      );
    });

    it('should handle empty string', () => {
      const result = encryption.encrypt('');

      expect(result.encrypted).toBe('encrypted-datafinal-data');
      expect(result.iv).toBeDefined();
      expect(result.tag).toBeDefined();
    });

    it('should handle special characters and unicode', () => {
      const testString = 'Hello 世界 🌍 émojis & spécial chars!';
      encryption.encrypt(testString);

      expect(mockCipher.update).toHaveBeenCalledWith(testString, 'utf8', 'hex');
    });
  });

  describe('decrypt', () => {
    let encryption: StringEncryption;
    let mockDecipher: any;

    beforeEach(() => {
      process.env.ENCRYPTION_KEY = 'test-key';
      encryption = new StringEncryption();

      // Mock decipher methods
      mockDecipher = {
        setAAD: jest.fn(),
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue('decrypted-data'),
        final: jest.fn().mockReturnValue('final-decrypted'),
      };
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any);
    });

    it('should decrypt valid encrypted data successfully', () => {
      const encryptedData = {
        encrypted: 'encrypted-string',
        iv: '0123456789abcdef0123456789abcdef',
        tag: '1234567890abcdef',
      };

      const result = encryption.decrypt(encryptedData);

      expect(mockCrypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.any(Buffer),
        Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
      );
      expect(mockDecipher.setAAD).toHaveBeenCalledWith(
        Buffer.from('string-encryption', 'utf8')
      );
      expect(mockDecipher.setAuthTag).toHaveBeenCalledWith(
        Buffer.from('1234567890abcdef', 'hex')
      );
      expect(mockDecipher.update).toHaveBeenCalledWith(
        'encrypted-string',
        'hex',
        'utf8'
      );
      expect(mockDecipher.final).toHaveBeenCalledWith('utf8');

      expect(result).toBe('decrypted-datafinal-decrypted');
    });

    it('should throw error for missing encrypted field', () => {
      const invalidData = {
        iv: '0123456789abcdef0123456789abcdef',
        tag: '1234567890abcdef',
      } as any;

      expect(() => encryption.decrypt(invalidData)).toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should throw error for missing iv field', () => {
      const invalidData = {
        encrypted: 'encrypted-string',
        tag: '1234567890abcdef',
      } as any;

      expect(() => encryption.decrypt(invalidData)).toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should throw error for missing tag field', () => {
      const invalidData = {
        encrypted: 'encrypted-string',
        iv: '0123456789abcdef0123456789abcdef',
      } as any;

      expect(() => encryption.decrypt(invalidData)).toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should throw error for empty encrypted field', () => {
      const invalidData = {
        encrypted: '',
        iv: '0123456789abcdef0123456789abcdef',
        tag: '1234567890abcdef',
      };

      expect(() => encryption.decrypt(invalidData)).toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should throw error for empty iv field', () => {
      const invalidData = {
        encrypted: 'encrypted-string',
        iv: '',
        tag: '1234567890abcdef',
      };

      expect(() => encryption.decrypt(invalidData)).toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should throw error for empty tag field', () => {
      const invalidData = {
        encrypted: 'encrypted-string',
        iv: '0123456789abcdef0123456789abcdef',
        tag: '',
      };

      expect(() => encryption.decrypt(invalidData)).toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should handle decryption errors gracefully', () => {
      mockDecipher.final.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const encryptedData = {
        encrypted: 'encrypted-string',
        iv: '0123456789abcdef0123456789abcdef',
        tag: '1234567890abcdef',
      };

      expect(() => encryption.decrypt(encryptedData)).toThrow(
        'Failed to decrypt data. : Decryption failed'
      );
    });

    it('should handle invalid hex in iv', () => {
      // Mock crypto to throw error for invalid hex
      mockCrypto.createDecipheriv.mockImplementationOnce(() => {
        throw new Error('Invalid IV length');
      });

      const encryptedData = {
        encrypted: 'encrypted-string',
        iv: 'invalid-hex',
        tag: '1234567890abcdef',
      };

      expect(() => encryption.decrypt(encryptedData)).toThrow();
    });

    it('should handle invalid hex in tag', () => {
      // Mock crypto to throw error for invalid tag
      mockCrypto.createDecipheriv.mockReturnValueOnce({
        setAAD: jest.fn(),
        setAuthTag: jest.fn().mockImplementation(() => {
          throw new Error('Invalid authentication tag');
        }),
        update: jest.fn(),
        final: jest.fn(),
      } as any);

      const encryptedData = {
        encrypted: 'encrypted-string',
        iv: '0123456789abcdef0123456789abcdef',
        tag: 'invalid-hex',
      };

      expect(() => encryption.decrypt(encryptedData)).toThrow();
    });
  });

  describe('encryptToString and decryptFromString', () => {
    let encryption: StringEncryption;
    let mockCipher: any;

    beforeEach(() => {
      process.env.ENCRYPTION_KEY = 'test-key';
      encryption = new StringEncryption();

      // Mock cipher methods
      mockCipher = {
        setAAD: jest.fn(),
        update: jest.fn().mockReturnValue('encrypted-data'),
        final: jest.fn().mockReturnValue('final-data'),
        getAuthTag: jest
          .fn()
          .mockReturnValue(
            Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
          ),
      };
      mockCrypto.createCipheriv.mockReturnValue(mockCipher as any);
    });

    it('should encrypt to string and decrypt from string successfully', () => {
      const originalText =
        'This is a test message with spécial characters: émojis 🌍';

      // Encrypt to string
      const encryptedString = encryption.encryptToString(originalText);

      // Verify it's base64
      expect(() => Buffer.from(encryptedString, 'base64')).not.toThrow();

      // Mock decipher for decryptFromString
      const mockDecipher = {
        setAAD: jest.fn(),
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue('decrypted-data'),
        final: jest.fn().mockReturnValue('final-decrypted'),
      };
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any);

      // Decrypt from string
      const decryptedText = encryption.decryptFromString(encryptedString);

      expect(decryptedText).toBe('decrypted-datafinal-decrypted');
    });

    it('should handle empty string encryption/decryption', () => {
      // Create fresh mocks for this test
      const mockCipher = {
        setAAD: jest.fn(),
        update: jest.fn().mockReturnValue('encrypted-data'),
        final: jest.fn().mockReturnValue('final-data'),
        getAuthTag: jest
          .fn()
          .mockReturnValue(
            Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
          ),
      };
      const mockDecipher = {
        setAAD: jest.fn(),
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue('decrypted-data'),
        final: jest.fn().mockReturnValue('final-decrypted'),
      };

      mockCrypto.createCipheriv.mockReturnValue(mockCipher as any);
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any);

      const encryptedString = encryption.encryptToString('');
      const decryptedText = encryption.decryptFromString(encryptedString);

      expect(decryptedText).toBe('decrypted-datafinal-decrypted');
    });

    it('should throw error for invalid base64 in decryptFromString', () => {
      expect(() => encryption.decryptFromString('invalid-base64!')).toThrow(
        'Invalid encrypted string format'
      );
    });

    it('should throw error for invalid JSON in decryptFromString', () => {
      const invalidBase64 = Buffer.from('not-json').toString('base64');

      expect(() => encryption.decryptFromString(invalidBase64)).toThrow(
        'Invalid encrypted string format'
      );
    });

    it('should throw error for malformed JSON structure', () => {
      const malformedJson = Buffer.from('{"invalid": "structure"}').toString(
        'base64'
      );

      expect(() => encryption.decryptFromString(malformedJson)).toThrow(
        'Invalid encrypted string format'
      );
    });
  });

  describe('generateKey (static method)', () => {
    it('should generate a random key as base64 string', () => {
      const mockKey = Buffer.from(
        'random-key-32-bytes-for-testing-123',
        'utf8'
      );
      mockCrypto.randomBytes.mockReturnValue(mockKey as any);

      const key = StringEncryption.generateKey();

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(key).toBe(mockKey.toString('base64'));
    });

    it('should generate different keys on multiple calls', () => {
      const mockKey1 = Buffer.from(
        'key1-32-bytes-12345678901234567890',
        'utf8'
      );
      const mockKey2 = Buffer.from(
        'key2-32-bytes-12345678901234567890',
        'utf8'
      );

      mockCrypto.randomBytes
        .mockReturnValueOnce(mockKey1 as any)
        .mockReturnValueOnce(mockKey2 as any);

      const key1 = StringEncryption.generateKey();
      const key2 = StringEncryption.generateKey();

      expect(key1).not.toBe(key2);
      expect(key1).toBe(mockKey1.toString('base64'));
      expect(key2).toBe(mockKey2.toString('base64'));
    });

    it('should generate valid base64', () => {
      mockCrypto.randomBytes.mockReturnValue(
        Buffer.from('a'.repeat(32), 'utf8') as any
      );

      const key = StringEncryption.generateKey();

      // Verify it's valid base64
      expect(() => Buffer.from(key, 'base64')).not.toThrow();

      // Verify it decodes to 32 bytes
      const decoded = Buffer.from(key, 'base64');
      expect(decoded.length).toBe(32);
    });
  });

  describe('algorithm and parameters validation', () => {
    it('should use correct algorithm and parameters', () => {
      process.env.ENCRYPTION_KEY = 'algorithm-test-key';
      const encryption = new StringEncryption();

      encryption.encrypt('test');

      expect(mockCrypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.any(Buffer),
        expect.any(Buffer)
      );
      expect(mockCrypto.pbkdf2Sync).toHaveBeenCalledWith(
        'algorithm-test-key',
        'encryption-salt',
        100000,
        32,
        'sha256'
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle crypto operation failures in encrypt', () => {
      process.env.ENCRYPTION_KEY = 'error-test-key';
      const encryption = new StringEncryption();

      const mockCipher = {
        setAAD: jest.fn(),
        update: jest.fn().mockImplementation(() => {
          throw new Error('Crypto operation failed');
        }),
        final: jest.fn(),
        getAuthTag: jest.fn(),
      };
      mockCrypto.createCipheriv.mockReturnValue(mockCipher as any);

      expect(() => encryption.encrypt('test')).toThrow();
    });

    it('should handle crypto operation failures in decrypt', () => {
      process.env.ENCRYPTION_KEY = 'error-test-key';
      const encryption = new StringEncryption();

      const mockDecipher = {
        setAAD: jest.fn(),
        setAuthTag: jest.fn(),
        update: jest.fn().mockImplementation(() => {
          throw new Error('Crypto operation failed');
        }),
        final: jest.fn(),
      };
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any);

      const encryptedData = {
        encrypted: 'test',
        iv: '0123456789abcdef0123456789abcdef',
        tag: '1234567890abcdef',
      };

      expect(() => encryption.decrypt(encryptedData)).toThrow(
        'Failed to decrypt data. : Crypto operation failed'
      );
    });
  });
});
