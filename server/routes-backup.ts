import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// Enhanced types for authenticated requests
interface AuthenticatedRequest extends express.Request {
  isAuthenticated: () => boolean;
  user?: any;
  login: (user: any, callback: (err: any) => void) => void;
  session?: any;
}

function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Enhanced asyncHandler with proper types
function asyncHandler<T = any>(fn: (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => Promise<T>) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  app.post("/api/auth/register", async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
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
      req.login(user, (err: any) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "User created but login failed" });
        }

        // Remove password from response
        const { password, ...userResponse } = user;
        res.status(201).json(userResponse);
      });
    } catch (error: unknown) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error during registration" });
    }
  });

  // User Profile Management
  app.put("/api/profile", requireAuth, asyncHandler(async (req: any, res: any) => {
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

  app.post("/api/categories", requireAdmin, asyncHandler(async (req, res) => {
    const categoryData = z.object({
      name: z.string().min(1).max(100),
      slug: z.string().max(50).optional(),
      description: z.string().max(500).optional(),
      image: z.string().max(200).optional(),
    }).parse(req.body);

    // Generate slug if not provided
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50);

    const processedData = {
      ...categoryData,
      slug,
    };

    const category = await storage.createCategory(processedData);
    res.status(201).json(category);
  }));

  app.put("/api/categories/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      slug: z.string().max(50).optional(),
      image: z.string().max(200).optional(),
    }).parse(req.body);

    // Update slug if name changed
    if (updates.name && !updates.slug) {
      updates.slug = updates.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);
    }

    const category = await storage.updateCategory(id, updates);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  }));

  app.patch("/api/categories/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      slug: z.string().max(50).optional(),
      image: z.string().max(200).optional(),
    }).parse(req.body);

    // Update slug if name changed
    if (updates.name && !updates.slug) {
      updates.slug = updates.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);
    }

    const category = await storage.updateCategory(id, updates);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  }));

  app.delete("/api/categories/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteCategory(id);

    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(204).send();
  }));

  // Products
  app.get("/api/products", asyncHandler(async (req, res) => {
    const {
      categoryId,
      search,
      featured,
      active,
      brand,
      color,
      priceMin,
      priceMax,
      stock,
      limit = "50",
      offset = "0",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const params = {
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      search: search as string,
      featured: featured === "true",
      active: active !== undefined ? active === "true" : undefined,
      brand: brand as string,
      color: color as string,
      priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
      priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
      stock: stock as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await storage.getAllProducts(params);
    res.json(result);
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
      featured: product.isFeatured || false,
    };

    res.json(formattedProduct);
  }));

  app.post("/api/products", requireAdmin, upload.array('images', 10), asyncHandler(async (req, res) => {
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
      isFeatured: req.body.isFeatured === 'true',
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
      isFeatured: productData.isFeatured,
      isActive: productData.isActive,
      tags: processedTags,
      images: allImages,
      weight: productData.weight,
      dimensions: productData.dimensions,
      material: productData.material,
      brand: productData.brand,
      color: productData.color,
      size: productData.size,
      metaTitle: productData.metaTitle,
      metaDescription: productData.metaDescription,
    };

    const product = await storage.createProduct(processedData);
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
      isFeatured: z.boolean().optional(),
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
      isFeatured: updates.featured !== undefined ? updates.featured : updates.isFeatured,
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

    res.json(product);
  }));

  app.patch("/api/products/:id", requireAdmin, upload.array('images', 10), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Parse form data
    const productData = {
      name: req.body.name || undefined,
      shortDescription: req.body.shortDescription || undefined,
      description: req.body.description || undefined,
      price: req.body.price || undefined,
      originalPrice: req.body.originalPrice || undefined,
      salePrice: req.body.salePrice || undefined,
      discountPercentage: req.body.discountPercentage || undefined,
      categoryId: req.body.categoryId || undefined,
      stock: req.body.stock || undefined,
      sku: req.body.sku || undefined,
      weight: req.body.weight || undefined,
      dimensions: req.body.dimensions || undefined,
      material: req.body.material || undefined,
      brand: req.body.brand || undefined,
      color: req.body.color || undefined,
      size: req.body.size || undefined,
      tags: req.body.tags || undefined,
      isFeatured: req.body.isFeatured === 'true',
      isActive: req.body.isActive !== 'false',
      metaTitle: req.body.metaTitle || undefined,
      metaDescription: req.body.metaDescription || undefined,
    };

    // Process tags
    let processedTags = undefined;
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

    // Build update object with only provided fields
    const updates: any = {};
    
    if (productData.name) updates.name = productData.name;
    if (productData.shortDescription !== undefined) updates.shortDescription = productData.shortDescription;
    if (productData.description !== undefined) updates.description = productData.description;
    if (productData.price) updates.price = productData.price.toString();
    if (productData.originalPrice) updates.originalPrice = productData.originalPrice.toString();
    if (productData.salePrice) updates.salePrice = productData.salePrice.toString();
    if (productData.discountPercentage) updates.discountPercentage = productData.discountPercentage.toString();
    if (productData.sku) updates.sku = productData.sku;
    if (productData.stock) updates.stock = parseInt(productData.stock.toString());
    if (productData.categoryId) updates.categoryId = parseInt(productData.categoryId.toString());
    if (processedTags) updates.tags = processedTags;
    if (allImages.length > 0) updates.images = allImages;
    if (productData.weight !== undefined) updates.weight = productData.weight;
    if (productData.dimensions !== undefined) updates.dimensions = productData.dimensions;
    if (productData.material !== undefined) updates.material = productData.material;
    if (productData.brand !== undefined) updates.brand = productData.brand;
    if (productData.color !== undefined) updates.color = productData.color;
    if (productData.size !== undefined) updates.size = productData.size;
    if (productData.metaTitle !== undefined) updates.metaTitle = productData.metaTitle;
    if (productData.metaDescription !== undefined) updates.metaDescription = productData.metaDescription;
    if (req.body.isFeatured !== undefined) updates.isFeatured = productData.isFeatured;
    if (req.body.isActive !== undefined) updates.isActive = productData.isActive;

    const product = await storage.updateProduct(id, updates);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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
  app.get("/api/orders", requireAuth, asyncHandler(async (req, res) => {
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

  app.post("/api/orders", requireAuth, asyncHandler(async (req, res) => {
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

      res.status(201).json({ 
        order: result.order, 
        calculation: result.calculation,
        message: "Order created successfully"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }));
      
      appliedCoupon = coupon;
    }

    // Get system settings for dynamic calculations
    const taxSetting = await storage.getSystemSetting('tax_rate');
    const shippingSetting = await storage.getSystemSetting('shipping_cost');
    const freeShippingThreshold = await storage.getSystemSetting('free_shipping_threshold');
    
    const taxRate = taxSetting ? parseFloat(taxSetting.value) / 100 : 0.05; // Default 5%
    const baseShippingCost = shippingSetting ? parseFloat(shippingSetting.value) : 120; // Default PKR 120
    const freeShippingMin = freeShippingThreshold ? parseFloat(freeShippingThreshold.value) : 5000; // Default PKR 5000
    
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
        // For fixed coupons, apply remaining value to shipping (after product discount)
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
        // For fixed coupons, apply remaining value to tax (after product and shipping discounts)
        const remainingCouponValue = parseFloat(appliedCoupon.discountValue) - discountAmount - shippingDiscount;
        if (remainingCouponValue > 0) {
          taxDiscount = Math.min(remainingCouponValue, taxAmount);
        }
      }
      taxAmount = Math.max(0, taxAmount - taxDiscount);
    }
    
    const totalAmount = discountedSubtotal + shippingAmount + taxAmount;
    
    // Debug logging for discount calculation
    console.log(`Order Calculation Debug:
      Subtotal: ${subtotalAmount}
      Product Discount: ${discountAmount}
      Shipping Discount: ${shippingDiscount}
      Tax Discount: ${taxDiscount}
      Discounted Subtotal: ${discountedSubtotal}
      Final Shipping: ${shippingAmount}
      Final Tax: ${taxAmount}
      Final Total: ${totalAmount}`);

    // Generate order number
    const orderNumber = `SF-${Date.now()}`;

    // Format shipping address
    const shippingAddressText = `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}
${orderData.shippingAddress.address}
${orderData.shippingAddress.city}, ${orderData.shippingAddress.postalCode}
${orderData.shippingAddress.country}
Phone: ${orderData.shippingAddress.phone}
Email: ${orderData.shippingAddress.email}`;

    // Determine payment and order status based on payment method
    let paymentStatus = 'unpaid';
    let orderStatus = 'pending';

    if (orderData.paymentMethod === 'cod') {
      paymentStatus = 'unpaid'; // Will be paid on delivery
      orderStatus = 'pending';
    } else if (orderData.paymentMethod === 'easypaisa' || orderData.paymentMethod === 'jazzcash') {
      paymentStatus = 'unpaid'; // Waiting for payment proof
      orderStatus = 'pending';
    }

    // Create order with coupon information
    const order = await storage.createOrder({
      orderNumber,
      userId: req.user.id,
      subtotalAmount: subtotalAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      shippingAmount: shippingAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      couponCode: orderData.couponCode || null,
      couponId: appliedCoupon?.id || null,
      paymentMethod: orderData.paymentMethod,
      paymentStatus,
      shippingAddress: shippingAddressText,
      notes: orderData.notes,
      status: orderStatus
    });

    // Create order items with server-calculated prices and update stock
    for (const orderItem of orderItems) {
      await storage.createOrderItem({
        orderId: order.id,
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        price: orderItem.price.toString()
      });
      
      // Update product stock
      await storage.updateProduct(orderItem.productId, {
        stock: orderItem.product.stock - orderItem.quantity
      });
    }

    // Update coupon usage count and deduct amount for fixed coupons
    if (appliedCoupon) {
      // Fetch the latest coupon data again to ensure we have the most current value
      const latestCoupon = await storage.getCoupon(appliedCoupon.id);
      
      if (!latestCoupon) {
        return res.status(400).json({ message: "Coupon no longer exists" });
      }
      
      const updateData: any = {
        usedCount: (latestCoupon.usedCount || 0) + 1
      };
      
      // For fixed amount coupons, deduct the discount amount from remaining value
      if (appliedCoupon.discountType === 'fixed') {
        const currentValue = parseFloat(latestCoupon.discountValue);
        
        // Final validation: ensure the coupon still has enough value
        if (currentValue < discountAmount) {
          return res.status(400).json({ 
            message: "Coupon value changed during processing. Please try again." 
          });
        }
        
        // Calculate the total amount to deduct (products + shipping + tax)
        const totalCouponUsed = discountAmount + (shippingDiscount || 0) + (taxDiscount || 0);
        const actualDiscountUsed = Math.min(totalCouponUsed, currentValue);
        const newValue = Math.max(0, currentValue - actualDiscountUsed);
        
        updateData.discountValue = newValue.toFixed(2);
        
        // If coupon value reaches zero or below, deactivate it
        if (newValue <= 0) {
          updateData.isActive = false;
          updateData.discountValue = "0.00";
        }
        
        // Audit log for coupon usage tracking
        console.log(`Coupon Processing: ${appliedCoupon.code} | Order: ${orderNumber} | Original: PKR ${currentValue} | Used: PKR ${actualDiscountUsed} (Product: ${discountAmount}, Shipping: ${shippingDiscount || 0}, Tax: ${taxDiscount || 0}) | Remaining: PKR ${newValue} | Status: ${newValue <= 0 ? 'DEACTIVATED' : 'ACTIVE'}`);
      }
      
      // Update coupon with the calculated values
      await storage.updateCoupon(appliedCoupon.id, updateData);
    }

    // Clear cart after successful order creation
    await storage.clearCart(req.user.id);

    res.status(201).json({
      ...order,
      calculatedPricing: {
        subtotal: subtotalAmount,
        discount: discountAmount,
        shipping: shippingAmount,
        tax: taxAmount,
        total: totalAmount,
        couponApplied: appliedCoupon ? {
          code: appliedCoupon.code,
          discountType: appliedCoupon.discountType,
          discountValue: appliedCoupon.discountValue,
          discountAmount: discountAmount
        } : null
      }
    });
  }));

  // Upload payment proof
  app.post("/api/orders/:id/upload-proof", requireAuth, paymentUpload.single('paymentProof'), asyncHandler(async (req, res) => {
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
  app.put("/api/admin/orders/:id/approve", requireAdmin, asyncHandler(async (req, res) => {
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
  app.get("/api/users", requireAdmin, asyncHandler(async (req, res) => {
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

  app.post("/api/admin/coupons", requireAdmin, asyncHandler(async (req, res) => {
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
    res.json(reviews);
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
    const settings = await storage.getPaymentSettings();
    // Return all settings for admin, only active for non-admin
    if (req.isAuthenticated() && req.user.role === 'admin') {
      res.json(settings);
    } else {
      const activeSettings = settings.filter(setting => setting.isActive);
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
    const settings = await storage.getPaymentSettings();
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
    const reviews = await storage.getAllReviews();
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
    res.json(settings);
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

  const httpServer = createServer(app);
  return httpServer;
}