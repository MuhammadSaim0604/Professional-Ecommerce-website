import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";

// Security imports
import { initializeSecurity, rateLimitConfigs, ipWhitelist, csrfProtection } from "./security/middleware";
import { requireAuth, requireAdmin, authenticateUser, registerUser, refreshAuthToken, logoutUser, AuthenticatedRequest } from "./security/authentication";
import { generateCSRFToken } from "./security/encryption";
import { validateBody, validateQuery, validateParams, validateFileUpload, transformFormDataBooleans, transformFormDataTypes } from "./security/validation";
import { 
  productValidation, 
  userValidation, 
  orderValidation, 
  categoryValidation, 
  couponValidation, 
  reviewValidation, 
  addressValidation,
  commonSchemas 
} from "./security/validation";

import { storage } from "./storage";
import { orderCalculator } from "./order-calculator";
import { z } from "zod";

// File upload configuration
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

// Helper function for async error handling
function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup security middleware first
  initializeSecurity(app);
  
  // Static file serving
  app.use('/uploads', express.static('uploads'));
  
  // ============================================================================
  // HEALTH & UTILITY ROUTES (Public)
  // ============================================================================
  
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "ShopFlow API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });
  
  app.get("/api/csrf-token", (req, res) => {
    const token = generateCSRFToken();
    (req.session as any).csrfToken = token;
    res.json({ success: true, token });
  });

  // ============================================================================
  // AUTHENTICATION ROUTES (Public with Rate Limiting)
  // ============================================================================
  
  app.post("/api/auth/register", 
    rateLimitConfigs.auth,
    validateBody(userValidation.register),
    asyncHandler(registerUser)
  );
  
  app.post("/api/auth/login", 
    rateLimitConfigs.auth,
    validateBody(userValidation.login),
    asyncHandler(authenticateUser)
  );
  
  app.post("/api/auth/logout", 
    rateLimitConfigs.general,
    asyncHandler(logoutUser)
  );
  
  app.post("/api/auth/refresh", 
    rateLimitConfigs.general,
    asyncHandler(refreshAuthToken)
  );

  // ============================================================================
  // PUBLIC CONTENT ROUTES (Rate Limited)
  // ============================================================================
  
  // Products - Public access
  app.get("/api/products", 
    rateLimitConfigs.general,
    validateQuery(productValidation.filters),
    asyncHandler(async (req, res) => {
      const result = await storage.getAllProducts(req.query);
      res.json({
        success: true,
        data: result,
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: result.total,
          hasNext: (req.query.offset + req.query.limit) < result.total
        }
      });
    })
  );
  
  app.get("/api/products/flash-sale", 
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const products = await storage.getProductsByType("flash_sale");
      res.json({ success: true, data: products });
    })
  );
  
  app.get("/api/products/featured", 
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const products = await storage.getProductsByType("featured");
      res.json({ success: true, data: products });
    })
  );
  
  app.get("/api/products/new-arrivals", 
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const products = await storage.getProductsByType("new_arrivals");
      res.json({ success: true, data: products });
    })
  );
  
  app.get("/api/products/:slug", 
    rateLimitConfigs.general,
    validateParams(z.object({ slug: commonSchemas.slug })),
    asyncHandler(async (req, res) => {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
          code: "PRODUCT_NOT_FOUND"
        });
      }
      res.json({ success: true, data: product });
    })
  );
  
  // Product Reviews - Public read access
  app.get("/api/products/:id/reviews", 
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    asyncHandler(async (req, res) => {
      const reviews = await storage.getProductReviews(parseInt(req.params.id));
      res.json({ success: true, data: reviews });
    })
  );
  
  // Categories - Public access
  app.get("/api/categories", 
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const categories = await storage.getAllCategories();
      res.json({ success: true, data: categories });
    })
  );
  
  app.get("/api/categories/:slug", 
    rateLimitConfigs.general,
    validateParams(z.object({ slug: commonSchemas.slug })),
    asyncHandler(async (req, res) => {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          code: "CATEGORY_NOT_FOUND"
        });
      }
      res.json({ success: true, data: category });
    })
  );
  
  // Banners - Public access
  app.get("/api/banners", 
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const banners = await storage.getActiveBanners();
      res.json({ success: true, data: banners });
    })
  );
  
  // System Settings - Public (filtered)
  app.get("/api/system-settings", 
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const settings = await storage.getPublicSystemSettings();
      res.json({ success: true, data: settings });
    })
  );
  
  // Search - Public with strict rate limiting
  app.get("/api/search", 
    rateLimitConfigs.general,
    validateQuery(z.object({
      q: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(50).default(20),
      offset: z.number().int().min(0).default(0)
    })),
    asyncHandler(async (req, res) => {
      const results = await storage.searchProducts(req.query);
      res.json({ success: true, data: results });
    })
  );
  
  app.get("/api/search/suggestions", 
    rateLimitConfigs.general,
    validateQuery(z.object({
      q: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(10).default(5)
    })),
    asyncHandler(async (req, res) => {
      const suggestions = await storage.getSearchSuggestions(req.query);
      res.json({ success: true, data: suggestions });
    })
  );

  // ============================================================================
  // USER AUTHENTICATED ROUTES
  // ============================================================================
  
  // User Profile Management
  app.get("/api/user/profile", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      // Remove sensitive information
      const { password, ...userProfile } = user;
      res.json({ success: true, data: userProfile });
    })
  );
  
  app.put("/api/user/profile", 
    requireAuth,
    rateLimitConfigs.general,
    validateBody(userValidation.update),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const updatedUser = await storage.updateUser(req.user!.id, req.body);
      const { password, ...userProfile } = updatedUser;
      res.json({ 
        success: true, 
        message: "Profile updated successfully",
        data: userProfile 
      });
    })
  );
  
  app.post("/api/user/avatar", 
    requireAuth,
    rateLimitConfigs.upload,
    upload.single('avatar'),
    validateFileUpload(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
          code: "FILE_REQUIRED"
        });
      }
      
      const avatarUrl = `/uploads/${req.file.filename}`;
      await storage.updateUser(req.user!.id, { avatar: avatarUrl });
      
      res.json({ 
        success: true, 
        message: "Avatar uploaded successfully",
        data: { avatarUrl } 
      });
    })
  );
  
  // Shopping Cart
  app.get("/api/cart", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const cartItems = await storage.getCartItems(req.user!.id);
      res.json({ success: true, data: cartItems });
    })
  );
  
  app.get("/api/cart/count", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const count = await storage.getCartCount(req.user!.id);
      res.json({ success: true, data: { count } });
    })
  );
  
  app.post("/api/cart", 
    requireAuth,
    rateLimitConfigs.general,
    validateBody(z.object({
      productId: commonSchemas.id,
      quantity: commonSchemas.quantity
    })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const cartItem = await storage.addToCart({
        userId: req.user!.id,
        productId: req.body.productId,
        quantity: req.body.quantity
      });
      res.status(201).json({ 
        success: true, 
        message: "Item added to cart",
        data: cartItem 
      });
    })
  );
  
  app.put("/api/cart/:itemId", 
    requireAuth,
    rateLimitConfigs.general,
    validateParams(z.object({ itemId: commonSchemas.id })),
    validateBody(z.object({ quantity: commonSchemas.quantity })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const itemId = parseInt(req.params.itemId);
      
      // Verify ownership
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem || cartItem.userId !== req.user!.id) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
          code: "CART_ITEM_NOT_FOUND"
        });
      }
      
      const updatedItem = await storage.updateCartItem(itemId, req.body.quantity);
      res.json({ 
        success: true, 
        message: "Cart item updated",
        data: updatedItem 
      });
    })
  );
  
  app.delete("/api/cart/:itemId", 
    requireAuth,
    rateLimitConfigs.general,
    validateParams(z.object({ itemId: commonSchemas.id })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const itemId = parseInt(req.params.itemId);
      
      // Verify ownership
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem || cartItem.userId !== req.user!.id) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
          code: "CART_ITEM_NOT_FOUND"
        });
      }
      
      await storage.removeFromCart(itemId);
      res.status(204).send();
    })
  );
  
  app.delete("/api/cart", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      await storage.clearCart(req.user!.id);
      res.json({ 
        success: true, 
        message: "Cart cleared successfully"
      });
    })
  );
  
  // Wishlist
  app.get("/api/wishlist", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const wishlistItems = await storage.getWishlistItems(req.user!.id);
      res.json({ success: true, data: wishlistItems });
    })
  );
  
  app.get("/api/wishlist/count", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const count = await storage.getWishlistCount(req.user!.id);
      res.json({ success: true, data: { count } });
    })
  );
  
  app.post("/api/wishlist", 
    requireAuth,
    rateLimitConfigs.general,
    validateBody(z.object({ productId: commonSchemas.id })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const wishlistItem = await storage.addToWishlist({
        userId: req.user!.id,
        productId: req.body.productId
      });
      res.status(201).json({ 
        success: true, 
        message: "Item added to wishlist",
        data: wishlistItem 
      });
    })
  );
  
  app.delete("/api/wishlist/:itemId", 
    requireAuth,
    rateLimitConfigs.general,
    validateParams(z.object({ itemId: commonSchemas.id })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const itemId = parseInt(req.params.itemId);
      
      // Verify ownership
      const wishlistItem = await storage.getWishlistItem(itemId);
      if (!wishlistItem || wishlistItem.userId !== req.user!.id) {
        return res.status(404).json({
          success: false,
          message: "Wishlist item not found",
          code: "WISHLIST_ITEM_NOT_FOUND"
        });
      }
      
      await storage.removeFromWishlist(itemId);
      res.status(204).send();
    })
  );
  
  // Orders
  app.get("/api/orders", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const orders = await storage.getUserOrders(req.user!.id);
      res.json({ success: true, data: orders });
    })
  );
  
  app.get("/api/orders/:id", 
    requireAuth,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
          code: "ORDER_NOT_FOUND"
        });
      }
      
      res.json({ success: true, data: order });
    })
  );
  
  app.post("/api/orders", 
    requireAuth,
    rateLimitConfigs.general,
    validateBody(orderValidation.create),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const orderData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const order = await orderCalculator.processOrder(
        req.user!.id,
        req.body.cartItems,
        orderData,
        req.body.couponCode
      );
      
      res.status(201).json({ 
        success: true, 
        message: "Order created successfully",
        data: order 
      });
    })
  );
  
  // Order Calculation
  app.post("/api/order/calculate", 
    requireAuth,
    rateLimitConfigs.general,
    validateBody(z.object({
      cartItems: z.array(z.object({
        productId: commonSchemas.id,
        quantity: commonSchemas.quantity
      })),
      couponCode: z.string().optional()
    })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const calculation = await orderCalculator.calculateOrder(
        req.body.cartItems,
        req.body.couponCode
      );
      res.json({ success: true, data: calculation });
    })
  );
  
  // Addresses
  app.get("/api/addresses", 
    requireAuth,
    rateLimitConfigs.general,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const addresses = await storage.getUserAddresses(req.user!.id);
      res.json({ success: true, data: addresses });
    })
  );
  
  app.post("/api/addresses", 
    requireAuth,
    rateLimitConfigs.general,
    validateBody(addressValidation.create),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const address = await storage.createAddress({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json({ 
        success: true, 
        message: "Address created successfully",
        data: address 
      });
    })
  );
  
  app.put("/api/addresses/:id", 
    requireAuth,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    validateBody(addressValidation.update),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const addressId = parseInt(req.params.id);
      
      // Verify ownership
      const existingAddress = await storage.getUserAddress(req.user!.id, addressId);
      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
          code: "ADDRESS_NOT_FOUND"
        });
      }
      
      const updatedAddress = await storage.updateAddress(addressId, req.body);
      res.json({ 
        success: true, 
        message: "Address updated successfully",
        data: updatedAddress 
      });
    })
  );
  
  app.delete("/api/addresses/:id", 
    requireAuth,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const addressId = parseInt(req.params.id);
      
      // Verify ownership
      const existingAddress = await storage.getUserAddress(req.user!.id, addressId);
      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
          code: "ADDRESS_NOT_FOUND"
        });
      }
      
      await storage.deleteAddress(addressId);
      res.status(204).send();
    })
  );
  
  // Reviews
  app.post("/api/products/:id/reviews", 
    requireAuth,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    validateBody(reviewValidation.create),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const productId = parseInt(req.params.id);
      
      const review = await storage.createReview({
        userId: req.user!.id,
        productId,
        ...req.body
      });
      
      res.status(201).json({ 
        success: true, 
        message: "Review created successfully",
        data: review 
      });
    })
  );

  // ============================================================================
  // ADMIN ROUTES (Require Admin Role)
  // ============================================================================
  
  // Admin IP whitelist (optional - uncomment to enable)
  // app.use('/api/admin/*', ipWhitelist(['127.0.0.1', '::1']));
  
  // Analytics
  app.get("/api/analytics", 
    requireAdmin,
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const analytics = await storage.getAnalytics();
      res.json({ success: true, data: analytics });
    })
  );
  
  // User Management
  app.get("/api/users", 
    requireAdmin,
    rateLimitConfigs.general,
    validateQuery(z.object({
      search: z.string().optional(),
      role: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
      sortBy: z.enum(['createdAt', 'updatedAt', 'email', 'username']).default('createdAt'),
      sortOrder: commonSchemas.sortOrder.default('desc')
    })),
    asyncHandler(async (req, res) => {
      const result = await storage.getAllUsersWithFilters(req.query);
      res.json({ success: true, data: result });
    })
  );
  
  app.put("/api/users/:id", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    validateBody(z.object({ isActive: z.boolean() })),
    asyncHandler(async (req, res) => {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUserStatus(userId, req.body.isActive);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      res.json({ 
        success: true, 
        message: "User status updated successfully",
        data: user 
      });
    })
  );
  
  // Product Management (Admin)
  app.get("/api/admin/products", 
    requireAdmin,
    rateLimitConfigs.general,
    validateQuery(productValidation.filters),
    asyncHandler(async (req, res) => {
      const result = await storage.getAllProducts(req.query);
      res.json({ success: true, data: result });
    })
  );
  
  app.post("/api/admin/products", 
    requireAdmin,
    rateLimitConfigs.general,
    validateBody(productValidation.create),
    asyncHandler(async (req, res) => {
      const product = await storage.createProduct(req.body);
      res.status(201).json({ 
        success: true, 
        message: "Product created successfully",
        data: product 
      });
    })
  );
  
  app.put("/api/admin/products/:id", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    transformFormDataTypes(['featured', 'isActive'], ['stock', 'lowStockThreshold', 'categoryId']),
    validateBody(productValidation.update),
    asyncHandler(async (req, res) => {
      const productId = parseInt(req.params.id);
      const product = await storage.updateProduct(productId, req.body);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
          code: "PRODUCT_NOT_FOUND"
        });
      }
      
      res.json({ 
        success: true, 
        message: "Product updated successfully",
        data: product 
      });
    })
  );
  
  app.delete("/api/admin/products/:id", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    asyncHandler(async (req, res) => {
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.status(204).send();
    })
  );
  
  // Category Management (Admin)
  app.get("/api/admin/categories", 
    requireAdmin,
    rateLimitConfigs.general,
    asyncHandler(async (req, res) => {
      const categories = await storage.getAllCategories();
      res.json({ success: true, data: categories });
    })
  );
  
  app.post("/api/admin/categories", 
    requireAdmin,
    rateLimitConfigs.general,
    validateBody(categoryValidation.create),
    asyncHandler(async (req, res) => {
      const category = await storage.createCategory(req.body);
      res.status(201).json({ 
        success: true, 
        message: "Category created successfully",
        data: category 
      });
    })
  );
  
  app.put("/api/admin/categories/:id", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    transformFormDataTypes(['isActive'], ['sortOrder']),
    validateBody(categoryValidation.update),
    asyncHandler(async (req, res) => {
      const categoryId = parseInt(req.params.id);
      const category = await storage.updateCategory(categoryId, req.body);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          code: "CATEGORY_NOT_FOUND"
        });
      }
      
      res.json({ 
        success: true, 
        message: "Category updated successfully",
        data: category 
      });
    })
  );
  
  app.delete("/api/admin/categories/:id", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    asyncHandler(async (req, res) => {
      const categoryId = parseInt(req.params.id);
      await storage.deleteCategory(categoryId);
      res.status(204).send();
    })
  );
  
  // Order Management (Admin)
  app.get("/api/admin/orders", 
    requireAdmin,
    rateLimitConfigs.general,
    validateQuery(z.object({
      status: z.string().optional(),
      paymentStatus: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
      sortBy: z.enum(['createdAt', 'updatedAt', 'totalAmount']).default('createdAt'),
      sortOrder: commonSchemas.sortOrder.default('desc')
    })),
    asyncHandler(async (req, res) => {
      const result = await storage.getAllOrdersWithFilters(req.query);
      res.json({ success: true, data: result });
    })
  );
  
  app.put("/api/admin/orders/:id/status", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    validateBody(z.object({
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      adminNotes: z.string().optional()
    })),
    asyncHandler(async (req, res) => {
      const orderId = parseInt(req.params.id);
      const order = await storage.updateOrderStatus(orderId, req.body.status, req.body.adminNotes);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
          code: "ORDER_NOT_FOUND"
        });
      }
      
      res.json({ 
        success: true, 
        message: "Order status updated successfully",
        data: order 
      });
    })
  );
  
  app.put("/api/admin/orders/:id/payment-status", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    validateBody(z.object({
      paymentStatus: z.enum(['unpaid', 'awaiting_confirmation', 'approved', 'paid', 'rejected']),
      rejectionReason: z.string().optional()
    })),
    asyncHandler(async (req, res) => {
      const orderId = parseInt(req.params.id);
      const order = await storage.updateOrderPaymentStatus(
        orderId, 
        req.body.paymentStatus, 
        req.body.rejectionReason
      );
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
          code: "ORDER_NOT_FOUND"
        });
      }
      
      res.json({ 
        success: true, 
        message: "Payment status updated successfully",
        data: order 
      });
    })
  );
  
  // Coupon Management (Admin)
  app.get("/api/admin/coupons", 
    requireAdmin,
    rateLimitConfigs.general,
    validateQuery(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      discountType: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
      sortBy: z.enum(['createdAt', 'code', 'discountValue']).default('createdAt'),
      sortOrder: commonSchemas.sortOrder.default('desc')
    })),
    asyncHandler(async (req, res) => {
      const result = await storage.getAllCouponsWithFilters(req.query);
      res.json({ success: true, data: result });
    })
  );
  
  app.post("/api/admin/coupons", 
    requireAdmin,
    rateLimitConfigs.general,
    validateBody(couponValidation.create),
    asyncHandler(async (req, res) => {
      const coupon = await storage.createCoupon(req.body);
      res.status(201).json({ 
        success: true, 
        message: "Coupon created successfully",
        data: coupon 
      });
    })
  );
  
  app.put("/api/admin/coupons/:id", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    validateBody(couponValidation.update),
    asyncHandler(async (req, res) => {
      const couponId = parseInt(req.params.id);
      const coupon = await storage.updateCoupon(couponId, req.body);
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Coupon not found",
          code: "COUPON_NOT_FOUND"
        });
      }
      
      res.json({ 
        success: true, 
        message: "Coupon updated successfully",
        data: coupon 
      });
    })
  );
  
  app.delete("/api/admin/coupons/:id", 
    requireAdmin,
    rateLimitConfigs.general,
    validateParams(z.object({ id: commonSchemas.id })),
    asyncHandler(async (req, res) => {
      const couponId = parseInt(req.params.id);
      await storage.deleteCoupon(couponId);
      res.status(204).send();
    })
  );

  const httpServer = createServer(app);
  return httpServer;
}