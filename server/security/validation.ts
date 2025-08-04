import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Middleware to transform FormData string values to proper types
export function transformFormDataTypes(booleanFields: string[] = [], numberFields: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      // Transform boolean fields
      for (const field of booleanFields) {
        if (req.body[field] !== undefined) {
          if (req.body[field] === 'true') {
            req.body[field] = true;
          } else if (req.body[field] === 'false') {
            req.body[field] = false;
          }
        }
      }
      
      // Transform number fields
      for (const field of numberFields) {
        if (req.body[field] !== undefined && req.body[field] !== '') {
          const numValue = Number(req.body[field]);
          if (!isNaN(numValue)) {
            req.body[field] = numValue;
          }
        }
      }
    }
    next();
  };
}

// Backward compatibility function
export function transformFormDataBooleans(booleanFields: string[]) {
  return transformFormDataTypes(booleanFields, []);
}

// Common validation schemas
export const commonSchemas = {
  id: z.number().int().positive(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  url: z.string().url().max(500),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/),
  quantity: z.number().int().min(1).max(999),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sortOrder: z.enum(['asc', 'desc']),
  pagination: {
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0)
  }
};

// User validation schemas
export const userValidation = {
  register: z.object({
    username: commonSchemas.username,
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: "You must agree to the terms and conditions"
    })
  }),

  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1),
    rememberMe: z.boolean().optional()
  }),

  update: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: commonSchemas.phone.optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    newsletter: z.boolean().optional()
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: commonSchemas.password,
    confirmPassword: z.string().min(1)
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
};

// Product validation schemas
export const productValidation = {
  create: z.object({
    name: z.string().min(1).max(200),
    slug: commonSchemas.slug,
    description: z.string().max(5000).optional(),
    shortDescription: z.string().max(500).optional(),
    price: commonSchemas.price,
    salePrice: commonSchemas.price.optional(),
    originalPrice: commonSchemas.price.optional(),
    categoryId: commonSchemas.id,
    brand: z.string().max(100).optional(),
    sku: z.string().max(50).optional(),
    barcode: z.string().max(50).optional(),
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    stock: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    images: z.array(z.string().url()).max(10).default([]),
    tags: z.array(z.string().max(50)).max(20).default([]),
    featured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(300).optional(),
    metaKeywords: z.array(z.string().max(50)).max(20).default([])
  }),

  update: z.object({
    name: z.string().min(1).max(200).optional(),
    slug: commonSchemas.slug.optional(),
    description: z.string().max(5000).optional(),
    shortDescription: z.string().max(500).optional(),
    price: commonSchemas.price.optional(),
    salePrice: commonSchemas.price.optional(),
    originalPrice: commonSchemas.price.optional(),
    categoryId: commonSchemas.id.optional(),
    brand: z.string().max(100).optional(),
    sku: z.string().max(50).optional(),
    barcode: z.string().max(50).optional(),
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    images: z.array(z.string().url()).max(10).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    featured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(300).optional(),
    metaKeywords: z.array(z.string().max(50)).max(20).optional()
  }),

  filters: z.object({
    search: z.string().max(100).optional(),
    categoryId: commonSchemas.id.optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    minRating: z.number().min(1).max(5).optional(),
    brand: z.string().max(100).optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string().max(50)).optional(),
    sortBy: z.enum(['name', 'price', 'rating', 'createdAt', 'stock']).default('createdAt'),
    sortOrder: commonSchemas.sortOrder.default('desc'),
    limit: commonSchemas.pagination.limit,
    offset: commonSchemas.pagination.offset
  })
};

// Category validation schemas
export const categoryValidation = {
  create: z.object({
    name: z.string().min(1).max(100),
    slug: commonSchemas.slug,
    description: z.string().max(1000).optional(),
    image: z.string().url().optional(),
    parentId: commonSchemas.id.optional(),
    isActive: z.boolean().default(true),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(300).optional()
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: commonSchemas.slug.optional(),
    description: z.string().max(1000).optional(),
    image: z.string().url().optional(),
    parentId: commonSchemas.id.optional(),
    isActive: z.boolean().optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(300).optional()
  })
};

// Order validation schemas
export const orderValidation = {
  create: z.object({
    shippingAddress: z.object({
      firstName: z.string().min(1).max(50),
      lastName: z.string().min(1).max(50),
      company: z.string().max(100).optional(),
      address1: z.string().min(1).max(200),
      address2: z.string().max(200).optional(),
      city: z.string().min(1).max(100),
      state: z.string().max(100).optional(),
      postalCode: z.string().min(1).max(20),
      country: z.string().min(1).max(100),
      phone: commonSchemas.phone
    }),
    billingAddress: z.object({
      firstName: z.string().min(1).max(50),
      lastName: z.string().min(1).max(50),
      company: z.string().max(100).optional(),
      address1: z.string().min(1).max(200),
      address2: z.string().max(200).optional(),
      city: z.string().min(1).max(100),
      state: z.string().max(100).optional(),
      postalCode: z.string().min(1).max(20),
      country: z.string().min(1).max(100),
      phone: commonSchemas.phone
    }).optional(),
    paymentMethod: z.enum(['cod', 'easypaisa', 'jazzcash', 'bank_transfer']),
    cartItems: z.array(z.object({
      productId: commonSchemas.id,
      quantity: commonSchemas.quantity,
      price: commonSchemas.price
    })).min(1),
    couponCode: z.string().max(50).optional(),
    notes: z.string().max(500).optional()
  }),

  updateStatus: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    trackingNumber: z.string().max(100).optional(),
    notes: z.string().max(500).optional()
  })
};

// Address validation schemas
export const addressValidation = {
  create: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    company: z.string().max(100).optional(),
    address1: z.string().min(1).max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
    phone: commonSchemas.phone,
    isDefault: z.boolean().default(false)
  }),

  update: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    company: z.string().max(100).optional(),
    address1: z.string().min(1).max(200).optional(),
    address2: z.string().max(200).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().max(100).optional(),
    postalCode: z.string().min(1).max(20).optional(),
    country: z.string().min(1).max(100).optional(),
    phone: commonSchemas.phone.optional(),
    isDefault: z.boolean().optional()
  })
};

// Review validation schemas
export const reviewValidation = {
  create: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(200),
    comment: z.string().min(1).max(2000),
    pros: z.array(z.string().max(100)).max(10).default([]),
    cons: z.array(z.string().max(100)).max(10).default([]),
    wouldRecommend: z.boolean().default(true)
  }),

  update: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(1).max(200).optional(),
    comment: z.string().min(1).max(2000).optional(),
    pros: z.array(z.string().max(100)).max(10).optional(),
    cons: z.array(z.string().max(100)).max(10).optional(),
    wouldRecommend: z.boolean().optional()
  })
};

// Coupon validation schemas
export const couponValidation = {
  create: z.object({
    code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/),
    description: z.string().max(200).optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: commonSchemas.price,
    minimumOrderAmount: commonSchemas.price.optional(),
    maximumDiscountAmount: commonSchemas.price.optional(),
    usageLimit: z.number().int().min(1).optional(),
    userUsageLimit: z.number().int().min(1).default(1),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
    applyToShipping: z.boolean().default(false),
    applyToTax: z.boolean().default(false),
    isActive: z.boolean().default(true),
    applicableCategories: z.array(commonSchemas.id).optional(),
    applicableProducts: z.array(commonSchemas.id).optional()
  }),

  update: z.object({
    code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/).optional(),
    description: z.string().max(200).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: commonSchemas.price.optional(),
    minimumOrderAmount: commonSchemas.price.optional(),
    maximumDiscountAmount: commonSchemas.price.optional(),
    usageLimit: z.number().int().min(1).optional(),
    userUsageLimit: z.number().int().min(1).optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    applyToShipping: z.boolean().optional(),
    applyToTax: z.boolean().optional(),
    isActive: z.boolean().optional(),
    applicableCategories: z.array(commonSchemas.id).optional(),
    applicableProducts: z.array(commonSchemas.id).optional()
  })
};

// File upload validation
export function validateFileUpload(
  allowedTypes: string[],
  maxSize: number
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    next();
  };
}

// Generic validation middleware
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(422).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        code: 'INVALID_DATA'
      });
    }
  };
}

// Query parameters validation middleware
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert string query parameters to appropriate types
      const processedQuery = processQueryParams(req.query);
      const validated = schema.parse(processedQuery);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(422).json({
          success: false,
          message: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        code: 'INVALID_QUERY'
      });
    }
  };
}

// URL parameters validation middleware
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert string parameters to appropriate types
      const processedParams = processQueryParams(req.params);
      const validated = schema.parse(processedParams);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(422).json({
          success: false,
          message: 'Invalid URL parameters',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid URL parameters',
        code: 'INVALID_PARAMS'
      });
    }
  };
}

// Helper function to process query parameters
function processQueryParams(params: any): any {
  const processed: any = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Try to convert to number
      if (/^\d+$/.test(value)) {
        processed[key] = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        processed[key] = parseFloat(value);
      } else if (value === 'true') {
        processed[key] = true;
      } else if (value === 'false') {
        processed[key] = false;
      } else {
        processed[key] = value;
      }
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

// Input sanitization for HTML content
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Validate and sanitize user input
export function validateAndSanitize(data: any): any {
  if (typeof data === 'string') {
    return sanitizeHtml(data);
  }

  if (Array.isArray(data)) {
    return data.map(validateAndSanitize);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = validateAndSanitize(value);
    }
    return sanitized;
  }

  return data;
}