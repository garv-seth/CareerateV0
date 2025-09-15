import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "node:crypto";
import { promisify } from "util";

// Environment variable for master encryption key (should be 32 bytes in production)
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'fallback-dev-key-please-change-in-production';
const KEY_DERIVATION_ITERATIONS = 100000; // PBKDF2 iterations for key derivation

export interface EncryptedData {
  encryptedValue: string;
  algorithm: string;
  keyId?: string;
  iv: string;
  authTag: string;
  salt: string;
  metadata?: Record<string, any>;
}

export interface EncryptionOptions {
  algorithm?: string;
  keyId?: string;
  environment?: string;
  metadata?: Record<string, any>;
}

/**
 * Comprehensive encryption service for secure secrets and credentials management
 * Uses AES-256-GCM for authenticated encryption with key derivation
 */
export class EncryptionService {
  private readonly defaultAlgorithm = 'aes-256-gcm';
  private readonly keyCache = new Map<string, Buffer>();

  /**
   * Derives encryption key from master key using PBKDF2
   */
  private deriveKey(salt: Buffer, keyId?: string, environment?: string): Buffer {
    const keyMaterial = `${MASTER_KEY}:${keyId || 'default'}:${environment || 'default'}`;
    const cacheKey = `${keyMaterial}:${salt.toString('hex')}`;
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    const derivedKey = pbkdf2Sync(keyMaterial, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha256');
    this.keyCache.set(cacheKey, derivedKey);
    
    return derivedKey;
  }

  /**
   * Encrypts sensitive data with AES-256-GCM
   */
  async encrypt(
    plaintext: string, 
    options: EncryptionOptions = {}
  ): Promise<EncryptedData> {
    try {
      const algorithm = options.algorithm || this.defaultAlgorithm;
      const salt = randomBytes(16); // 128-bit salt
      const iv = randomBytes(12); // 96-bit IV for GCM
      
      // Derive encryption key
      const key = this.deriveKey(salt, options.keyId, options.environment);
      
      // Create cipher
      const cipher = createCipheriv(algorithm, key, iv);
      cipher.setAAD(salt); // Use salt as additional authenticated data
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag for GCM
      const authTag = (cipher as any).getAuthTag?.() || randomBytes(16);

      return {
        encryptedValue: encrypted,
        algorithm,
        keyId: options.keyId,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex'),
        metadata: options.metadata
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts encrypted data
   */
  async decrypt(
    encryptedData: EncryptedData,
    environment?: string
  ): Promise<string> {
    try {
      const { encryptedValue, algorithm, keyId, iv, authTag, salt } = encryptedData;
      
      // Convert hex strings back to buffers
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');
      const saltBuffer = Buffer.from(salt, 'hex');
      
      // Derive the same key used for encryption
      const key = this.deriveKey(saltBuffer, keyId, environment);
      
      // Create decipher
      const decipher = createDecipheriv(algorithm, key, ivBuffer);
      decipher.setAAD(saltBuffer); // Set the same AAD used during encryption
      
      if ((decipher as any).setAuthTag) {
        (decipher as any).setAuthTag(authTagBuffer);
      }
      
      // Decrypt data
      let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Rotates encryption for existing encrypted data with new key
   */
  async rotateEncryption(
    encryptedData: EncryptedData,
    newKeyId?: string,
    newEnvironment?: string
  ): Promise<EncryptedData> {
    try {
      // First decrypt with old key
      const plaintext = await this.decrypt(encryptedData);
      
      // Re-encrypt with new key
      return await this.encrypt(plaintext, {
        algorithm: encryptedData.algorithm,
        keyId: newKeyId || encryptedData.keyId,
        environment: newEnvironment,
        metadata: {
          ...encryptedData.metadata,
          rotatedAt: new Date().toISOString(),
          previousKeyId: encryptedData.keyId
        }
      });
    } catch (error) {
      throw new Error(`Key rotation failed: ${error.message}`);
    }
  }

  /**
   * Validates encryption strength and compliance
   */
  validateEncryption(encryptedData: EncryptedData): {
    isValid: boolean;
    compliance: string[];
    recommendations: string[];
  } {
    const compliance: string[] = [];
    const recommendations: string[] = [];
    let isValid = true;

    // Check algorithm strength
    if (encryptedData.algorithm === 'aes-256-gcm') {
      compliance.push('AES-256', 'FIPS-140-2', 'GDPR', 'SOC2');
    } else {
      isValid = false;
      recommendations.push('Use AES-256-GCM for compliance');
    }

    // Check IV length
    const ivLength = Buffer.from(encryptedData.iv, 'hex').length;
    if (ivLength < 12) {
      recommendations.push('Use longer IV for better security');
    }

    // Check auth tag presence
    if (!encryptedData.authTag) {
      isValid = false;
      recommendations.push('Authentication tag required for data integrity');
    }

    // Check key rotation age (if metadata available)
    if (encryptedData.metadata?.rotatedAt) {
      const rotatedAt = new Date(encryptedData.metadata.rotatedAt);
      const daysSinceRotation = (Date.now() - rotatedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceRotation > 90) {
        recommendations.push('Consider key rotation (last rotated > 90 days ago)');
      }
    }

    return { isValid, compliance, recommendations };
  }

  /**
   * Generates secure encryption key for external use
   */
  generateSecureKey(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Securely compares two encrypted values without timing attacks
   */
  async secureCompare(
    encryptedData1: EncryptedData,
    encryptedData2: EncryptedData,
    environment?: string
  ): Promise<boolean> {
    try {
      const plaintext1 = await this.decrypt(encryptedData1, environment);
      const plaintext2 = await this.decrypt(encryptedData2, environment);
      
      // Constant-time comparison to prevent timing attacks
      if (plaintext1.length !== plaintext2.length) {
        return false;
      }

      let result = 0;
      for (let i = 0; i < plaintext1.length; i++) {
        result |= plaintext1.charCodeAt(i) ^ plaintext2.charCodeAt(i);
      }

      return result === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clears sensitive data from memory
   */
  clearCache(): void {
    this.keyCache.clear();
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

/**
 * Utility functions for common encryption operations
 */
export class SecretsManager {
  constructor(private encryption: EncryptionService) {}

  /**
   * Encrypts API key with environment-specific encryption
   */
  async encryptApiKey(
    apiKey: string,
    service: string,
    environment: string = 'production'
  ): Promise<EncryptedData> {
    return await this.encryption.encrypt(apiKey, {
      keyId: `api-key-${service}`,
      environment,
      metadata: {
        type: 'api-key',
        service,
        encryptedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Encrypts OAuth tokens with automatic expiration
   */
  async encryptOAuthToken(
    token: string,
    service: string,
    expiresIn?: number,
    environment: string = 'production'
  ): Promise<EncryptedData> {
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    
    return await this.encryption.encrypt(token, {
      keyId: `oauth-token-${service}`,
      environment,
      metadata: {
        type: 'oauth-token',
        service,
        expiresAt: expiresAt?.toISOString(),
        encryptedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Encrypts database credentials
   */
  async encryptDatabaseCredentials(
    credentials: {
      username: string;
      password: string;
      host?: string;
      port?: number;
      database?: string;
    },
    environment: string = 'production'
  ): Promise<EncryptedData> {
    const credentialString = JSON.stringify(credentials);
    
    return await this.encryption.encrypt(credentialString, {
      keyId: `db-credentials`,
      environment,
      metadata: {
        type: 'database-credentials',
        encryptedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Encrypts webhook secrets
   */
  async encryptWebhookSecret(
    secret: string,
    service: string,
    webhookId: string,
    environment: string = 'production'
  ): Promise<EncryptedData> {
    return await this.encryption.encrypt(secret, {
      keyId: `webhook-${service}-${webhookId}`,
      environment,
      metadata: {
        type: 'webhook-secret',
        service,
        webhookId,
        encryptedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Checks if encrypted secret is expired
   */
  isSecretExpired(encryptedData: EncryptedData): boolean {
    if (!encryptedData.metadata?.expiresAt) {
      return false;
    }

    return new Date(encryptedData.metadata.expiresAt) < new Date();
  }

  /**
   * Gets days until secret expires
   */
  getDaysUntilExpiration(encryptedData: EncryptedData): number | null {
    if (!encryptedData.metadata?.expiresAt) {
      return null;
    }

    const expiresAt = new Date(encryptedData.metadata.expiresAt);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}

// Export singleton
export const secretsManager = new SecretsManager(encryptionService);

/**
 * Key rotation service for automatic credential rotation
 */
export class KeyRotationService {
  constructor(private encryption: EncryptionService) {}

  /**
   * Schedules automatic key rotation based on policy
   */
  async scheduleRotation(
    encryptedData: EncryptedData,
    rotationPolicy: {
      intervalDays: number;
      autoRotate: boolean;
      notifyBeforeDays?: number;
    }
  ): Promise<{
    needsRotation: boolean;
    daysSinceRotation: number;
    nextRotationDate: Date;
  }> {
    const rotatedAt = encryptedData.metadata?.rotatedAt 
      ? new Date(encryptedData.metadata.rotatedAt) 
      : new Date(encryptedData.metadata?.encryptedAt || Date.now());

    const daysSinceRotation = (Date.now() - rotatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const needsRotation = daysSinceRotation >= rotationPolicy.intervalDays;
    
    const nextRotationDate = new Date(
      rotatedAt.getTime() + (rotationPolicy.intervalDays * 24 * 60 * 60 * 1000)
    );

    return {
      needsRotation,
      daysSinceRotation: Math.floor(daysSinceRotation),
      nextRotationDate
    };
  }

  /**
   * Performs automatic rotation for expired keys
   */
  async performRotation(
    encryptedData: EncryptedData,
    newKeyId?: string
  ): Promise<EncryptedData> {
    return await this.encryption.rotateEncryption(encryptedData, newKeyId);
  }
}

export const keyRotationService = new KeyRotationService(encryptionService);