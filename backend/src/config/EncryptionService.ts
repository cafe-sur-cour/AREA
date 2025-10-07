import crypto from "crypto";

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export class StringEncryption {
  private readonly algorithm = "aes-256-gcm";
  private readonly key: Buffer;
  private readonly keyLength = 32;

  constructor(encryptionKey?: string) {
    void encryptionKey;

    const envKey = process.env.ENCRYPTION_KEY;

    if (!envKey) {
      throw new Error(
        "Encryption key is required. Set ENCRYPTION_KEY environment variable ENCRYPTION_KEY.",
      );
    }

    this.key = crypto.pbkdf2Sync(
      envKey,
      "encryption-salt",
      100000,
      this.keyLength,
      "sha256",
    );
  }

  /**
   * Encrypt a string
   * @param text - The plaintext string to encrypt
   * @returns Object containing encrypted data, IV, and authentication tag
   */
  encrypt(text: string): EncryptedData {
    if (typeof text !== "string") {
      throw new Error("Input must be a string");
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    cipher.setAAD(Buffer.from("string-encryption", "utf8"));
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  }

  /**
   * Decrypt a string
   * @param encryptedData - Object containing encrypted data, IV, and tag
   * @returns The decrypted plaintext string
   */
  decrypt(encryptedData: EncryptedData): string {
    const { encrypted, iv, tag } = encryptedData;

    if (!encrypted || !iv || !tag) {
      throw new Error("Invalid encrypted data format");
    }

    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, "hex"),
      );
      decipher.setAAD(Buffer.from("string-encryption", "utf8"));
      decipher.setAuthTag(Buffer.from(tag, "hex"));

      // Decrypt the data
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error("Failed to decrypt data. : " + (error as Error).message);
    }
  }

  /**
   * Encrypt a string and return as a single base64 string
   * Useful for storing in a single database column
   * @param text - The plaintext string to encrypt
   * @returns Base64 encoded string containing all encrypted data
   */
  encryptToString(text: string): string {
    const encrypted = this.encrypt(text);
    const combined = JSON.stringify(encrypted);
    return Buffer.from(combined).toString("base64");
  }

  /**
   * Decrypt from a base64 string
   * @param encryptedString - Base64 encoded string containing encrypted data
   * @returns The decrypted plaintext string
   */
  decryptFromString(encryptedString: string): string {
    try {
      const combined = Buffer.from(encryptedString, "base64").toString("utf8");
      const encryptedData: EncryptedData = JSON.parse(combined);
      return this.decrypt(encryptedData);
    } catch (error) {
      throw new Error(
        "Invalid encrypted string format: " + (error as Error).message,
      );
    }
  }

  /**
   * Generate a secure random encryption key
   * Use this to generate a key for your .env file
   * @returns A secure random key as base64 string
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString("base64");
  }
}
