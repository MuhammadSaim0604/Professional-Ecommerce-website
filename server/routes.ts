import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { systemSettings } from "../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupPerformanceMiddleware, requestTimer } from "./performance";
import { rateLimitConfigs } from "./security/middleware";

import { routeEncryption, encryptOrderData, decryptOrderData } from "./security/route-encryption";
import { getEncryptionSettings, updateEncryptionSettings, getEncryptionStats } from "./encryption-controller";
// WebSocket functionality removed - using HTTP-only approach

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const paymentsDir = path.join(uploadsDir, 'payments');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true });
}

// Configure multer for payment proof uploads
const paymentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, paymentsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG files are allowed for payment proofs'));
    }
  }
});

// Regular upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Add error handler middleware
function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // WebSocket functionality removed - using HTTP-only approach
  
  // Add performance middleware
  setupPerformanceMiddleware(app);
  app.use(requestTimer);

  // Setup authentication routes
  setupAuth(app);

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Check for existing username
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for existing email
      const existingUserByEmail = await storage.getUserByEmail?.(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create new user
      const userData = {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone || null,
        password: await hashPassword(req.body.password),
        role: 'user',
        isActive: true
      };

      const user = await storage.createUser(userData);

      if (!user) {
        return res.status(500).json({ message: "Failed to create user" });
      }

      // Log the user in automatically
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "User created but login failed" });
        }

        // Remove password from response
        const { password, ...userResponse } = user;
        res.status(201).json(userResponse);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error during registration" });
    }
  });

  // User Profile Management
  app.put("/api/profile", requireAuth, ...routeEncryption.users, asyncHandler(async (req: any, res: any) => {
    const profileData = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      bio: z.string().max(500).optional(),
      dateOfBirth: z.string().optional(),
      gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
      location: z.string().optional(),
      website: z.string().url().optional().or(z.literal('')),
      socialLinks: z.record(z.string()).optional(),
    }).parse(req.body);

    // Convert dateOfBirth string to Date if provided
    const updateData = {
      ...profileData,
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
    };

    const updatedUser = await storage.updateUserProfile(req.user.id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  }));

  app.put("/api/profile/avatar", requireAuth, asyncHandler(async (req: any, res: any) => {
    const { avatar } = z.object({
      avatar: z.string().url(),
    }).parse(req.body);

    const updatedUser = await storage.updateUserProfile(req.user.id, { avatar });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ avatar: updatedUser.avatar });
  }));

  app.put("/api/profile/preferences", requireAuth, asyncHandler(async (req: any, res: any) => {
    const preferences = z.object({
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      preferredLanguage: z.string().optional(),
      preferredCurrency: z.string().optional(),
      timezone: z.string().optional(),
    }).parse(req.body);

    const updatedUser = await storage.updateUserPreferences(req.user.id, preferences);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  }));

  app.put("/api/profile/privacy", requireAuth, asyncHandler(async (req: any, res: any) => {
    const privacySettings = z.object({
      profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
      showEmail: z.boolean().optional(),
      showPhone: z.boolean().optional(),
      showLocation: z.boolean().optional(),
    }).parse(req.body);

    const updatedUser = await storage.updateUserPrivacy(req.user.id, privacySettings);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  }));

  app.put("/api/profile/password", requireAuth, asyncHandler(async (req: any, res: any) => {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    }).parse(req.body);

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValid = await comparePasswords(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await storage.updateUser(req.user.id, { 
      password: hashedPassword 
    });

    res.json({ message: "Password updated successfully" });
  }));

  // Categories
  app.get("/api/categories", asyncHandler(async (req, res) => {
    const { search, status, limit, offset, sortBy, sortOrder } = req.query;

    // If any filtering parameters are provided, use enhanced method
    if (search || status || limit || offset || sortBy || sortOrder) {
      const params = {
        search: search as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
      };

      const result = await storage.getAllCategoriesWithFilters(params);
      res.json(result);
    } else {
      // Default behavior for backward compatibility
      const categories = await storage.getAllCategories();
      res.json(categories);
    }
  }));

  app.post("/api/categories", requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    // Parse form data
    const categoryData = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description || '',
    };

    // Validate required fields
    if (!categoryData.name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Generate slug if not provided
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50);

    // Process uploaded image
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Process existing image URL if provided
    if (req.body.existingImage && !req.file) {
      imageUrl = req.body.existingImage;
    }

    const processedData = {
      name: categoryData.name,
      slug,
      description: categoryData.description,
      image: imageUrl,
      isActive: true,
    };

    const category = await storage.createCategory(processedData);
    
    // Broadcast real-time event
    // Cache invalidation for HTTP-only approach
    
    res.status(201).json(category);
  }));

  app.put("/api/categories/:id", requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    // Parse form data
    const updates: any = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.slug !== undefined) updates.slug = req.body.slug;
    if (req.body.isActive !== undefined) {
      updates.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }

    // Update slug if name changed
    if (updates.name && !updates.slug) {
      updates.slug = updates.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);
    }

    // Process uploaded image
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    // Process existing image URL if provided
    if (req.body.existingImage && !req.file) {
      updates.image = req.body.existingImage;
    }

    try {
      const category = await storage.updateCategory(id, updates);

      if (!category) {
        return res.status(404).json({ 
          success: false,
          message: "Category not found" 
        });
      }

      // Broadcast real-time event
      // Cache invalidation for HTTP-only approach

      res.json({ 
        success: true,
        message: "Category updated successfully",
        data: category 
      });
    } catch (error) {
      console.error('Category update error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update category",
        error: error.message 
      });
    }
  }));

  app.patch("/api/categories/:id", requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    // Parse form data
    const updates: any = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.slug !== undefined) updates.slug = req.body.slug;

    // Update slug if name changed
    if (updates.name && !updates.slug) {
      updates.slug = updates.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);
    }

    // Process uploaded image
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    // Process existing image URL if provided
    if (req.body.existingImage && !req.file) {
      updates.image = req.body.existingImage;
    }

    const category = await storage.updateCategory(id, updates);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Broadcast real-time event
    // Cache invalidation for HTTP-only approach

    res.json(category);
  }));

  app.delete("/api/categories/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteCategory(id);

    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Broadcast real-time event
    // Cache invalidation for HTTP-only approach

    res.status(204).send();
  }));

  // Products
  app.get("/api/products", asyncHandler(async (req, res) => {
    const {
      categoryId,
      search,
      featured,
      active,
      archived,
      flashSale,
      newArrivals,
      brand,
      color,
      priceMin,
      priceMax,
      stock,
      minRating,
      limit = "50",
      offset = "0",
      sortBy = "createdAt",
      sortOrder = "desc",
      excludeFlashSale,
      productType,
      showAll
    } = req.query;

    const params = {
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      search: search as string,
      featured: featured === "true", // Note: This will be mapped to productType filter in storage
      active: active !== undefined ? active === "true" : undefined,
      archived: archived === "true",
      flashSale: flashSale === "true",
      newArrivals: newArrivals === "true",
      brand: brand as string,
      color: color as string,
      priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
      priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
      stock: stock as string,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      excludeFlashSale: excludeFlashSale === "true",
      productType: productType as string,
      showAll: showAll === "true"
    };

    const result = await storage.getAllProducts(params);
    res.json(result);
  }));

  // Product type endpoints - must be before /:slug route
  app.get("/api/products/featured", asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const featuredProducts = await storage.getProductsByType("featured", limit);
    res.json({ products: featuredProducts });
  }));

  app.get("/api/products/new-arrivals", asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const newArrivalProducts = await storage.getProductsByType("new_arrivals", limit);
    res.json({ products: newArrivalProducts });
  }));

  app.get("/api/products/flash-sale", asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const flashSaleProducts = await storage.getProductsByType("flash_sale", limit);
    res.json({ products: flashSaleProducts });
  }));

  app.get("/api/products/simple", asyncHandler(async (req, res) => {
    const simpleProducts = await storage.getProductsByType("simple");
    res.json(simpleProducts);
  }));

  app.get("/api/products/:slug", asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    let product;

    // Try to find by slug first, then by ID as fallback
    if (isNaN(parseInt(slug))) {
      product = await storage.getProductBySlug(slug);
    } else {
      product = await storage.getProduct(parseInt(slug));
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get category data and format response
    const category = product.categoryId ? await storage.getCategory(product.categoryId) : null;

    const formattedProduct = {
      ...product,
      category,
      imageUrl: product.images && Array.isArray(product.images) && product.images.length > 0 
        ? product.images[0] 
        : '/api/placeholder/600/600',
      price: product.price ? product.price.toString() : '0',
      salePrice: product.salePrice ? product.salePrice.toString() : undefined,
      featured: (product as any).productType === "featured",
    };

    res.json(formattedProduct);
  }));

  app.post("/api/products", requireAdmin, ...routeEncryption.products, upload.array('images', 10), asyncHandler(async (req, res) => {
    // Parse form data
    const productData = {
      name: req.body.name,
      shortDescription: req.body.shortDescription || null,
      description: req.body.description || null,
      price: req.body.price,
      originalPrice: req.body.originalPrice || null,
      salePrice: req.body.salePrice || null,
      discountPercentage: req.body.discountPercentage || null,
      categoryId: req.body.categoryId,
      stock: req.body.stock || 0,
      sku: req.body.sku || `SKU-${Date.now()}`,
      weight: req.body.weight || null,
      dimensions: req.body.dimensions || null,
      material: req.body.material || null,
      brand: req.body.brand || null,
      color: req.body.color || null,
      size: req.body.size || null,
      tags: req.body.tags || null,
      productType: req.body.productType || 'simple',
      flashSaleDiscount: req.body.flashSaleDiscount || null,
      flashSaleStartDate: req.body.flashSaleStartDate || null,
      flashSaleEndDate: req.body.flashSaleEndDate || null,
      // Removed legacy isFeatured and isFlashSale fields - now using productType
      isActive: req.body.isActive !== 'false',
      metaTitle: req.body.metaTitle || null,
      metaDescription: req.body.metaDescription || null,
    };

    // Validate required fields
    if (!productData.name || !productData.price || !productData.categoryId) {
      return res.status(400).json({ message: "Name, price, and category are required" });
    }

    // Generate slug from name
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Process tags
    let processedTags = [];
    if (productData.tags) {
      try {
        processedTags = typeof productData.tags === 'string' ? 
          JSON.parse(productData.tags) : productData.tags;
      } catch {
        processedTags = productData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    }

    // Process uploaded images
    let allImages = [];
    if (req.files && Array.isArray(req.files)) {
      allImages = req.files.map((file: any) => `/uploads/${file.filename}`);
    }

    // Process existing image URLs if provided
    if (req.body.existingImages) {
      try {
        const existingImages = JSON.parse(req.body.existingImages);
        allImages = [...allImages, ...existingImages];
      } catch (e) {
        console.error('Error parsing existing images:', e);
      }
    }

    const processedData = {
      name: productData.name,
      shortDescription: productData.shortDescription,
      description: productData.description,
      slug,
      sku: productData.sku,
      price: productData.price.toString(),
      originalPrice: productData.originalPrice ? productData.originalPrice.toString() : null,
      salePrice: productData.salePrice ? productData.salePrice.toString() : null,
      discountPercentage: productData.discountPercentage ? productData.discountPercentage.toString() : null,
      stock: parseInt(productData.stock.toString()),
      categoryId: productData.categoryId ? parseInt(productData.categoryId.toString()) : null,
      // Product type and flash sale fields
      productType: productData.productType,
      flashSaleDiscount: productData.flashSaleDiscount ? productData.flashSaleDiscount.toString() : null,
      flashSaleStartDate: productData.flashSaleStartDate ? new Date(productData.flashSaleStartDate) : null,
      flashSaleEndDate: productData.flashSaleEndDate ? new Date(productData.flashSaleEndDate) : null,
      // Removed legacy status fields - now using productType
      isActive: productData.isActive,
      // Content fields
      tags: processedTags,
      images: allImages,
      // Product specifications
      weight: productData.weight,
      dimensions: productData.dimensions,
      material: productData.material,
      brand: productData.brand,
      color: productData.color,
      size: productData.size,
      // SEO fields
      metaTitle: productData.metaTitle,
      metaDescription: productData.metaDescription,
    };

    const product = await storage.createProduct(processedData);
    
    // Real-time update logging for HTTP-only approach
    console.log('📦 Product created successfully:', product.name, `(ID: ${product.id})`);
    
    // Force cache invalidation by updating response headers
    res.set('X-Product-Updated', Date.now().toString());
    res.set('X-Cache-Invalidate', 'products,featured,new-arrivals,flash-sale');
    
    res.status(201).json(product);
  }));

  app.put("/api/products/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      name: z.string().min(1).max(200).optional(),
      slug: z.string().max(100).optional(),
      description: z.string().max(2000).optional(),
      shortDescription: z.string().max(500).optional(),
      price: z.union([z.string(), z.number()]).optional(),
      salePrice: z.union([z.string(), z.number()]).optional(),
      discountPercentage: z.union([z.string(), z.number()]).optional(),
      sku: z.string().max(50).optional(),
      stock: z.union([z.string(), z.number()]).optional(),
      categoryId: z.union([z.string(), z.number()]).optional(),
      images: z.union([z.array(z.string()), z.string()]).optional(),
      imageUrls: z.union([z.array(z.string()), z.string()]).optional(),
      tags: z.union([z.array(z.string()), z.string()]).optional(),
      featured: z.boolean().optional(),
      // Flash sale fields
      productType: z.string().optional(),
      flashSaleDiscount: z.union([z.string(), z.number()]).optional(),
      flashSaleStartDate: z.string().optional(),
      flashSaleEndDate: z.string().optional(),
      // Removed legacy isFeatured field
      isActive: z.boolean().optional(),
      weight: z.string().optional(),
      dimensions: z.string().optional(),
      material: z.string().optional(),
      brand: z.string().optional(),
      color: z.string().optional(),
      size: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    }).parse(req.body);

    // Process tags - handle both string and array formats
    let processedTags = updates.tags;
    if (typeof updates.tags === 'string') {
      processedTags = updates.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Process images - handle both string and array formats
    let allImages = undefined;
    if (updates.images || updates.imageUrls) {
      allImages = [];
      if (updates.images) {
        if (typeof updates.images === 'string') {
          allImages = [...allImages, ...updates.images.split(',').map(img => img.trim()).filter(img => img.length > 0)];
        } else {
          allImages = [...allImages, ...updates.images];
        }
      }
      if (updates.imageUrls) {
        if (typeof updates.imageUrls === 'string') {
          allImages = [...allImages, ...updates.imageUrls.split(',').map(img => img.trim()).filter(img => img.length > 0)];
        } else {
          allImages = [...allImages, ...updates.imageUrls];
        }
      }
    }

    // Process numeric fields and comprehensive data
    const processedUpdates = {
      ...updates,
      price: updates.price ? updates.price.toString() : undefined,
      salePrice: updates.salePrice ? updates.salePrice.toString() : undefined,
      stock: updates.stock ? parseInt(updates.stock.toString()) : undefined,
      categoryId: updates.categoryId ? parseInt(updates.categoryId.toString()) : undefined,
      // Flash sale fields
      productType: updates.productType || undefined,
      flashSaleDiscount: updates.flashSaleDiscount ? updates.flashSaleDiscount.toString() : undefined,
      flashSaleStartDate: updates.flashSaleStartDate ? new Date(updates.flashSaleStartDate) : undefined,
      flashSaleEndDate: updates.flashSaleEndDate ? new Date(updates.flashSaleEndDate) : undefined,
      // Removed legacy isFeatured field handling
      tags: processedTags,
      images: allImages,
      weight: updates.weight || undefined,
      dimensions: updates.dimensions || undefined,
      material: updates.material || undefined,
      brand: updates.brand || undefined,
      color: updates.color || undefined,
      size: updates.size || undefined,
      metaTitle: updates.metaTitle || undefined,
      metaDescription: updates.metaDescription || undefined,
    };

    const product = await storage.updateProduct(id, processedUpdates);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Real-time update logging for HTTP-only approach
    console.log('✏️ Product updated (PUT):', product.name, `(ID: ${product.id})`);
    
    // Force cache invalidation by updating response headers
    res.set('X-Product-Updated', Date.now().toString());
    res.set('X-Cache-Invalidate', 'products,featured,new-arrivals,flash-sale');

    res.json(product);
  }));

  app.patch("/api/products/:id", requireAdmin, upload.array('images', 10), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Build update object with only provided fields
    const updates: any = {};

    // Handle simple fields
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.shortDescription !== undefined) updates.shortDescription = req.body.shortDescription;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.sku !== undefined) updates.sku = req.body.sku;
    if (req.body.weight !== undefined) updates.weight = req.body.weight;
    if (req.body.dimensions !== undefined) updates.dimensions = req.body.dimensions;
    if (req.body.material !== undefined) updates.material = req.body.material;
    if (req.body.brand !== undefined) updates.brand = req.body.brand;
    if (req.body.color !== undefined) updates.color = req.body.color;
    if (req.body.size !== undefined) updates.size = req.body.size;
    if (req.body.metaTitle !== undefined) updates.metaTitle = req.body.metaTitle;
    if (req.body.metaDescription !== undefined) updates.metaDescription = req.body.metaDescription;

    // Handle numeric fields with proper validation
    if (req.body.price !== undefined && req.body.price !== '') {
      updates.price = req.body.price.toString();
    }
    if (req.body.originalPrice !== undefined && req.body.originalPrice !== '') {
      updates.originalPrice = req.body.originalPrice.toString();
    }
    if (req.body.salePrice !== undefined && req.body.salePrice !== '') {
      updates.salePrice = req.body.salePrice.toString();
    }
    if (req.body.discountPercentage !== undefined && req.body.discountPercentage !== '') {
      updates.discountPercentage = req.body.discountPercentage.toString();
    }
    if (req.body.stock !== undefined && req.body.stock !== '') {
      updates.stock = parseInt(req.body.stock.toString());
    }
    if (req.body.categoryId !== undefined && req.body.categoryId !== '') {
      updates.categoryId = parseInt(req.body.categoryId.toString());
    }

    // Handle boolean fields explicitly
    // Removed legacy isFeatured and isFlashSale - now using productType
    if (req.body.flashSaleDiscount !== undefined && req.body.flashSaleDiscount !== '') {
      updates.flashSaleDiscount = req.body.flashSaleDiscount.toString();
    }
    if (req.body.productType !== undefined) {
      updates.productType = req.body.productType;
    }
    if (req.body.flashSaleStartDate !== undefined && req.body.flashSaleStartDate !== '') {
      updates.flashSaleStartDate = new Date(req.body.flashSaleStartDate);
    }
    if (req.body.flashSaleEndDate !== undefined && req.body.flashSaleEndDate !== '') {
      updates.flashSaleEndDate = new Date(req.body.flashSaleEndDate);
    }
    if (req.body.isActive !== undefined) {
      updates.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    // Removed legacy featured field handling - now using productType

    // Process tags
    if (req.body.tags !== undefined) {
      let processedTags = [];
      try {
        if (typeof req.body.tags === 'string') {
          processedTags = JSON.parse(req.body.tags);
        } else {
          processedTags = req.body.tags;
        }
      } catch {
        processedTags = req.body.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
      updates.tags = processedTags;
    }

    // Process uploaded images
    let allImages = [];
    if (req.files && Array.isArray(req.files)) {
      allImages = req.files.map((file: any) => `/uploads/${file.filename}`);
    }

    // Process existing image URLs if provided
    if (req.body.existingImages) {
      try {
        const existingImages = JSON.parse(req.body.existingImages);
        allImages = [...allImages, ...existingImages];
      } catch (e) {
        console.error('Error parsing existing images:', e);
      }
    }

    if (allImages.length > 0) {
      updates.images = allImages;
    }

    // Ensure we have at least one field to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const product = await storage.updateProduct(id, updates);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Real-time update logging for HTTP-only approach  
    console.log('✏️ Product updated successfully:', product.name, `(ID: ${product.id})`);
    
    // Force cache invalidation by updating response headers
    res.set('X-Product-Updated', Date.now().toString());
    res.set('X-Cache-Invalidate', 'products,featured,new-arrivals,flash-sale');

    res.json(product);
  }));

  app.delete("/api/products/:id", requireAdmin, asyncHandler(async (req: any, res: any) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    try {
      const success = await storage.deleteProduct(id);

      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Real-time deletion logging for HTTP-only approach
      console.log('🗑️ Product deleted:', id);
      
      // Force cache invalidation by updating response headers
      res.set('X-Product-Updated', Date.now().toString());
      res.set('X-Cache-Invalidate', 'products,featured,new-arrivals,flash-sale');

      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error: any) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
  }));

  // Bulk delete products
  app.post("/api/products/bulk/delete", requireAdmin, asyncHandler(async (req: any, res: any) => {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Product IDs are required" });
    }

    try {
      let deletedCount = 0;
      for (const id of productIds) {
        const success = await storage.deleteProduct(parseInt(id));
        if (success) deletedCount++;
      }

      // Real-time bulk deletion logging for HTTP-only approach
      console.log('🗑️ Bulk products deleted:', deletedCount, 'products');
      
      // Force cache invalidation for bulk operations
      res.set('X-Product-Updated', Date.now().toString());
      res.set('X-Cache-Invalidate', 'products,featured,new-arrivals,flash-sale');
      
      res.json({ message: `${deletedCount} products deleted successfully` });
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      res.status(500).json({ error: "Failed to delete products" });
    }
  }));

  // Bulk update products
  app.post("/api/products/bulk/update", requireAdmin, asyncHandler(async (req: any, res: any) => {
    const { productIds, updateData } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Product IDs are required" });
    }

    try {
      let updatedCount = 0;
      for (const id of productIds) {
        const success = await storage.updateProduct(parseInt(id), updateData);
        if (success) updatedCount++;
      }

      // Real-time bulk update logging for HTTP-only approach
      console.log('✏️ Bulk products updated:', updatedCount, 'products');
      
      // Force cache invalidation for bulk operations
      res.set('X-Product-Updated', Date.now().toString());
      res.set('X-Cache-Invalidate', 'products,featured,new-arrivals,flash-sale');
      
      res.json({ message: `${updatedCount} products updated successfully` });
    } catch (error: any) {
      console.error('Bulk update error:', error);
      res.status(500).json({ error: "Failed to update products" });
    }
  }));

  // Cart - Allow guest users to use session-based cart
  app.get("/api/cart", asyncHandler(async (req, res) => {
    if (req.isAuthenticated()) {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } else {
      // For guest users, use session-based cart
      const cartItems = req.session.cart || [];
      res.json(cartItems);
    }
  }));

  app.post("/api/cart", asyncHandler(async (req, res) => {
    const cartData = z.object({
      productId: z.number().int(),
      quantity: z.number().int().min(1).default(1),
    }).parse(req.body);

    if (req.isAuthenticated()) {
      const cartItem = await storage.addToCart({
        userId: req.user.id,
        ...cartData
      });
      res.status(201).json(cartItem);
    } else {
      // For guest users, store in session
      if (!req.session.cart) {
        req.session.cart = [];
      }

      const product = await storage.getProduct(cartData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const existingItem = req.session.cart.find((item: any) => item.productId === cartData.productId);
      if (existingItem) {
        existingItem.quantity += cartData.quantity;
      } else {
        req.session.cart.push({
          id: Date.now(),
          productId: cartData.productId,
          quantity: cartData.quantity,
          product: product
        });
      }

      res.status(201).json({ message: "Added to cart" });
    }
  }));

  app.put("/api/cart/:id", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = z.object({
      quantity: z.number().int().min(1)
    }).parse(req.body);

    // Security: Check if cart item belongs to the user
    const userCartItems = await storage.getCartItems(req.user.id);
    const userCartItem = userCartItems.find(item => item.id === id);

    if (!userCartItem) {
      return res.status(404).json({ message: "Cart item not found or access denied" });
    }

    const cartItem = await storage.updateCartItem(id, quantity);
    res.json(cartItem);
  }));

  app.delete("/api/cart/:id", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    // Security: Check if cart item belongs to the user
    const userCartItems = await storage.getCartItems(req.user.id);
    const userCartItem = userCartItems.find(item => item.id === id);

    if (!userCartItem) {
      return res.status(404).json({ message: "Cart item not found or access denied" });
    }

    const success = await storage.removeFromCart(id);

    if (!success) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.status(204).send();
  }));

  // Wishlist - Allow guest users to use session-based wishlist
  app.get("/api/wishlist", asyncHandler(async (req, res) => {
    if (req.isAuthenticated()) {
      const wishlistItems = await storage.getWishlistItems(req.user.id);
      res.json(wishlistItems);
    } else {
      // For guest users, use session-based wishlist
      const wishlistItems = req.session.wishlist || [];
      res.json(wishlistItems);
    }
  }));

  app.post("/api/wishlist", asyncHandler(async (req, res) => {
    const { productId } = z.object({
      productId: z.number().int()
    }).parse(req.body);

    if (req.isAuthenticated()) {
      const wishlistItem = await storage.addToWishlist({
        userId: req.user.id,
        productId
      });
      res.status(201).json(wishlistItem);
    } else {
      // For guest users, store in session
      if (!req.session.wishlist) {
        req.session.wishlist = [];
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const existingItem = req.session.wishlist.find((item: any) => item.productId === productId);
      if (!existingItem) {
        req.session.wishlist.push({
          id: Date.now(),
          productId: productId,
          product: product
        });
      }

      res.status(201).json({ message: "Added to wishlist" });
    }
  }));

  app.delete("/api/wishlist/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid wishlist item ID" });
    }

    if (req.isAuthenticated()) {
      // Security: Check if wishlist item belongs to the user
      const userWishlistItems = await storage.getWishlistItems(req.user.id);
      const userWishlistItem = userWishlistItems.find(item => item.id === id);

      if (!userWishlistItem) {
        return res.status(404).json({ message: "Wishlist item not found or access denied" });
      }

      const success = await storage.removeFromWishlist(id);
      if (!success) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      res.status(204).send();
    } else {
      // For guest users, remove from session
      if (req.session.wishlist) {
        const originalLength = req.session.wishlist.length;
        req.session.wishlist = req.session.wishlist.filter((item: any) => item.id !== id);

        if (req.session.wishlist.length === originalLength) {
          return res.status(404).json({ message: "Wishlist item not found" });
        }
      } else {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      res.status(204).send();
    }
  }));

  // Orders with pagination and filtering
  app.get("/api/orders", requireAuth, ...routeEncryption.orders, asyncHandler(async (req, res) => {
    const {
      search,
      status,
      paymentStatus,
      paymentMethod,
      dateFrom,
      dateTo,
      limit = "50",
      offset = "0",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const params = {
      search: search as string,
      status: status as string,
      paymentStatus: paymentStatus as string,
      paymentMethod: paymentMethod as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    if (req.user.role === 'admin') {
      const result = await storage.getAllOrdersWithFilters(params);
      res.json(result);
    } else {
      const userOrders = await storage.getUserOrders(req.user.id);
      res.json({ orders: userOrders, total: userOrders.length });
    }
  }));

  app.get("/api/orders/:id", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    const order = await storage.getOrder(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the order or is admin
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const orderItems = await storage.getOrderItems(order.id);
    const user = await storage.getUser(order.userId);
    res.json({ ...order, items: orderItems, user });
  }));

  // Get order items (separate endpoint for admin panel)
  app.get("/api/orders/:id/items", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await storage.getOrder(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the order or is admin
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const orderItems = await storage.getOrderItems(order.id);
    res.json(orderItems);
  }));

  // Order calculation endpoint - used by cart and checkout pages
  app.post("/api/order/calculate", requireAuth, asyncHandler(async (req, res) => {
    const { couponCode } = z.object({
      couponCode: z.string().optional()
    }).parse(req.body);

    // Get user's cart items
    const cartItems = await storage.getCartItems(req.user.id);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    try {
      const { orderCalculator } = await import('./order-calculator');
      const calculation = await orderCalculator.calculateOrder(cartItems, couponCode);
      res.json(calculation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }));

  // Server-side checkout calculation endpoint for security (legacy compatibility)
  app.post("/api/checkout/calculate", requireAuth, asyncHandler(async (req, res) => {
    const { couponCode, cartItems } = z.object({
      couponCode: z.string().optional(),
      cartItems: z.array(z.object({
        productId: z.number(),
        quantity: z.number()
      })).optional()
    }).parse(req.body);

    // Get current cart items if not provided
    const items = cartItems || await storage.getCartItems(req.user.id);

    if (items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Server-side price calculation for security
    let subtotalAmount = 0;
    const calculatedItems = [];

    // Validate cart items and calculate prices server-side
    for (const cartItem of items) {
      const product = await storage.getProduct(cartItem.productId);
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${cartItem.productId} not found` });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }

      // Use current product price, prioritize sale price if available
      const itemPrice = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price);
      const itemTotal = itemPrice * cartItem.quantity;
      subtotalAmount += itemTotal;

      calculatedItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: itemPrice,
        total: itemTotal,
        product: {
          name: product.name,
          slug: product.slug,
          images: product.images
        }
      });
    }

    // Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await storage.getCouponByCode(couponCode);

      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ message: "Coupon is no longer active" });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Coupon has expired" });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      if (coupon.minimumAmount && subtotalAmount < parseFloat(coupon.minimumAmount)) {
        return res.status(400).json({ 
          message: `Minimum order amount of PKR ${coupon.minimumAmount} required for this coupon` 
        });
      }

      // Calculate discount based on coupon type
      if (coupon.discountType === "percentage") {
        discountAmount = (subtotalAmount * parseFloat(coupon.discountValue)) / 100;
        discountAmount = Math.min(discountAmount, subtotalAmount);
      } else if (coupon.discountType === "fixed") {
        // For fixed amount coupons, check if there's enough value left
        const currentCouponValue = parseFloat(coupon.discountValue);
        if (currentCouponValue <= 0) {
          return res.status(400).json({ message: "Coupon has no remaining value" });
        }

        // For fixed coupons: apply coupon value, but never exceed the subtotal
        discountAmount = Math.min(currentCouponValue, subtotalAmount);

        console.log(`Checkout Fixed Coupon Calculation: Coupon Value: ${currentCouponValue}, Subtotal: ${subtotalAmount}, Applied Discount: ${discountAmount}`);
      }

      appliedCoupon = {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
        applyToShipping: coupon.applyToShipping,
        applyToTax: coupon.applyToTax
      };
    }

    // Get system settings for dynamic calculations
    const taxSetting = await storage.getSystemSetting('tax_rate');
    const shippingSetting = await storage.getSystemSetting('shipping_cost');
    const freeShippingThreshold = await storage.getSystemSetting('free_shipping_threshold');

    const taxRate = taxSetting ? parseFloat(taxSetting.value) / 100 : 0.05; // Default 5%
    const baseShippingCost = shippingSetting ? parseFloat(shippingSetting.value) : 150; // Default PKR 150
    const freeShippingMin = freeShippingThreshold ? parseFloat(freeShippingThreshold.value) : 2000; // Default PKR 2000

    // Calculate shipping and tax with coupon applications
    const discountedSubtotal = subtotalAmount - discountAmount;
    let shippingAmount = discountedSubtotal >= freeShippingMin ? 0 : baseShippingCost;
    let taxAmount = discountedSubtotal * taxRate;
    let shippingDiscount = 0;
    let taxDiscount = 0;

    // Apply coupon to shipping if enabled
    if (appliedCoupon && appliedCoupon.applyToShipping && shippingAmount > 0) {
      if (appliedCoupon.discountType === "percentage") {
        shippingDiscount = (shippingAmount * parseFloat(appliedCoupon.discountValue)) / 100;
      } else if (appliedCoupon.discountType === "fixed") {
        const remainingCouponValue = parseFloat(appliedCoupon.discountValue) - discountAmount;
        if (remainingCouponValue > 0) {
          shippingDiscount = Math.min(remainingCouponValue, shippingAmount);
        }
      }
      shippingAmount = Math.max(0, shippingAmount - shippingDiscount);
    }

    // Apply coupon to tax if enabled
    if (appliedCoupon && appliedCoupon.applyToTax && taxAmount > 0) {
      if (appliedCoupon.discountType === "percentage") {
        taxDiscount = (taxAmount * parseFloat(appliedCoupon.discountValue)) / 100;
      } else if (appliedCoupon.discountType === "fixed") {
        const remainingCouponValue = parseFloat(appliedCoupon.discountValue) - discountAmount - shippingDiscount;
        if (remainingCouponValue > 0) {
          taxDiscount = Math.min(remainingCouponValue, taxAmount);
        }
      }
      taxAmount = Math.max(0, taxAmount - taxDiscount);
    }

    const totalAmount = discountedSubtotal + shippingAmount + taxAmount;

    res.json({
      items: calculatedItems,
      subtotal: parseFloat(subtotalAmount.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      shipping: parseFloat(shippingAmount.toFixed(2)),
      tax: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(totalAmount.toFixed(2)),
      coupon: appliedCoupon,
      freeShippingThreshold: freeShippingMin,
      remainingForFreeShipping: Math.max(0, freeShippingMin - discountedSubtotal)
    });
  }));

  app.post("/api/orders", requireAuth, ...routeEncryption.orders, asyncHandler(async (req, res) => {
    const orderData = z.object({
      paymentMethod: z.string().min(1),
      shippingAddress: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().default("Pakistan")
      }),
      notes: z.string().optional(),
      couponCode: z.string().optional(),
      paymentProof: z.string().optional()
    }).parse(req.body);

    // Get user's cart items
    const cartItems = await storage.getCartItems(req.user.id);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    try {
      const { orderCalculator } = await import('./order-calculator');
      const result = await orderCalculator.processOrder(
        req.user.id,
        cartItems,
        orderData,
        orderData.couponCode
      );

      // Broadcast real-time event
      // Cache invalidation for HTTP-only approach
      
      res.status(201).json({ 
        order: result.order, 
        calculation: result.calculation,
        message: "Order created successfully"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }));

  // Upload payment proof
  app.post("/api/orders/:id/upload-proof", requireAuth, ...routeEncryption.payments, paymentUpload.single('paymentProof'), asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);

    if (!req.file) {
      return res.status(400).json({ message: "Payment proof file is required" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update order with payment proof
    const updatedOrder = await storage.updateOrder(orderId, {
      paymentProof: `/uploads/payments/${req.file.filename}`,
      paymentStatus: 'awaiting_confirmation',
      status: 'awaiting_confirmation'
    });

    res.json({ 
      message: "Payment proof uploaded successfully. Waiting for admin approval.",
      order: updatedOrder 
    });
  }));

  // Admin approve payment
  app.put("/api/admin/orders/:id/approve", requireAdmin, ...routeEncryption.admin, asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { adminNotes } = req.body;

    const updatedOrder = await storage.updateOrder(orderId, {
      paymentStatus: 'approved',
      status: 'pending',
      adminNotes
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Broadcast real-time event
    // Cache invalidation for HTTP-only approach
    
    res.json({ message: "Payment approved successfully", order: updatedOrder });
  }));

  // Admin reject payment
  app.put("/api/admin/orders/:id/reject", requireAdmin, asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { rejectionReason, adminNotes } = req.body;

    const updatedOrder = await storage.updateOrder(orderId, {
      paymentStatus: 'rejected',
      status: 'cancelled',
      rejectionReason,
      adminNotes
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Broadcast real-time event
    // Cache invalidation for HTTP-only approach
    
    res.json({ message: "Payment rejected", order: updatedOrder });
  }));

  // Get orders awaiting confirmation
  app.get("/api/admin/orders/awaiting-confirmation", requireAdmin, asyncHandler(async (req, res) => {
    const orders = await storage.getOrdersByStatus('awaiting_confirmation');
    res.json(orders);
  }));

  app.put("/api/orders/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const order = await storage.updateOrder(id, updates);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Broadcast real-time event
    // Cache invalidation for HTTP-only approach

    res.json(order);
  }));

  app.delete("/api/orders/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteOrder(id);

    if (!success) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(204).send();
  }));

  // User addresses management
  app.get("/api/addresses", requireAuth, asyncHandler(async (req, res) => {
    const addresses = await storage.getUserAddresses(req.user.id);
    res.json(addresses);
  }));

  app.post("/api/addresses", requireAuth, asyncHandler(async (req, res) => {
    const addressData = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
      phone: z.string().min(1),
      isDefault: z.boolean().default(false)
    }).parse(req.body);

    const address = await storage.createAddress({
      ...addressData,
      userId: req.user.id
    });

    res.status(201).json(address);
  }));

  app.put("/api/addresses/:id", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      address: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
      isDefault: z.boolean().optional()
    }).parse(req.body);

    // Security: Check if address belongs to the user
    const userAddresses = await storage.getUserAddresses(req.user.id);
    const userAddress = userAddresses.find(addr => addr.id === id);

    if (!userAddress) {
      return res.status(404).json({ message: "Address not found or access denied" });
    }

    const address = await storage.updateAddress(id, updates);
    res.json(address);
  }));

  app.delete("/api/addresses/:id", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    // Security: Check if address belongs to the user
    const userAddresses = await storage.getUserAddresses(req.user.id);
    const userAddress = userAddresses.find(addr => addr.id === id);

    if (!userAddress) {
      return res.status(404).json({ message: "Address not found or access denied" });
    }

    const success = await storage.deleteAddress(id);

    if (!success) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(204).send();
  }));

  // Admin user management routes with pagination, filtering, and search
  app.get("/api/users", requireAdmin, ...routeEncryption.admin, asyncHandler(async (req, res) => {
    const {
      search,
      role,
      status,
      limit = "20",
      offset = "0",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const params = {
      search: search as string,
      role: role as string,
      status: status as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await storage.getAllUsersWithFilters(params);
    res.json(result);
  }));

  app.put("/api/users/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;

    const user = await storage.updateUserStatus(id, isActive);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  }));

  // New PATCH endpoint for comprehensive user updates including role changes
  app.patch("/api/users/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const user = await storage.updateUser(id, updates);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  }));

  // Create new user (admin only)
  app.post("/api/users", requireAdmin, asyncHandler(async (req, res) => {
    const userData = z.object({
      username: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: z.enum(['user', 'admin']).default('user'),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    // Check if username already exists
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if email already exists
    const existingUserByEmail = await storage.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });

    if (!user) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    // Remove password from response
    const { password, ...userResponse } = user;
    res.status(201).json(userResponse);
  }));

  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    // Prevent deleting self
    if (req.user.id === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const success = await storage.deleteUser(id);

    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(204).send();
  }));

  // Admin coupon management routes with filtering
  app.get("/api/admin/coupons", requireAdmin, asyncHandler(async (req, res) => {
    const {
      search,
      status,
      discountType,
      limit = "20",
      offset = "0",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const params = {
      search: search as string,
      status: status as string,
      discountType: discountType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await storage.getAllCouponsWithFilters(params);
    res.json(result);
  }));

  app.post("/api/admin/coupons", requireAdmin, ...routeEncryption.admin, asyncHandler(async (req, res) => {
    const couponData = z.object({
      code: z.string().min(1),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.string(),
      description: z.string().optional(),
      minimumAmount: z.string().optional(),
      usageLimit: z.number().int().optional(),
      expiresAt: z.string().optional(),
      applyToShipping: z.boolean().default(false),
      applyToTax: z.boolean().default(false),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    // Convert string date to Date object if provided
    const processedData = {
      ...couponData,
      expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : undefined,
    };

    const coupon = await storage.createCoupon(processedData);
    res.status(201).json(coupon);
  }));

  app.put("/api/admin/coupons/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      code: z.string().min(1).optional(),
      discountType: z.enum(['percentage', 'fixed']).optional(),
      discountValue: z.string().optional(),
      description: z.string().optional(),
      minimumAmount: z.string().optional(),
      usageLimit: z.number().int().optional(),
      expiresAt: z.string().optional(),
      applyToShipping: z.boolean().optional(),
      applyToTax: z.boolean().optional(),
      isActive: z.boolean().optional()
    }).parse(req.body);

    // Process updates
    const processedUpdates = {
      ...updates,
      code: updates.code ? updates.code.toUpperCase() : undefined,
      expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : undefined,
    };

    const coupon = await storage.updateCoupon(id, processedUpdates);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  }));

  app.delete("/api/admin/coupons/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteCoupon(id);

    if (!success) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(204).send();
  }));

  // Validate coupon - requires authentication to prevent abuse
  app.post("/api/coupons/validate", requireAuth, asyncHandler(async (req, res) => {
    const { code, amount } = z.object({
      code: z.string().min(1),
      amount: z.number().min(0)
    }).parse(req.body);

    const coupon = await storage.getCouponByCode(code);

    if (!coupon) {
      return res.json({ valid: false, message: "Coupon not found" });
    }

    if (!coupon.isActive) {
      return res.json({ valid: false, message: "Coupon is not active" });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.json({ valid: false, message: "Coupon has expired" });
    }

    if (coupon.minimumAmount && parseFloat(coupon.minimumAmount) > amount) {
      return res.json({ valid: false, message: `Minimum order amount is $${coupon.minimumAmount}` });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ valid: false, message: "Coupon usage limit reached" });
    }

    // Only return necessary fields, not sensitive internal data
    res.json({ 
      valid: true, 
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description
      }
    });
  }));

  // Payment proof upload
  app.post("/api/orders/:id/upload-proof", requireAuth, upload.single('paymentProof'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const order = await storage.getOrder(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Update order with payment proof
    const updatedOrder = await storage.updateOrder(id, {
      paymentProof: req.file.filename,
      paymentStatus: 'pending'
    });

    res.json(updatedOrder);
  }));

  // Reorder endpoint
  app.post("/api/orders/:id/reorder", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const originalOrder = await storage.getOrder(id);

    if (!originalOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (originalOrder.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get original order items
    const orderItems = await storage.getOrderItems(originalOrder.id);
    
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Original order has no items" });
    }

    // Check product availability and current prices
    const cartItems = [];
    for (const item of orderItems) {
      const product = await storage.getProduct(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} is no longer available` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      cartItems.push({
        productId: item.productId,
        quantity: item.quantity,
        product: product
      });
    }

    // Create new order with current prices
    const orderData = {
      paymentMethod: originalOrder.paymentMethod,
      shippingAddress: originalOrder.shippingAddress,
      notes: 'Reordered from order #' + originalOrder.orderNumber,
      couponCode: null // Don't apply original coupon for reorders
    };

    try {
      const { orderCalculator } = await import('./order-calculator');
      const result = await orderCalculator.processOrder(
        req.user.id,
        cartItems,
        orderData,
        null
      );

      res.status(201).json({ 
        order: result.order, 
        calculation: result.calculation,
        message: "Order placed successfully"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }));

  // Payment screenshot upload (legacy support)
  app.post("/api/orders/:id/payment-screenshot", requireAuth, upload.single('screenshot'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const order = await storage.getOrder(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Update order with screenshot path
    const updatedOrder = await storage.updateOrder(id, {
      paymentProof: req.file.filename,
      paymentStatus: 'pending'
    });

    res.json(updatedOrder);
  }));

  // Analytics (Admin only)
  app.get("/api/analytics", requireAdmin, asyncHandler(async (req, res) => {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  }));

  // Reviews
  app.get("/api/products/:id/reviews", asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    const reviews = await storage.getProductReviews(productId);
    res.json({ success: true, data: reviews });
  }));

  app.post("/api/products/:id/reviews", requireAuth, asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    const reviewData = z.object({
      rating: z.number().int().min(1).max(5),
      title: z.string().optional(),
      comment: z.string().optional()
    }).parse(req.body);

    const review = await storage.createReview({
      userId: req.user.id,
      productId,
      ...reviewData
    });

    res.status(201).json(review);
  }));

  // Admin coupon routes (secure)
  app.get("/api/coupons", requireAdmin, asyncHandler(async (req, res) => {
    const coupons = await storage.getAllCoupons();
    res.json(coupons);
  }));

  app.post("/api/coupons", requireAdmin, asyncHandler(async (req, res) => {
    const couponData = z.object({
      code: z.string().min(1).max(50),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.string().min(1),
      description: z.string().max(200).optional(),
      minimumAmount: z.string().optional(),
      usageLimit: z.number().int().min(1).optional(),
      expiresAt: z.string().optional(),
      applyToShipping: z.boolean().default(false),
      applyToTax: z.boolean().default(false),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    // Convert string date to Date object if provided
    const processedData = {
      ...couponData,
      code: couponData.code.toUpperCase(),
      expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : undefined,
    };

    const coupon = await storage.createCoupon(processedData);
    res.status(201).json(coupon);
  }));

  app.put("/api/coupons/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      code: z.string().min(1).max(50).optional(),
      discountType: z.enum(['percentage', 'fixed']).optional(),
      discountValue: z.string().min(1).optional(),
      description: z.string().max(200).optional(),
      minimumAmount: z.string().optional(),
      usageLimit: z.number().int().min(1).optional(),
      expiresAt: z.string().optional(),
      applyToShipping: z.boolean().optional(),
      applyToTax: z.boolean().optional(),
      isActive: z.boolean().optional()
    }).parse(req.body);

    // Process updates
    const processedUpdates = {
      ...updates,
      code: updates.code ? updates.code.toUpperCase() : undefined,
      expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : undefined,
    };

    const coupon = await storage.updateCoupon(id, processedUpdates);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  }));

  app.patch("/api/coupons/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      code: z.string().min(1).max(50).optional(),
      discountType: z.enum(['percentage', 'fixed']).optional(),
      discountValue: z.string().min(1).optional(),
      description: z.string().max(200).optional(),
      minimumAmount: z.string().optional(),
      usageLimit: z.number().int().min(1).optional(),
      expiresAt: z.string().optional(),
      applyToShipping: z.boolean().optional(),
      applyToTax: z.boolean().optional(),
      isActive: z.boolean().optional()
    }).parse(req.body);

    // Process updates
    const processedUpdates = {
      ...updates,
      code: updates.code ? updates.code.toUpperCase() : undefined,
      expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : undefined,
    };

    const coupon = await storage.updateCoupon(id, processedUpdates);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  }));

  app.delete("/api/coupons/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteCoupon(id);

    if (!success) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(204).send();
  }));

  // Admin Analytics - both routes for compatibility
  app.get("/api/analytics", requireAdmin, asyncHandler(async (req, res) => {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  }));

  app.get("/api/admin/analytics", requireAdmin, asyncHandler(async (req, res) => {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  }));

  // Search suggestions API endpoint
  app.get("/api/search/suggestions", asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json([]);
    }

    try {
      // Get search management settings
      const searchSettings = await storage.getSearchSettings();

      // Search for products based on admin search settings
      const [productsResult, allCategories] = await Promise.all([
        storage.getProductsForSearch(q, searchSettings),
        storage.getAllCategories()
      ]);

      // Filter categories by search term
      const filteredCategories = allCategories
        .filter(category => category.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 3);

      const suggestions = [
        ...filteredCategories.map((category: any) => ({
          id: category.id,
          name: category.name,
          type: 'category',
          slug: category.slug
        })),
        ...(productsResult.products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          type: 'product',
          price: product.price,
          slug: product.slug,
          category: product.category?.name,
          image: product.imageUrl || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null)
        }))
      ];

      res.json(suggestions);
    } catch (error) {
      console.error('Search suggestions error:', error);
      res.json([]);
    }
  }));

  // Banners - public route for active banners
  app.get("/api/banners", asyncHandler(async (req, res) => {
    const banners = await storage.getActiveBanners();
    res.json(banners);
  }));

  app.get("/api/banners/active", asyncHandler(async (req, res) => {
    const banners = await storage.getActiveBanners();
    res.json(banners);
  }));

  app.get("/api/admin/banners", requireAdmin, asyncHandler(async (req, res) => {
    const banners = await storage.getAllBanners();
    res.json(banners);
  }));

  app.post("/api/admin/banners", requireAdmin, asyncHandler(async (req, res) => {
    const bannerData = z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      image: z.string().min(1),
      linkText: z.string().optional(),
      linkUrl: z.string().optional(),
      position: z.number().int().default(0),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    const banner = await storage.createBanner(bannerData);
    res.status(201).json(banner);
  }));

  app.put("/api/admin/banners/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const banner = await storage.updateBanner(id, updates);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.json(banner);
  }));

  app.delete("/api/admin/banners/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteBanner(id);

    if (!success) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(204).send();
  }));

  // Payment Settings - public access for checkout, admin access for management
  app.get("/api/payment-settings", asyncHandler(async (req, res) => {
    // Return all settings for admin, only active for non-admin
    if (req.isAuthenticated() && req.user.role === 'admin') {
      const allSettings = await storage.getAllPaymentSettings();
      res.json(allSettings);
    } else {
      const activeSettings = await storage.getPaymentSettings();
      res.json(activeSettings);
    }
  }));

  app.post("/api/payment-settings", requireAdmin, asyncHandler(async (req, res) => {
    const settingData = z.object({
      provider: z.string().min(1).max(50),
      accountNumber: z.string().max(100),
      accountName: z.string().max(100),
      instructions: z.string().max(500).optional(),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    const setting = await storage.createPaymentSetting(settingData);
    res.status(201).json(setting);
  }));

  app.put("/api/payment-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      provider: z.string().min(1).max(50).optional(),
      accountNumber: z.string().max(100).optional(),
      accountName: z.string().max(100).optional(),
      instructions: z.string().max(500).optional(),
      isActive: z.boolean().optional()
    }).parse(req.body);

    const setting = await storage.updatePaymentSetting(id, updates);

    if (!setting) {
      return res.status(404).json({ message: "Payment setting not found" });
    }

    res.json(setting);
  }));

  app.patch("/api/payment-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      provider: z.string().min(1).max(50).optional(),
      accountNumber: z.string().max(100).optional(),
      accountName: z.string().max(100).optional(),
      instructions: z.string().max(500).optional(),
      isActive: z.boolean().optional()
    }).parse(req.body);

    const setting = await storage.updatePaymentSetting(id, updates);

    if (!setting) {
      return res.status(404).json({ message: "Payment setting not found" });
    }

    res.json(setting);
  }));

  app.delete("/api/payment-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deletePaymentSetting(id);

    if (!success) {
      return res.status(404).json({ message: "Payment setting not found" });
    }

    res.status(204).send();
  }));

  app.get("/api/admin/payment-settings", requireAdmin, asyncHandler(async (req, res) => {
    const settings = await storage.getAllPaymentSettings();
    res.json(settings);
  }));

  app.post("/api/admin/payment-settings", requireAdmin, asyncHandler(async (req, res) => {
    const settingData = z.object({
      provider: z.string().min(1),
      accountNumber: z.string().min(1),
      accountName: z.string().min(1),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    const setting = await storage.createPaymentSetting(settingData);
    res.status(201).json(setting);
  }));

  app.put("/api/admin/payment-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const setting = await storage.updatePaymentSetting(id, updates);

    if (!setting) {
      return res.status(404).json({ message: "Payment setting not found" });
    }

    res.json(setting);
  }));

  app.delete("/api/admin/payment-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deletePaymentSetting(id);

    if (!success) {
      return res.status(404).json({ message: "Payment setting not found" });
    }

    res.status(204).send();
  }));

  // Flash Sales - public route for active sales
  app.get("/api/flash-sales", asyncHandler(async (req, res) => {
    const flashSales = await storage.getActiveFlashSales();
    res.json(flashSales);
  }));

  app.get("/api/flash-sales/active", asyncHandler(async (req, res) => {
    const flashSales = await storage.getActiveFlashSales();
    res.json(flashSales);
  }));

  // Get flash sale data for a specific product
  app.get("/api/products/:productId/flash-sale", asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const flashSales = await storage.getActiveFlashSales();
    const productFlashSale = flashSales.find(sale => 
      sale.productId === productId || sale.product?.id === productId
    );

    if (!productFlashSale) {
      return res.status(404).json({ message: "No active flash sale found for this product" });
    }

    res.json(productFlashSale);
  }));

  app.get("/api/admin/flash-sales", requireAdmin, asyncHandler(async (req, res) => {
    const flashSales = await storage.getAllFlashSales();
    res.json(flashSales);
  }));

  app.post("/api/admin/flash-sales", requireAdmin, asyncHandler(async (req, res) => {
    const flashSaleData = z.object({
      productId: z.number().int(),
      discountPercentage: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    const flashSale = await storage.createFlashSale(flashSaleData);
    res.status(201).json(flashSale);
  }));

  app.put("/api/admin/flash-sales/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const flashSale = await storage.updateFlashSale(id, updates);

    if (!flashSale) {
      return res.status(404).json({ message: "Flash sale not found" });
    }

    res.json(flashSale);
  }));

  app.delete("/api/admin/flash-sales/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteFlashSale(id);

    if (!success) {
      return res.status(404).json({ message: "Flash sale not found" });
    }

    res.status(204).send();
  }));

  // Notifications
  app.get("/api/notifications", requireAuth, asyncHandler(async (req, res) => {
    const notifications = await storage.getUserNotifications(req.user.id);
    res.json(notifications);
  }));

  app.post("/api/notifications", requireAuth, asyncHandler(async (req, res) => {
    const notificationData = z.object({
      userId: z.number().int(),
      title: z.string().min(1),
      message: z.string().min(1),
      type: z.string().min(1),
      relatedOrderId: z.number().int().optional()
    }).parse(req.body);

    // Security: Users can only create notifications for themselves, admins can create for anyone
    if (req.user.role !== 'admin' && notificationData.userId !== req.user.id) {
      return res.status(403).json({ message: "Cannot create notifications for other users" });
    }

    const notification = await storage.createNotification(notificationData);
    res.status(201).json(notification);
  }));

  app.put("/api/notifications/:id/read", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    // Security: Check if notification belongs to the user before marking as read
    const notifications = await storage.getUserNotifications(req.user.id);
    const userNotification = notifications.find(n => n.id === id);

    if (!userNotification) {
      return res.status(404).json({ message: "Notification not found or access denied" });
    }

    const notification = await storage.markNotificationAsRead(id);
    res.json(notification);
  }));

  app.put("/api/notifications/read-all", requireAuth, asyncHandler(async (req, res) => {
    const success = await storage.markAllNotificationsAsRead(req.user.id);
    res.json({ success });
  }));

  app.delete("/api/notifications/:id", requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    // Security: Check if notification belongs to the user before deleting
    const notifications = await storage.getUserNotifications(req.user.id);
    const userNotification = notifications.find(n => n.id === id);

    if (!userNotification) {
      return res.status(404).json({ message: "Notification not found or access denied" });
    }

    const success = await storage.deleteNotification(id);

    if (!success) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(204).send();
  }));

  // Admin review moderation
  app.get("/api/admin/reviews", requireAdmin, asyncHandler(async (req, res) => {
    // Get all reviews with product and user info
    const {
      search = "",
      status = "all",
      rating = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = "20",
      offset = "0",
    } = req.query;

    const params = {
      search: search as string,
      status: status as string,
      rating: rating as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const reviews = await storage.getAllReviewsWithFilters(params);
    res.json(reviews);
  }));

  app.put("/api/admin/reviews/:id/approve", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const review = await storage.updateReview(id, { isApproved: true });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  }));

  app.put("/api/admin/reviews/:id/reject", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const review = await storage.updateReview(id, { isApproved: false });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  }));

  app.delete("/api/admin/reviews/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteReview(id);

    if (!success) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(204).send();
  }));

  // Database export endpoint (admin only)
  app.get("/api/admin/export-database", requireAdmin, asyncHandler(async (req, res) => {
    try {
      // Export all data from all tables
      const [
        usersData,
        categoriesData,
        productsData,
        cartItemsData,
        wishlistItemsData,
        ordersData,
        orderItemsData,
        reviewsData,
        addressesData,
        couponsData,
        paymentSettingsData,
        systemSettingsData,
        flashSalesData,
        bannersData,
        notificationsData
      ] = await Promise.all([
        storage.getAllUsersForExport(),
        storage.getAllCategoriesForExport(),
        storage.getAllProductsForExport(),
        storage.getAllCartItemsForExport(),
        storage.getAllWishlistItemsForExport(),
        storage.getAllOrdersForExport(),
        storage.getAllOrderItemsForExport(),
        storage.getAllReviewsForExport(),
        storage.getAllAddressesForExport(),
        storage.getAllCouponsForExport(),
        storage.getAllPaymentSettingsForExport(),
        storage.getAllSystemSettingsForExport(),
        storage.getAllFlashSalesForExport(),
        storage.getAllBannersForExport(),
        storage.getAllNotificationsForExport()
      ]);

      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        data: {
          users: usersData,
          categories: categoriesData,
          products: productsData,
          cartItems: cartItemsData,
          wishlistItems: wishlistItemsData,
          orders: ordersData,
          orderItems: orderItemsData,
          reviews: reviewsData,
          addresses: addressesData,
          coupons: couponsData,
          paymentSettings: paymentSettingsData,
          systemSettings: systemSettingsData,
          flashSales: flashSalesData,
          banners: bannersData,
          notifications: notificationsData
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="database-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error('Database export error:', error);
      res.status(500).json({ message: 'Failed to export database' });
    }
  }));

  // Database import endpoint (admin only)
  app.post("/api/admin/import-database", requireAdmin, asyncHandler(async (req, res) => {
    try {
      const { data, clearExisting = false } = req.body;

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ message: 'Invalid import data format' });
      }

      if (!data.data || typeof data.data !== 'object') {
        return res.status(400).json({ message: 'Invalid import data structure - missing data property' });
      }

      // If clearExisting is true, clear all data first
      if (clearExisting) {
        console.log('Clearing existing data...');
        await storage.clearAllData();
      }

      // Import data in the correct order to respect foreign key constraints
      const importResults = {};
      console.log('Starting database import...');

      try {
        // Import in dependency order with error handling for each table
        
        if (data.data.users && Array.isArray(data.data.users) && data.data.users.length > 0) {
          console.log(`Importing ${data.data.users.length} users...`);
          importResults.users = await storage.importUsers(data.data.users);
        }

        if (data.data.categories && Array.isArray(data.data.categories) && data.data.categories.length > 0) {
          console.log(`Importing ${data.data.categories.length} categories...`);
          importResults.categories = await storage.importCategories(data.data.categories);
        }

        if (data.data.products && Array.isArray(data.data.products) && data.data.products.length > 0) {
          console.log(`Importing ${data.data.products.length} products...`);
          importResults.products = await storage.importProducts(data.data.products);
        }

        if (data.data.coupons && Array.isArray(data.data.coupons) && data.data.coupons.length > 0) {
          console.log(`Importing ${data.data.coupons.length} coupons...`);
          importResults.coupons = await storage.importCoupons(data.data.coupons);
        }

        if (data.data.orders && Array.isArray(data.data.orders) && data.data.orders.length > 0) {
          console.log(`Importing ${data.data.orders.length} orders...`);
          importResults.orders = await storage.importOrders(data.data.orders);
        }

        if (data.data.orderItems && Array.isArray(data.data.orderItems) && data.data.orderItems.length > 0) {
          console.log(`Importing ${data.data.orderItems.length} order items...`);
          importResults.orderItems = await storage.importOrderItems(data.data.orderItems);
        }

        if (data.data.cartItems && Array.isArray(data.data.cartItems) && data.data.cartItems.length > 0) {
          console.log(`Importing ${data.data.cartItems.length} cart items...`);
          importResults.cartItems = await storage.importCartItems(data.data.cartItems);
        }

        if (data.data.wishlistItems && Array.isArray(data.data.wishlistItems) && data.data.wishlistItems.length > 0) {
          console.log(`Importing ${data.data.wishlistItems.length} wishlist items...`);
          importResults.wishlistItems = await storage.importWishlistItems(data.data.wishlistItems);
        }

        if (data.data.reviews && Array.isArray(data.data.reviews) && data.data.reviews.length > 0) {
          console.log(`Importing ${data.data.reviews.length} reviews...`);
          importResults.reviews = await storage.importReviews(data.data.reviews);
        }

        if (data.data.addresses && Array.isArray(data.data.addresses) && data.data.addresses.length > 0) {
          console.log(`Importing ${data.data.addresses.length} addresses...`);
          importResults.addresses = await storage.importAddresses(data.data.addresses);
        }

        if (data.data.paymentSettings && Array.isArray(data.data.paymentSettings) && data.data.paymentSettings.length > 0) {
          console.log(`Importing ${data.data.paymentSettings.length} payment settings...`);
          importResults.paymentSettings = await storage.importPaymentSettings(data.data.paymentSettings);
        }

        if (data.data.systemSettings && Array.isArray(data.data.systemSettings) && data.data.systemSettings.length > 0) {
          console.log(`Importing ${data.data.systemSettings.length} system settings...`);
          importResults.systemSettings = await storage.importSystemSettings(data.data.systemSettings);
        }

        if (data.data.flashSales && Array.isArray(data.data.flashSales) && data.data.flashSales.length > 0) {
          console.log(`Importing ${data.data.flashSales.length} flash sales...`);
          importResults.flashSales = await storage.importFlashSales(data.data.flashSales);
        }

        if (data.data.banners && Array.isArray(data.data.banners) && data.data.banners.length > 0) {
          console.log(`Importing ${data.data.banners.length} banners...`);
          importResults.banners = await storage.importBanners(data.data.banners);
        }

        if (data.data.notifications && Array.isArray(data.data.notifications) && data.data.notifications.length > 0) {
          console.log(`Importing ${data.data.notifications.length} notifications...`);
          importResults.notifications = await storage.importNotifications(data.data.notifications);
        }

        console.log('Database import completed successfully');
        res.json({
          message: 'Database imported successfully',
          results: importResults,
          importDate: new Date().toISOString()
        });

      } catch (importError) {
        console.error('Error during import process:', importError);
        throw importError;
      }

    } catch (error) {
      console.error('Database import error:', error);
      res.status(500).json({ 
        message: 'Failed to import database', 
        error: error.message || 'Unknown error occurred'
      });
    }
  }));

  // Database delete endpoint (admin only) - Clear all database data
  app.delete("/api/admin/delete-database", requireAdmin, asyncHandler(async (req, res) => {
    try {
      // Clear all data from all tables
      await storage.clearAllData();

      res.json({
        message: 'Database deleted successfully',
        deletedDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database delete error:', error);
      res.status(500).json({ 
        message: 'Failed to delete database', 
        error: error.message 
      });
    }
  }));

  // Serve payment proof files (admin only)
  app.get('/uploads/payments/:filename', requireAdmin, (req: any, res: any) => {
    const filename = req.params.filename;
    const filePath = path.join(paymentsDir, filename);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'Payment proof not found' });
    }
  });

  // General file upload endpoint for admin
  app.post("/api/upload", requireAdmin, upload.array('files', 10), asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const files = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
    res.json({ files });
  }));

  // Serve uploaded files
  app.use('/uploads', (req: any, res: any, next: any) => {
    // Skip payment proofs as they are handled separately
    if (req.path.startsWith('/payments/')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // System Settings - Admin only routes for managing tax, shipping, etc.
  app.get("/api/system-settings", requireAdmin, asyncHandler(async (req, res) => {
    const settings = await storage.getSystemSettings();
    // Filter out encryption-related settings as they're managed by the encryption control panel
    const filteredSettings = settings.filter(setting => 
      !setting.key.startsWith('encryption_')
    );
    res.json(filteredSettings);
  }));

  app.get("/api/system-settings/public", asyncHandler(async (req, res) => {
    // Public endpoint for cart/checkout to get current rates
    const settings = await storage.getSystemSettings();
    const publicSettings = settings.filter(s => s.isActive).reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        type: setting.type,
        label: setting.label
      };
      return acc;
    }, {} as Record<string, any>);
    res.json(publicSettings);
  }));

  app.post("/api/system-settings", requireAdmin, asyncHandler(async (req, res) => {
    const settingData = z.object({
      key: z.string().min(1).max(50),
      value: z.string().min(1),
      type: z.enum(['string', 'number', 'boolean']).default('string'),
      label: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    const setting = await storage.createSystemSetting(settingData);
    res.status(201).json(setting);
  }));

  app.put("/api/system-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      key: z.string().min(1).max(50).optional(),
      value: z.string().min(1).optional(),
      type: z.enum(['string', 'number', 'boolean']).optional(),
      label: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      isActive: z.boolean().optional()
    }).parse(req.body);

    const setting = await storage.updateSystemSetting(id, updates);
    if (!setting) {
      return res.status(404).json({ message: "System setting not found" });
    }

    res.json(setting);
  }));

  app.delete("/api/system-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteSystemSetting(id);

    if (!success) {
      return res.status(404).json({ message: "System setting not found" });
    }

    res.json({ message: "System setting deleted successfully" });
  }));

  // Editor Settings routes
  app.get("/api/editor-settings", asyncHandler(async (req, res) => {
    const settings = await storage.getEditorSettings();
    res.json(settings);
  }));

  app.post("/api/editor-settings", requireAdmin, asyncHandler(async (req, res) => {
    const settingData = z.object({
      heroImage: z.string().optional(),
      siteLogo: z.string().optional(),
      favicon: z.string().optional(),
      siteName: z.string().optional(),
      footerEmail: z.string().optional(),
      footerAddress: z.string().optional(),
      footerPhone: z.string().optional(),
      facebookLink: z.string().optional(),
      twitterLink: z.string().optional(),
      instagramLink: z.string().optional(),
      linkedinLink: z.string().optional(),
    }).parse(req.body);

    const settings = await storage.createEditorSettings(settingData);
    res.status(201).json(settings);
  }));

  app.put("/api/editor-settings/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      heroImage: z.string().optional(),
      siteLogo: z.string().optional(),
      favicon: z.string().optional(),
      siteName: z.string().optional(),
      footerEmail: z.string().optional(),
      footerAddress: z.string().optional(),
      footerPhone: z.string().optional(),
      facebookLink: z.string().optional(),
      twitterLink: z.string().optional(),
      instagramLink: z.string().optional(),
      linkedinLink: z.string().optional(),
    }).parse(req.body);

    const settings = await storage.updateEditorSettings(id, updates);

    if (!settings) {
      return res.status(404).json({ message: "Editor settings not found" });
    }

    res.json(settings);
  }));

  // Encryption control endpoints (admin only)
  app.get("/api/admin/encryption-settings", requireAdmin, asyncHandler(async (req, res) => {
    const settings = await getEncryptionSettings();
    res.json(settings);
  }));

  app.put("/api/admin/encryption-settings", requireAdmin, asyncHandler(async (req, res) => {
    const updates = req.body;
    const updatedSettings = await updateEncryptionSettings(updates);
    res.json({
      success: true,
      message: "Encryption settings updated successfully",
      settings: updatedSettings
    });
  }));

  app.get("/api/admin/encryption-stats", requireAdmin, asyncHandler(async (req, res) => {
    const stats = await getEncryptionStats();
    res.json(stats);
  }));

  app.post("/api/admin/test-encryption", requireAdmin, asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const testData = {
      message: "This is a test message for encryption",
      timestamp: new Date().toISOString(),
      data: { test: true, number: 12345 }
    };

    const responseTime = Date.now() - startTime;
    res.json({
      success: true,
      message: "Encryption test completed",
      testData,
      responseTime,
      encrypted: false // This response won't be encrypted since it's a test
    });
  }));



  // Manual rating recalculation endpoint for data maintenance (admin only)
  app.post("/api/admin/recalculate-ratings", requireAdmin, asyncHandler(async (req, res) => {
    console.log('🔧 Manual product rating recalculation triggered by admin');
    try {
      await storage.recalculateAllProductRatings();
      res.json({ 
        success: true, 
        message: 'Product ratings recalculated successfully' 
      });
    } catch (error) {
      console.error('❌ Error in manual rating recalculation:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to recalculate product ratings',
        error: error.message 
      });
    }
  }));

  // Search Management API endpoints
  app.get("/api/search-settings", requireAdmin, asyncHandler(async (req, res) => {
    const searchSettings = await storage.getSearchSettings();
    res.json(searchSettings);
  }));

  app.post("/api/search-settings", requireAdmin, asyncHandler(async (req, res) => {
    const { searchSettings } = req.body;

    // Save each search setting to system_settings table
    const promises = Object.entries(searchSettings).map(async ([key, value]) => {
      const existingSetting = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .limit(1);

      if (existingSetting.length > 0) {
        return db
          .update(systemSettings)
          .set({ value: value.toString(), updatedAt: new Date() })
          .where(eq(systemSettings.key, key));
      } else {
        return db.insert(systemSettings).values({
          key,
          value: value.toString(),
          type: 'search',
          label: `Include ${key.replace('search_include_', '').replace('_', ' ')} Products`,
          description: `Search setting for ${key.replace('search_include_', '')} products`,
          isActive: true
        });
      }
    });

    await Promise.all(promises);
    res.json({ success: true });
  }));

  console.log('🚀 Server initialized successfully - ratings will be calculated on demand');
  return server;
}