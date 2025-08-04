import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get or generate encryption key
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;
  
  if (keyString) {
    return Buffer.from(keyString, 'hex');
  }
  
  // Generate a new key for development
  const key = crypto.randomBytes(KEY_LENGTH);
  console.warn('⚠️ Using generated encryption key. Set ENCRYPTION_KEY in production!');
  return key;
}

const ENCRYPTION_KEY = getEncryptionKey();

// Encrypt data
export function encrypt(data: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('shopflow-auth', 'utf8'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV, tag, and encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Data encryption failed');
  }
}

// Decrypt data
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('shopflow-auth', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Data decryption failed');
  }
}

// Hash data (one-way)
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Generate secure random string
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return generateSecureRandom(32);
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// Encrypt sensitive user data
export function encryptUserData(data: any): string {
  return encrypt(JSON.stringify(data));
}

// Decrypt sensitive user data
export function decryptUserData(encryptedData: string): any {
  try {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('User data decryption failed:', error);
    return null;
  }
}

// Generate API key
export function generateApiKey(): string {
  const timestamp = Date.now().toString();
  const random = generateSecureRandom(16);
  const combined = timestamp + random;
  return 'sf_' + Buffer.from(combined).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
}

// Secure compare (timing attack resistant)
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Hash password with salt (additional layer)
export function hashPasswordWithSalt(password: string, salt?: string): {
  hash: string;
  salt: string;
} {
  const useSalt = salt || generateSecureRandom(16);
  const hash = crypto.pbkdf2Sync(password, useSalt, 100000, 64, 'sha256').toString('hex');
  
  return {
    hash,
    salt: useSalt
  };
}

// Verify password with salt
export function verifyPasswordWithSalt(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return secureCompare(computed, hash);
}

// Encrypt credit card data (PCI compliance)
export function encryptPaymentData(cardData: {
  number: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
}): string {
  // Mask card number (show only last 4 digits)
  const maskedNumber = '**** **** **** ' + cardData.number.slice(-4);
  
  // Don't store CVV (PCI compliance)
  const safeData = {
    number: maskedNumber,
    expiryMonth: cardData.expiryMonth,
    expiryYear: cardData.expiryYear,
    lastFour: cardData.number.slice(-4)
  };
  
  return encrypt(JSON.stringify(safeData));
}

// Generate session token
export function generateSessionToken(): string {
  return generateSecureRandom(48);
}

// Create signature for webhook verification
export function createWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  return secureCompare(signature, expectedSignature);
}

// Obfuscate sensitive data for logging
export function obfuscateForLogging(data: any): any {
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'cvv', 'ssn', 
    'creditCard', 'bankAccount', 'pin', 'signature'
  ];
  
  if (typeof data === 'string') {
    return data.length > 10 ? data.substring(0, 4) + '***' + data.substring(data.length - 4) : '***';
  }
  
  if (typeof data === 'object' && data !== null) {
    const obfuscated: any = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => keyLower.includes(field));
      
      if (isSensitive) {
        obfuscated[key] = '***REDACTED***';
      } else if (typeof value === 'object') {
        obfuscated[key] = obfuscateForLogging(value);
      } else {
        obfuscated[key] = value;
      }
    }
    
    return obfuscated;
  }
  
  return data;
}

// Initialize encryption system
export function initializeEncryption(): void {
  // Validate encryption setup
  try {
    const testData = 'test-encryption-data';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    if (decrypted !== testData) {
      throw new Error('Encryption test failed');
    }
    
    console.log('🔐 Encryption system initialized successfully');
  } catch (error) {
    console.error('❌ Encryption system initialization failed:', error);
    throw error;
  }
}