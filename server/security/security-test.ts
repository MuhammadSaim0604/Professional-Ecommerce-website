// Security testing and monitoring utilities

export interface SecurityTest {
  route: string;
  method: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  hasEncryption: boolean;
  description: string;
}

// Comprehensive list of secure routes
export const SECURE_ROUTES: SecurityTest[] = [
  // Order routes
  { route: '/api/orders', method: 'GET', requiresAuth: true, requiresAdmin: false, hasEncryption: true, description: 'Get user orders with encryption' },
  { route: '/api/orders', method: 'POST', requiresAuth: true, requiresAdmin: false, hasEncryption: true, description: 'Create order with encrypted data' },
  { route: '/api/orders/:id/upload-proof', method: 'POST', requiresAuth: true, requiresAdmin: false, hasEncryption: true, description: 'Upload payment proof with encryption' },
  
  // Admin routes
  { route: '/api/admin/orders/:id/approve', method: 'PUT', requiresAuth: true, requiresAdmin: true, hasEncryption: true, description: 'Admin approve orders with encryption' },
  { route: '/api/admin/coupons', method: 'POST', requiresAuth: true, requiresAdmin: true, hasEncryption: true, description: 'Admin create coupons with encryption' },
  { route: '/api/users', method: 'GET', requiresAuth: true, requiresAdmin: true, hasEncryption: true, description: 'Admin get users with encryption' },
  
  // User profile routes
  { route: '/api/profile', method: 'PUT', requiresAuth: true, requiresAdmin: false, hasEncryption: true, description: 'Update user profile with encryption' },
  { route: '/api/profile/password', method: 'PUT', requiresAuth: true, requiresAdmin: false, hasEncryption: false, description: 'Change password (already hashed)' },
  
  // Product admin routes
  { route: '/api/products', method: 'POST', requiresAuth: true, requiresAdmin: true, hasEncryption: true, description: 'Admin create products with encryption' },
];

// Security monitoring function
export function logSecurityEvent(type: 'AUTH' | 'ENCRYPTION' | 'ACCESS', details: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  };
  
  console.log(`🔐 SECURITY EVENT [${type}] ${timestamp}:`, JSON.stringify(logEntry));
  
  // In production, you would send this to a security monitoring service
}

// Validate route security configuration
export function validateRouteSecurity(route: string, method: string): SecurityTest | null {
  return SECURE_ROUTES.find(r => 
    route.match(new RegExp(r.route.replace(/:\w+/g, '\\w+'))) && 
    r.method === method
  ) || null;
}

// Generate security report
export function generateSecurityReport(): {
  totalRoutes: number;
  secureRoutes: number;
  encryptedRoutes: number;
  adminRoutes: number;
  authRoutes: number;
} {
  return {
    totalRoutes: SECURE_ROUTES.length,
    secureRoutes: SECURE_ROUTES.filter(r => r.requiresAuth || r.requiresAdmin).length,
    encryptedRoutes: SECURE_ROUTES.filter(r => r.hasEncryption).length,
    adminRoutes: SECURE_ROUTES.filter(r => r.requiresAdmin).length,
    authRoutes: SECURE_ROUTES.filter(r => r.requiresAuth).length
  };
}

// Security headers validation
export const REQUIRED_SECURITY_HEADERS = [
  'X-Content-Type-Options',
  'X-Frame-Options', 
  'X-XSS-Protection',
  'Cache-Control'
];

export function validateSecurityHeaders(headers: Record<string, string>): boolean {
  return REQUIRED_SECURITY_HEADERS.every(header => 
    headers[header.toLowerCase()] !== undefined
  );
}