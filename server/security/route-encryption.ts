import { Request, Response, NextFunction } from 'express';
import { encrypt, decrypt, encryptUserData, decryptUserData } from './encryption';
import { AuthenticatedRequest } from './authentication';
import { shouldEncryptRoute, logEncryptionEvent } from '../encryption-controller';

// Sensitive data encryption middleware
export function encryptSensitiveData(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send to encrypt sensitive data
  res.send = function(data: any) {
    if (typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        if (shouldEncryptResponse(req.path, jsonData)) {
          const encrypted = encrypt(data);
          return originalSend.call(this, JSON.stringify({
            encrypted: true,
            data: encrypted
          }));
        }
      } catch (e) {
        // Not JSON, proceed normally
      }
    }
    return originalSend.call(this, data);
  };

  // Override res.json to encrypt sensitive data
  res.json = function(obj: any) {
    if (shouldEncryptResponse(req.path, obj)) {
      const encrypted = encrypt(JSON.stringify(obj));
      return originalJson.call(this, {
        encrypted: true,
        data: encrypted
      });
    }
    return originalJson.call(this, obj);
  };

  next();
}

// Decrypt incoming request data middleware
export function decryptRequestData(req: Request, res: Response, next: NextFunction) {
  if (req.body && req.body.encrypted && req.body.data) {
    try {
      const decryptedData = decrypt(req.body.data);
      req.body = JSON.parse(decryptedData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to decrypt request data',
        code: 'DECRYPTION_FAILED'
      });
    }
  }
  next();
}

// Check if response should be encrypted based on route and content
function shouldEncryptResponse(path: string, data: any): boolean {
  // Use the admin-controlled encryption settings
  const shouldEncrypt = shouldEncryptRoute(path);
  
  if (!shouldEncrypt) {
    logEncryptionEvent('SKIP', {
      path,
      method: 'RESPONSE',
      encrypted: false,
      dataSize: JSON.stringify(data).length
    });
    return false;
  }

  // Don't encrypt error responses or simple messages
  if (data && (data.success === false || data.error)) {
    return false;
  }

  // Encrypt if it's a sensitive route and encryption is enabled
  logEncryptionEvent('ENCRYPT', {
    path,
    method: 'RESPONSE',
    encrypted: true,
    dataSize: JSON.stringify(data).length
  });

  return true;
}

// Enhanced authentication middleware with encryption logging
export function secureAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Log security events
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Log sensitive route access
    if (req.user) {
      console.log(`🔐 Secure route access: ${req.method} ${req.path} - User: ${req.user.id} (${req.user.role}) - ${duration}ms`);
    } else {
      console.log(`🚨 Unauthorized access attempt: ${req.method} ${req.path} - IP: ${req.ip} - ${duration}ms`);
    }
    
    return originalSend.call(this, data);
  };

  next();
}

// Order data encryption for order-related routes
export function encryptOrderData(orderData: any): any {
  if (!orderData) return orderData;

  const sensitiveOrderFields = [
    'shippingAddress',
    'billingAddress', 
    'customerInfo',
    'paymentMethod',
    'paymentDetails'
  ];

  const encrypted = { ...orderData };
  
  sensitiveOrderFields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encryptUserData(encrypted[field]);
    }
  });

  return encrypted;
}

// Decrypt order data
export function decryptOrderData(encryptedOrderData: any): any {
  if (!encryptedOrderData) return encryptedOrderData;

  const sensitiveOrderFields = [
    'shippingAddress',
    'billingAddress',
    'customerInfo', 
    'paymentMethod',
    'paymentDetails'
  ];

  const decrypted = { ...encryptedOrderData };
  
  sensitiveOrderFields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decryptUserData(decrypted[field]);
      } catch (error) {
        console.error(`Failed to decrypt order field ${field}:`, error);
        // Keep original data if decryption fails
      }
    }
  });

  return decrypted;
}

// Product data encryption for admin routes
export function encryptProductData(productData: any): any {
  if (!productData) return productData;

  // Encrypt sensitive product admin data
  const encrypted = { ...productData };
  
  if (encrypted.costPrice) {
    encrypted.costPrice = encrypt(String(encrypted.costPrice));
  }
  
  if (encrypted.supplierInfo) {
    encrypted.supplierInfo = encryptUserData(encrypted.supplierInfo);
  }

  return encrypted;
}

// User data encryption for user/admin routes
export function encryptUserDataSecure(userData: any): any {
  if (!userData) return userData;

  const sensitiveUserFields = [
    'email',
    'phone', 
    'address',
    'dateOfBirth',
    'personalInfo'
  ];

  const encrypted = { ...userData };
  
  sensitiveUserFields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(String(encrypted[field]));
    }
  });

  return encrypted;
}

// Route-specific encryption middleware
export const routeEncryption = {
  // Apply to all admin routes
  admin: [encryptSensitiveData, secureAuthMiddleware],
  
  // Apply to order routes
  orders: [decryptRequestData, encryptSensitiveData, secureAuthMiddleware],
  
  // Apply to user profile routes
  users: [decryptRequestData, encryptSensitiveData, secureAuthMiddleware],
  
  // Apply to product admin routes
  products: [encryptSensitiveData, secureAuthMiddleware],
  
  // Apply to payment routes
  payments: [decryptRequestData, encryptSensitiveData, secureAuthMiddleware]
};