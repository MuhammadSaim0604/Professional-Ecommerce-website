import {
  users,
  products,
  categories,
  orders,
  orderItems,
  cartItems,
  wishlistItems,
  addresses,
  coupons,
  reviews,
  banners,
  paymentSettings,
  flashSales,
  notifications,
  systemSettings,
  editorSettings,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CartItem,
  type InsertCartItem,
  type WishlistItem,
  type InsertWishlistItem,
  type Address,
  type InsertAddress,
  type Coupon,
  type InsertCoupon,
  type Review,
  type InsertReview,
  type Banner,
  type InsertBanner,
  type PaymentSetting,
  type InsertPaymentSetting,
  type FlashSale,
  type InsertFlashSale,
  type Notification,
  type InsertNotification,
  type SystemSetting,
  type InsertSystemSetting,
  type EditorSetting,
  type InsertEditorSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, or, count, sum, ilike, gte, lte, gt, inArray, sql, ne, isNotNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: number,
    updates: Partial<InsertUser>,
  ): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithFilters(params?: {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ users: User[]; total: number }>;
  updateUserStatus(id: number, isActive: boolean): Promise<User | undefined>;

  // Categories
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  getAllCategoriesWithFilters(params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ categories: Category[]; total: number }>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(
    id: number,
    updates: Partial<InsertCategory>,
  ): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getAllProducts(params?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    active?: boolean;
    brand?: string;
    color?: string;
    priceMin?: number;
    priceMax?: number;
    stock?: string;
    minRating?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ products: Product[]; total: number }>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: number,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Cart
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Wishlist
  getWishlistItems(
    userId: number,
  ): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getAllOrdersWithFilters(params?: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ orders: Order[]; total: number }>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(
    id: number,
    updates: Partial<InsertOrder>,
  ): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updatePaymentStatus(
    id: number,
    paymentStatus: string,
  ): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Reviews
  getProductReviews(
    productId: number,
  ): Promise<(Review & { user: Pick<User, "firstName" | "lastName"> })[]>;
  getAllReviews(): Promise<(Review & { user: Pick<User, "firstName" | "lastName"> })[]>;
  getAllReviewsWithFilters(params?: {
    search?: string;
    status?: string;
    rating?: string;
    productId?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ reviews: Review[]; total: number }>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(
    id: number,
    updates: Partial<InsertReview>,
  ): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  updateProductRatingStats(productId: number): Promise<void>;
  recalculateAllProductRatings(): Promise<void>;

  // Addresses
  getUserAddresses(userId: number): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(
    id: number,
    updates: Partial<InsertAddress>,
  ): Promise<Address | undefined>;
  deleteAddress(id: number): Promise<boolean>;

  // Coupons
  getCoupon(id: number): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getAllCoupons(): Promise<Coupon[]>;
  getAllCouponsWithFilters(params?: {
    search?: string;
    status?: string;
    discountType?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ coupons: Coupon[]; total: number }>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(
    id: number,
    updates: Partial<InsertCoupon>,
  ): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;

  // Analytics
  getAnalytics(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    recentOrders: Order[];
    completedOrders: number;
    pendingOrders: number;
    dailySales: Array<{ date: string; sales: number; orders: number }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    paymentMethodStats: Array<{ method: string; count: number }>;
  }>;

  // Payment Settings
  getPaymentSettings(): Promise<PaymentSetting[]>;
  getAllPaymentSettings(): Promise<PaymentSetting[]>;
  createPaymentSetting(setting: InsertPaymentSetting): Promise<PaymentSetting>;
  updatePaymentSetting(
    id: number,
    updates: Partial<InsertPaymentSetting>,
  ): Promise<PaymentSetting | undefined>;
  deletePaymentSetting(id: number): Promise<boolean>;

  // Flash Sales
  getActiveFlashSales(): Promise<(FlashSale & { product: Product })[]>;
  getFlashSale(id: number): Promise<FlashSale | undefined>;
  getAllFlashSales(): Promise<FlashSale[]>;
  createFlashSale(flashSale: InsertFlashSale): Promise<FlashSale>;
  updateFlashSale(
    id: number,
    updates: Partial<InsertFlashSale>,
  ): Promise<FlashSale | undefined>;
  deleteFlashSale(id: number): Promise<boolean>;
  getFlashSaleProducts(): Promise<Product[]>;

  // Product Type System
  getProductsByType(productType: string): Promise<Product[]>;
  getSearchSettings(): Promise<{ [key: string]: boolean }>;
  getProductsForSearch(query: string, searchSettings: { [key: string]: boolean }): Promise<{ products: Product[]; total: number }>;

  // Banners
  getActiveBanners(): Promise<Banner[]>;
  getAllBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(
    id: number,
    updates: Partial<InsertBanner>,
  ): Promise<Banner | undefined>;
  deleteBanner(id: number): Promise<boolean>;

  // Notifications
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // System Settings
  getSystemSettings(): Promise<SystemSetting[]>;
  getPublicSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(
    id: number,
    updates: Partial<InsertSystemSetting>,
  ): Promise<SystemSetting | undefined>;
  deleteSystemSetting(id: number): Promise<boolean>;

  // Search functionality
  searchProducts(query: string, options?: any): Promise<{ products: Product[]; total: number }>;
  getSearchSuggestions(query: string): Promise<string[]>;

  // Cart helpers
  getCartCount(userId: number): Promise<number>;
  getCartItem(userId: number, productId: number): Promise<CartItem | undefined>;

  // Wishlist helpers
  getWishlistCount(userId: number): Promise<number>;
  getWishlistItem(userId: number, productId: number): Promise<WishlistItem | undefined>;

  // Address helpers
  getUserAddress(userId: number, addressId: number): Promise<Address | undefined>;

  // Order payment helpers
  updateOrderPaymentStatus(orderId: number, paymentStatus: string, paymentProof?: string): Promise<Order | undefined>;

  // Editor Settings
  getEditorSettings(): Promise<EditorSetting | undefined>;
  createEditorSettings(settings: InsertEditorSetting): Promise<EditorSetting>;
  updateEditorSettings(
    id: number,
    updates: Partial<InsertEditorSetting>,
  ): Promise<EditorSetting | undefined>;

  // Database export/import
  getAllUsersForExport(): Promise<User[]>;
  getAllCategoriesForExport(): Promise<Category[]>;
  getAllProductsForExport(): Promise<Product[]>;
  getAllCartItemsForExport(): Promise<CartItem[]>;
  getAllWishlistItemsForExport(): Promise<WishlistItem[]>;
  getAllOrdersForExport(): Promise<Order[]>;
  getAllOrderItemsForExport(): Promise<OrderItem[]>;
  getAllReviewsForExport(): Promise<Review[]>;
  getAllAddressesForExport(): Promise<Address[]>;
  getAllCouponsForExport(): Promise<Coupon[]>;
  getAllPaymentSettingsForExport(): Promise<PaymentSetting[]>;
  getAllSystemSettingsForExport(): Promise<SystemSetting[]>;
  getAllFlashSalesForExport(): Promise<FlashSale[]>;
  getAllBannersForExport(): Promise<Banner[]>;
  getAllNotificationsForExport(): Promise<Notification[]>;
  
  clearAllData(): Promise<void>;
  importUsers(users: any[]): Promise<{imported: number, skipped: number}>;
  importCategories(categories: any[]): Promise<{imported: number, skipped: number}>;
  importProducts(products: any[]): Promise<{imported: number, skipped: number}>;
  importCartItems(cartItems: any[]): Promise<{imported: number, skipped: number}>;
  importWishlistItems(wishlistItems: any[]): Promise<{imported: number, skipped: number}>;
  importOrders(orders: any[]): Promise<{imported: number, skipped: number}>;
  importOrderItems(orderItems: any[]): Promise<{imported: number, skipped: number}>;
  importReviews(reviews: any[]): Promise<{imported: number, skipped: number}>;
  importAddresses(addresses: any[]): Promise<{imported: number, skipped: number}>;
  importCoupons(coupons: any[]): Promise<{imported: number, skipped: number}>;
  importPaymentSettings(paymentSettings: any[]): Promise<{imported: number, skipped: number}>;
  importSystemSettings(systemSettings: any[]): Promise<{imported: number, skipped: number}>;
  importFlashSales(flashSales: any[]): Promise<{imported: number, skipped: number}>;
  importBanners(banners: any[]): Promise<{imported: number, skipped: number}>;
  importNotifications(notifications: any[]): Promise<{imported: number, skipped: number}>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });

    // Handle pool connection errors
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    pool.on('connect', () => {
      console.log('Database pool connected');
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values({
        username: insertUser.username,
        email: insertUser.email,
        firstName: insertUser.firstName,
        lastName: insertUser.lastName,
        phone: insertUser.phone,
        password: insertUser.password,
        role: insertUser.role || 'user',
        isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    updates: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserProfile(
    id: number,
    profileData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      bio?: string;
      dateOfBirth?: Date;
      gender?: string;
      location?: string;
      website?: string;
      avatar?: string;
      socialLinks?: Record<string, string>;
    },
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPreferences(
    id: number,
    preferences: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      marketingEmails?: boolean;
      newsletter?: boolean;
      preferredLanguage?: string;
      preferredCurrency?: string;
      timezone?: string;
    },
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPrivacy(
    id: number,
    privacySettings: {
      profileVisibility?: string;
      showEmail?: boolean;
      showPhone?: boolean;
      showLocation?: boolean;
    },
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...privacySettings, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllUsersWithFilters(params: {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}): Promise<{ users: User[]; total: number }> {
    const {
      search,
      role,
      status,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    let conditions: any[] = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    // Role filter
    if (role) {
      conditions.push(eq(users.role, role));
    }

    // Status filter
    if (status) {
      const isActive = status === 'active';
      conditions.push(eq(users.isActive, isActive));
    }

    // Build the base query
    let query = db.select().from(users);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    // Apply sorting
    let orderBy;
    if (sortBy === 'name') {
      orderBy = sortOrder === 'asc' ? asc(users.firstName) : desc(users.firstName);
    } else if (sortBy === 'email') {
      orderBy = sortOrder === 'asc' ? asc(users.email) : desc(users.email);
    } else if (sortBy === 'role') {
      orderBy = sortOrder === 'asc' ? asc(users.role) : desc(users.role);
    } else if (sortBy === 'status') {
      orderBy = sortOrder === 'asc' ? asc(users.isActive) : desc(users.isActive);
    } else {
      // Default to createdAt
      orderBy = sortOrder === 'asc' ? asc(users.createdAt) : desc(users.createdAt);
    }

    // Apply pagination and ordering
    const usersResult = await query
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      users: usersResult,
      total
    };
  }

  async updateUserStatus(
    id: number,
    isActive: boolean,
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        isActive,
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // First delete related data to maintain referential integrity
      await db.delete(cartItems).where(eq(cartItems.userId, id));
      await db.delete(wishlistItems).where(eq(wishlistItems.userId, id));
      await db.delete(addresses).where(eq(addresses.userId, id));
      await db.delete(reviews).where(eq(reviews.userId, id));
      
      // Note: We don't delete orders as they are important for business records
      // Instead, we could set orders to anonymous or keep them for audit purposes
      
      // Delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Categories
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return category || undefined;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true));
  }

  async getAllCategoriesWithFilters(params: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}): Promise<{ categories: Category[]; total: number }> {
    const {
      search,
      status,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          ilike(categories.name, `%${search}%`),
          ilike(categories.description, `%${search}%`),
          ilike(categories.slug, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status) {
      const isActive = status === 'active';
      conditions.push(eq(categories.isActive, isActive));
    }

    // Build the base query
    let query = db.select().from(categories);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(categories);

    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    // Apply sorting
    let orderBy;
    if (sortBy === 'name') {
      orderBy = sortOrder === 'asc' ? asc(categories.name) : desc(categories.name);
    } else if (sortBy === 'slug') {
      orderBy = sortOrder === 'asc' ? asc(categories.slug) : desc(categories.slug);
    } else if (sortBy === 'sortOrder') {
      orderBy = sortOrder === 'asc' ? asc(categories.sortOrder) : desc(categories.sortOrder);
    } else {
      // Default to createdAt
      orderBy = sortOrder === 'asc' ? asc(categories.createdAt) : desc(categories.createdAt);
    }

    // Apply pagination and ordering
    const categoriesResult = await query
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      categories: categoriesResult,
      total
    };
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(
    id: number,
    updates: Partial<InsertCategory>,
  ): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Helper method to update subcategory image if it doesn't already exist
  private async updateSubcategoryImageIfNeeded(
    categoryId: number, 
    subcategoryName: string, 
    imageUrl: string
  ): Promise<void> {
    try {
      const category = await this.getCategory(categoryId);
      if (!category || !Array.isArray(category.subcategories)) {
        return;
      }

      const subcategories = [...category.subcategories];
      const subcategoryIndex = subcategories.findIndex(sub => 
        sub.search_term && sub.search_term.toLowerCase() === subcategoryName.toLowerCase()
      );

      if (subcategoryIndex >= 0) {
        const existingSub = subcategories[subcategoryIndex];
        // Only update picture if it doesn't exist or is empty
        if (!existingSub.picture || existingSub.picture.trim().length === 0) {
          subcategories[subcategoryIndex] = {
            ...existingSub,
            picture: imageUrl
          };

          // Update the category with the modified subcategories
          await db
            .update(categories)
            .set({ 
              subcategories: subcategories,
              updatedAt: new Date()
            })
            .where(eq(categories.id, categoryId));

          console.log(`✅ Updated subcategory "${subcategoryName}" picture for category ${categoryId}`);
        } else {
          console.log(`ℹ️ Subcategory "${subcategoryName}" already has a picture, skipping update`);
        }
      }
    } catch (error) {
      console.error(`Error updating subcategory image for category ${categoryId}:`, error);
    }
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug));
    return product || undefined;
  }

  async getAllProducts(
    params: {
      categoryId?: number;
      search?: string;
      sub_term?: string;
      featured?: boolean;
      active?: boolean;
      archived?: boolean;
      flashSale?: boolean;
      newArrivals?: boolean;
      brand?: string;
      color?: string;
      priceMin?: number;
      priceMax?: number;
      stock?: string;
      minRating?: number;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      excludeFlashSale?: boolean;
      productType?: string;
    } = {},
  ): Promise<{ products: Product[]; total: number }> {
    const {
      categoryId,
      search,
      sub_term,
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
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      excludeFlashSale,
      productType,
    } = params;

    try {
      // First get products with basic query
      let baseQuery = db.select().from(products);
      let conditions: any[] = [];

      // Handle active/archived filter
      if (active !== undefined) {
        conditions.push(eq(products.isActive, active));
      } else if (archived) {
        // If archived is explicitly requested, show archived products
        conditions.push(eq(products.isActive, false));
      } else if (params.showAll) {
        // Admin panel requests to show all products (both active and inactive)
        // Don't add any isActive filter
      } else {
        // Default to showing only active products for public API
        conditions.push(eq(products.isActive, true));
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
      }

      // Simple search logic - avoid JSONB conflicts
      if (search && sub_term) {
        // When both are provided, prioritize subcategory search
        conditions.push(
          or(
            ilike(products.subcategory, `%${sub_term}%`),
            ilike(products.name, `%${search}%`)
          )!
        );
      } else if (search) {
        // General search
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`),
            ilike(products.sku, `%${search}%`),
            ilike(products.brand, `%${search}%`),
            ilike(products.subcategory, `%${search}%`)
          )!,
        );
      } else if (sub_term) {
        // Subcategory-specific search
        conditions.push(ilike(products.subcategory, `%${sub_term}%`));
      }

      // Handle product type filters
      if (featured) {
        conditions.push(eq(products.productType, "featured"));
      } else if (flashSale) {
        conditions.push(eq(products.productType, "flash_sale"));
      } else if (newArrivals) {
        conditions.push(eq(products.productType, "new_arrivals"));
      }

      // Handle direct productType filter (overrides featured/flashSale/newArrivals)
      if (productType) {
        conditions.push(eq(products.productType, productType));
      }

      // Exclude flash sale products if requested
      if (excludeFlashSale) {
        conditions.push(ne(products.productType, "flash_sale"));
      }

      if (brand) {
        conditions.push(ilike(products.brand, `%${brand}%`));
      }

      if (color) {
        conditions.push(ilike(products.color, `%${color}%`));
      }

      if (priceMin !== undefined) {
        conditions.push(gte(products.price, priceMin.toString()));
      }

      if (priceMax !== undefined) {
        conditions.push(lte(products.price, priceMax.toString()));
      }

      // Stock filter
      if (stock && stock !== 'all') {
        if (stock === 'in-stock') {
          conditions.push(gt(products.stock, 0));
        } else if (stock === 'out-of-stock') {
          conditions.push(eq(products.stock, 0));
        }
      }

      // Rating filter - Note: This assumes rating is stored as a numeric field
      // For now, we'll skip the rating filter since the schema doesn't include a rating field
      // This would need to be added to the products table schema if rating filtering is required

      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }

      // Add sorting
      const orderByFn = sortOrder === "asc" ? asc : desc;
      switch (sortBy) {
        case "price":
          baseQuery = baseQuery.orderBy(orderByFn(products.price));
          break;
        case "name":
          baseQuery = baseQuery.orderBy(orderByFn(products.name));
          break;
        default:
          baseQuery = baseQuery.orderBy(orderByFn(products.createdAt));
      }

      baseQuery = baseQuery.limit(limit).offset(offset);

      const [productsResult, categoriesResult] = await Promise.all([
        baseQuery,
        db.select().from(categories),
      ]);

      // Map categories to products
      const categoryMap = new Map(categoriesResult.map(cat => [cat.id, cat]));

      const productsWithCategories = productsResult.map(product => {
        const category = product.categoryId ? categoryMap.get(product.categoryId) : null;
        // Remove subcategories from category object to fix the /products API issue (user's request)
        const categoryWithoutSubcategories = category ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        } : null;
        
        return {
        ...product,
        category: categoryWithoutSubcategories,
        // Handle image URL - take first image or use placeholder
        imageUrl: product.images && Array.isArray(product.images) && product.images.length > 0 
          ? product.images[0] 
          : '/api/placeholder/300/300',
        // Convert price fields to strings for display
        price: product.price ? product.price.toString() : '0',
        originalPrice: product.salePrice ? product.price?.toString() : undefined,
        salePrice: product.salePrice ? product.salePrice.toString() : undefined,
        featured: product.productType === 'featured',
      };
      });

      // Get total count
      let countQuery = db.select({ count: count() }).from(products);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: total }] = await countQuery;

      return {
        products: productsWithCategories,
        total,
      };
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      return { products: [], total: 0 };
    }
  }

  async createProduct(data: any) {
    // Ensure all fields are properly mapped to database columns
    const productData = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      price: data.price,
      originalPrice: data.originalPrice || null,
      salePrice: data.salePrice || null,
      discountPercentage: data.discountPercentage || null,
      sku: data.sku,
      stock: data.stock || 0,
      images: Array.isArray(data.images) ? data.images : [],
      categoryId: data.categoryId,
      isActive: data.isActive !== false,
      // Product type system
      productType: data.productType || "simple",
      // Flash sale fields
      flashSaleDiscount: data.flashSaleDiscount || null,
      flashSaleStartDate: data.flashSaleStartDate || null,
      flashSaleEndDate: data.flashSaleEndDate || null,
      // Legacy fields - remove these as they don't exist in schema
      // isFeatured: data.isFeatured || data.featured || false,
      // isFlashSale: data.isFlashSale || false,
      rating: data.rating || "0",
      reviewCount: data.reviewCount || 0,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []),
      // Product specification fields
      weight: data.weight || null,
      dimensions: data.dimensions || null,
      material: data.material || null,
      brand: data.brand || null,
      color: data.color || null,
      size: data.size || null,
      // SEO fields
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      // Subcategory field (user's request for explicit subcategory management)
      subcategory: data.subcategory || null,
    };

    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(
    id: number,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    // First get the current product to check for changes
    const currentProduct = await this.getProduct(id);
    if (!currentProduct) {
      return undefined;
    }

    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    
    if (!product) {
      return undefined;
    }

    // Check if subcategory was updated and product has images
    if (updates.subcategory && 
        updates.subcategory.trim().length > 0 && 
        product.categoryId &&
        Array.isArray(product.images) && 
        product.images.length > 0) {
      
      await this.updateSubcategoryImageIfNeeded(
        product.categoryId, 
        updates.subcategory.trim(), 
        product.images[0]
      );
    }

    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const result = await db.delete(products).where(eq(products.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Cart
  async getCartItems(
    userId: number,
  ): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select()
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    return result.map((row) => ({
      ...row.cart_items,
      product: row.products,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, item.userId),
          eq(cartItems.productId, item.productId),
        ),
      );

    if (existing) {
      // Update quantity
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + item.quantity })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(item).returning();
      return newItem;
    }
  }

  async updateCartItem(
    id: number,
    quantity: number,
  ): Promise<CartItem | undefined> {
    const [item] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return item || undefined;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
    return result.rowCount >= 0;
  }

  // Wishlist
  async getWishlistItems(
    userId: number,
  ): Promise<(WishlistItem & { product: Product })[]> {
    const result = await db
      .select()
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId));

    return result.map((row) => ({
      ...row.wishlist_items,
      product: row.products,
    }));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const [newItem] = await db.insert(wishlistItems).values(item).returning();
    return newItem;
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(wishlistItems)
        .where(eq(wishlistItems.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined>{
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    const result = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        shippingAddress: orders.shippingAddress,
        paymentProof: orders.paymentProof,
        adminNotes: orders.adminNotes,
        rejectionReason: orders.rejectionReason,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // User details
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email,
          isActive: users.isActive,
          createdAt: users.createdAt,
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(asc(orders.createdAt)); // Oldest first as requested

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      result.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, items };
      })
    );

    return ordersWithItems;
  }

  async getAllOrdersWithFilters(params: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        search,
        status,
        paymentStatus,
        paymentMethod,
        dateFrom,
        dateTo,
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      // Build where conditions
      const conditions = [];

      if (status && status !== 'all') {
        conditions.push(eq(orders.status, status));
      }

      if (paymentStatus && paymentStatus !== 'all') {
        conditions.push(eq(orders.paymentStatus, paymentStatus));
      }

      if (paymentMethod && paymentMethod !== 'all') {
        conditions.push(eq(orders.paymentMethod, paymentMethod));
      }

      if (dateFrom) {
        conditions.push(gte(orders.createdAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(orders.createdAt, new Date(dateTo)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get orders with basic filters
      const ordersResult = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(sortOrder === 'asc' ? asc(orders[sortBy as keyof typeof orders] || orders.createdAt) : desc(orders[sortBy as keyof typeof orders] || orders.createdAt))
        .limit(limit)
        .offset(offset);

      // Get unique user IDs from orders
      const userIds = [...new Set(ordersResult.map(order => order.userId).filter(Boolean))];

      // Fetch all users at once
      const usersResult = userIds.length > 0 
        ? await db.select().from(users).where(inArray(users.id, userIds))
        : [];

      // Create a map for quick user lookup
      const userMap = new Map(usersResult.map(user => [user.id, user]));

      // If search is provided, also get order items and products for SKU matching
      let orderItemsMap = new Map();
      let productsMap = new Map();

      if (search) {
        const orderIds = ordersResult.map(order => order.id);
        if (orderIds.length > 0) {
          // Get order items
          const orderItemsResult = await db
            .select()
            .from(orderItems)
            .where(inArray(orderItems.orderId, orderIds));

          // Group order items by order ID
          orderItemsResult.forEach(item => {
            if (!orderItemsMap.has(item.orderId)) {
              orderItemsMap.set(item.orderId, []);
            }
            orderItemsMap.get(item.orderId).push(item);
          });

          // Get products for SKU search
          const productIds = [...new Set(orderItemsResult.map(item => item.productId))];
          if (productIds.length > 0) {
            const productsResult = await db
              .select()
              .from(products)
              .where(inArray(products.id, productIds));

            productsResult.forEach(product => {
              productsMap.set(product.id, product);
            });
          }
        }
      }

      // Combine orders with user data and search user fields if needed
      let ordersWithUsers = ordersResult.map(order => ({
        ...order,
        user: order.userId ? userMap.get(order.userId) || null : null,
      }));

      // Apply comprehensive search filter if needed
      if (search) {
        const searchLower = search.toLowerCase();
        ordersWithUsers = ordersWithUsers.filter(order => {
          // Order-specific fields
          const orderMatch = 
            order.orderNumber?.toLowerCase().includes(searchLower) ||
            order.status?.toLowerCase().includes(searchLower) ||
            order.paymentStatus?.toLowerCase().includes(searchLower) ||
            order.paymentMethod?.toLowerCase().includes(searchLower) ||
            order.shippingAddress?.toLowerCase().includes(searchLower) ||
            order.totalAmount?.toString().includes(search) ||
            order.subtotalAmount?.toString().includes(search) ||
            order.discountAmount?.toString().includes(search) ||
            order.id?.toString().includes(search) ||
            order.userId?.toString().includes(search) ||
            order.notes?.toLowerCase().includes(searchLower) ||
            order.adminNotes?.toLowerCase().includes(searchLower) ||
            order.rejectionReason?.toLowerCase().includes(searchLower) ||
            order.couponCode?.toLowerCase().includes(searchLower);

          // User-specific fields
          const userMatch = order.user && (
            order.user.firstName?.toLowerCase().includes(searchLower) ||
            order.user.lastName?.toLowerCase().includes(searchLower) ||
            order.user.email?.toLowerCase().includes(searchLower) ||
            order.user.username?.toLowerCase().includes(searchLower) ||
            order.user.id?.toString().includes(search) ||
            `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim().toLowerCase().includes(searchLower)
          );

          // Product/SKU search through order items
          const productMatch = orderItemsMap.has(order.id) && 
            orderItemsMap.get(order.id).some((item: any) => {
              const product = productsMap.get(item.productId);
              return product && (
                product.name?.toLowerCase().includes(searchLower) ||
                product.sku?.toLowerCase().includes(searchLower) ||
                product.brand?.toLowerCase().includes(searchLower)
              );
            });

          return orderMatch || userMatch || productMatch;
        });
      }

      // Get total count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);

      return {
        orders: ordersWithUsers,
        total: totalResult[0]?.count || 0,
        hasMore: (offset + limit) < (totalResult[0]?.count || 0)
      };
    } catch (error) {
      console.error('Error in getAllOrdersWithFilters:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(
    id: number,
    updates: Partial<InsertOrder>,
  ): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async updateOrderStatus(
    id: number,
    status: string,
  ): Promise<Order | undefined> {
    const [result] = await db
      .update(orders)
      .set({
        status,
      })
      .where(eq(orders.id, id))
      .returning();
    return result || undefined;
  }

  async updatePaymentStatus(
    id: number,
    paymentStatus: string,
  ): Promise<Order | undefined> {
    const [result] = await db
      .update(orders)
      .set({
        paymentStatus,
      })
      .where(eq(orders.id, id))
      .returning();
    return result || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // First delete related order items
      await db.delete(orderItems).where(eq(orderItems.orderId, id));

      // Then delete the order
      const result = await db.delete(orders).where(eq(orders.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // Order Items
  async getOrderItems(
    orderId: number,
  ): Promise<(OrderItem & { product: Product })[]> {
    const result = await db
      .select()
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return result.map((row) => ({
      ...row.order_items,
      product: row.products,
    }));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  // Reviews
  async getProductReviews(
    productId: number,
  ): Promise<(Review & { user: Pick<User, "firstName" | "lastName" | "avatar"> })[]> {
    const result = await db
      .select({
        review: reviews,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(
        and(eq(reviews.productId, productId), eq(reviews.isApproved, true)),
      )
      .orderBy(desc(reviews.createdAt));

    return result.map((row) => ({
      ...row.review,
      user: row.user,
    }));
  }

  async getAllReviews(): Promise<(Review & { user: Pick<User, "firstName" | "lastName"> })[]> {
    const result = await db
      .select({
        review: reviews,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .orderBy(desc(reviews.createdAt));

    return result.map((row) => ({
      ...row.review,
      user: row.user,
    }));
  }

  async getAllReviewsWithFilters(params: {
    search?: string;
    status?: string;
    rating?: string;
    productId?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}): Promise<{ reviews: Review[]; total: number }> {
    const {
      search,
      status,
      productId,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    let conditions: any[] = [];

    // Search filter - search in comments, product names, and user names
    if (search) {
      conditions.push(
        or(
          ilike(reviews.comment, `%${search}%`),
          ilike(products.name, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'approved') {
        conditions.push(eq(reviews.isApproved, true));
      } else if (status === 'pending') {
        conditions.push(eq(reviews.isApproved, false));
      } else if (status === 'rejected') {
        conditions.push(eq(reviews.isApproved, false));
      }
    }

    // Rating filter
    if (params.rating && params.rating !== 'all') {
      const ratingValue = parseInt(params.rating);
      if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
        conditions.push(eq(reviews.rating, ratingValue));
      }
    }

    // Product filter
    if (productId) {
      conditions.push(eq(reviews.productId, productId));
    }

    // Build the base query
    let query = db
      .select({
        review: reviews,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
        product: {
          name: products.name,
          slug: products.slug
        }
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(products, eq(reviews.productId, products.id)); // Join products table

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    let totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(products, eq(reviews.productId, products.id));

    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    // Apply sorting
    let orderBy;
    if (sortBy === 'comment') {
      orderBy = sortOrder === 'asc' ? asc(reviews.comment) : desc(reviews.comment);
    } else if (sortBy === 'rating') {
      orderBy = sortOrder === 'asc' ? asc(reviews.rating) : desc(reviews.rating);
    } else if (sortBy === 'isApproved') {
      orderBy = sortOrder === 'asc' ? asc(reviews.isApproved) : desc(reviews.isApproved);
    }
     else if (sortBy === 'productName') {
        orderBy = sortOrder === 'asc' ? asc(products.name) : desc(products.name);
    }
    else {
      orderBy = sortOrder === 'asc' ? asc(reviews.createdAt) : desc(reviews.createdAt);
    }

    // Apply pagination and ordering
    const reviewsResult = await query
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const reviewsFormatted = reviewsResult.map((row) => ({
      ...row.review,
      user: row.user,
      product: row.product
    }));

    return {
      reviews: reviewsFormatted,
      total
    };
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();

    // Update product rating and review count
    await this.updateProductRatingStats(review.productId);

    return newReview;
  }

  async updateReview(
    id: number,
    updates: Partial<InsertReview>,
  ): Promise<Review | undefined> {
    // Get the review first to get the productId
    const existingReview = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);

    const [review] = await db
      .update(reviews)
      .set(updates)
      .where(eq(reviews.id, id))
      .returning();

    // Update product rating stats if review exists
    if (review && existingReview.length > 0) {
      await this.updateProductRatingStats(existingReview[0].productId);
    }

    return review || undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    // Get the review first to get the productId
    const existingReview = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);

    const result = await db.delete(reviews).where(eq(reviews.id, id));
    const success = result.rowCount > 0;

    // Update product rating stats if review was deleted
    if (success && existingReview.length > 0) {
      await this.updateProductRatingStats(existingReview[0].productId);
    }

    return success;
  }

  // Helper function to update product rating statistics
  async updateProductRatingStats(productId: number): Promise<void> {
    try {
      // Calculate average rating and count from approved reviews only
      const result = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}::numeric), 0)`,
          reviewCount: sql<number>`COUNT(*)`,
        })
        .from(reviews)
        .where(and(
          eq(reviews.productId, productId),
          eq(reviews.isApproved, true)
        ));

      const stats = result[0];
      const avgRating = Number(stats.avgRating) || 0;
      const reviewCount = Number(stats.reviewCount) || 0;

      // Update the product with real calculated statistics
      await db
        .update(products)
        .set({
          rating: avgRating.toFixed(2), // Store as string with 2 decimal places
          reviewCount: reviewCount,
        })
        .where(eq(products.id, productId));

    } catch (error) {
      console.error('Error updating product rating stats:', error);
    }
  }

  // Function to recalculate all product ratings
  async recalculateAllProductRatings(): Promise<void> {
    try {
      console.log('Recalculating all product ratings...');

      // Get all products
      const allProducts = await db.select({ id: products.id }).from(products);

      for (const product of allProducts) {
        await this.updateProductRatingStats(product.id);
      }

      console.log(`Updated ratings for ${allProducts.length} products`);
    } catch (error) {
      console.error('Error recalculating all product ratings:', error);
    }
  }

  // Addresses
  async getUserAddresses(userId: number) {
    try {
      const dbAddresses = await db.select().from(addresses).where(eq(addresses.userId, userId));
      // Map address1 back to address for frontend compatibility
      return dbAddresses.map(addr => ({
        ...addr,
        address: addr.address1, // Map address1 back to address
      }));
    } catch (error) {
      console.error('Error getting user addresses:', error);
      return [];
    }
  }

  async createAddress(addressData: InsertAddress): Promise<Address> {
    try {
      // If this is set as default, unset all other default addresses for this user
      if (addressData.isDefault) {
        await db.update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, addressData.userId));
      }

      const [address] = await db.insert(addresses).values({
        userId: addressData.userId,
        firstName: addressData.firstName,
        lastName: addressData.lastName,
        address1: addressData.address, // Map 'address' to 'address1'
        city: addressData.city,
        postalCode: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        isDefault: addressData.isDefault || false,
        createdAt: new Date()
      }).returning();

      // Map address1 back to address for frontend compatibility
      return {
        ...address,
        address: address.address1,
      };
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  async updateAddress(
    id: number,
    updates: Partial<InsertAddress>,
  ): Promise<Address | undefined> {
    // Map 'address' field to 'address1' if it exists in updates
    const mappedUpdates: any = { ...updates };
    if ('address' in mappedUpdates) {
      mappedUpdates.address1 = mappedUpdates.address;
      delete mappedUpdates.address;
    }

    const [address] = await db
      .update(addresses)
      .set(mappedUpdates)
      .where(eq(addresses.id, id))
      .returning();

    if (address) {
      // Map address1 back to address for frontend compatibility
      return {
        ...address,
        address: address.address1,
      };
    }
    return undefined;
  }

  async deleteAddress(id: number): Promise<boolean> {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return result.rowCount > 0;
  }

  // Coupons
  async getCoupon(id: number): Promise<Coupon | undefined> {
    try {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.id, id));
      return coupon || undefined;
    } catch (error) {
      console.error("Error getting coupon:", error);
      throw error;
    }
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    try {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, code.toUpperCase()));
      return coupon || undefined;
    } catch (error) {
      console.error("Error getting coupon by code:", error);
      throw error;
    }
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getAllCouponsWithFilters(params: {
    search?: string;
    status?: string;
    discountType?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}): Promise<{ coupons: Coupon[]; total: number }> {
    const {
      search,
      status,
      discountType,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    let conditions: any[] = [];

    // Search filter - search in code and description
    if (search) {
      conditions.push(
        or(
          ilike(coupons.code, `%${search}%`),
          ilike(coupons.description, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        conditions.push(eq(coupons.isActive, true));
      } else if (status === 'inactive') {
        conditions.push(eq(coupons.isActive, false));
      } else if (status === 'percentage') {
        conditions.push(eq(coupons.discountType, 'percentage'));
      } else if (status === 'fixed') {
        conditions.push(eq(coupons.discountType, 'fixed'));
      }
    }

    // Discount type filter
    if (discountType && discountType !== 'all') {
      conditions.push(eq(coupons.discountType, discountType));
    }

    // Build the base query
    let query = db.select().from(coupons);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(coupons);

    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    // Apply sorting
    let orderBy;
    if (sortBy === 'code') {
      orderBy = sortOrder === 'asc' ? asc(coupons.code) : desc(coupons.code);
    } else if (sortBy === 'discountValue') {
      orderBy = sortOrder === 'asc' ? asc(coupons.discountValue) : desc(coupons.discountValue);
    } else if (sortBy === 'discountType') {
      orderBy = sortOrder === 'asc' ? asc(coupons.discountType) : desc(coupons.discountType);
    } else if (sortBy === 'isActive') {
      orderBy = sortOrder === 'asc' ? asc(coupons.isActive) : desc(coupons.isActive);
    } else if (sortBy === 'expiresAt') {
      orderBy = sortOrder === 'asc' ? asc(coupons.expiresAt) : desc(coupons.expiresAt);
    } else {
      // Default to createdAt
      orderBy = sortOrder === 'asc' ? asc(coupons.createdAt) : desc(coupons.createdAt);
    }

    // Apply pagination and ordering
    const couponsResult = await query
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      coupons: couponsResult,
      total
    };
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values(coupon).returning();
    return newCoupon;
  }

  async updateCoupon(
    id: number,
    updates: Partial<InsertCoupon>,
  ): Promise<Coupon | undefined> {
    const [coupon] = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, id))
      .returning();
    return coupon || undefined;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id));
    return result.rowCount > 0;
  }

  // Analytics
  async getAnalytics(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    recentOrders: Order[];
    completedOrders: number;
    pendingOrders: number;
    dailySales: Array<{ date: string; sales: number; orders: number }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    paymentMethodStats: Array<{ method: string; count: number }>;
  }> {
    try {
      // Only count sales from delivered orders with approved/paid payment status
      const completedOrdersCondition = and(
        eq(orders.status, "delivered"),
        or(eq(orders.paymentStatus, "approved"), eq(orders.paymentStatus, "paid"))
      );

      const [
        salesResult, 
        ordersResult, 
        usersResult, 
        productsResult, 
        recentOrders,
        completedOrdersResult,
        pendingOrdersResult,
        orderStatusStats,
        paymentMethodStats,
        last7DaysOrders
      ] = await Promise.all([
        // Total sales from completed orders only
        db.select({ totalSales: sum(orders.totalAmount) }).from(orders).where(completedOrdersCondition),
        db.select({ totalOrders: count() }).from(orders),
        db.select({ totalUsers: count() }).from(users),
        db.select({ totalProducts: count() }).from(products),
        db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10),
        // Completed orders count
        db.select({ count: count() }).from(orders).where(completedOrdersCondition),
        // Pending orders count
        db.select({ count: count() }).from(orders).where(eq(orders.status, "pending")),
        // Order status distribution
        db.select({ 
          status: orders.status, 
          count: count() 
        }).from(orders).groupBy(orders.status),
        // Payment method distribution
        db.select({ 
          method: orders.paymentMethod, 
          count: count() 
        }).from(orders).groupBy(orders.paymentMethod),
        // Last 7 days orders for daily sales chart
        db.select({
          createdAt: orders.createdAt,
          totalAmount: orders.totalAmount,
          status: orders.status,
          paymentStatus: orders.paymentStatus
        }).from(orders).where(
          and(
            eq(orders.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        ).orderBy(desc(orders.createdAt))
      ]);

      // Process daily sales data
      const dailySalesMap = new Map<string, { sales: number; orders: number }>();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      // Initialize all days with 0
      last7Days.forEach(date => {
        dailySalesMap.set(date, { sales: 0, orders: 0 });
      });

      // Get all orders from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentOrdersForChart = await db.select({
        createdAt: orders.createdAt,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus
      }).from(orders).where(
        and(
          eq(orders.createdAt, sevenDaysAgo)
        )
      );

      // Process orders for daily sales
      recentOrdersForChart.forEach(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (dailySalesMap.has(orderDate)) {
          const dayData = dailySalesMap.get(orderDate)!;
          dayData.orders += 1;

          // Only count sales from completed orders
          if (order.status === "delivered" && 
              (order.paymentStatus === "approved" || order.paymentStatus === "paid")) {
            dayData.sales += Number(order.totalAmount);
          }
        }
      });

      const dailySales = last7Days.map(date => {
        const dayData = dailySalesMap.get(date) || { sales: 0, orders: 0 };
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: dayData.sales,
          orders: dayData.orders
        };
      });

      return {
        totalSales: Number(salesResult[0]?.totalSales) || 0,
        totalOrders: ordersResult[0]?.totalOrders || 0,
        totalUsers: usersResult[0]?.totalUsers || 0,
        totalProducts: productsResult[0]?.totalProducts || 0,
        recentOrders: recentOrders || [],
        completedOrders: completedOrdersResult[0]?.count || 0,
        pendingOrders: pendingOrdersResult[0]?.count || 0,
        dailySales,
        ordersByStatus: orderStatusStats.map(stat => ({
          status: stat.status,
          count: stat.count
        })),
        paymentMethodStats: paymentMethodStats.map(stat => ({
          method: stat.method,
          count: stat.count
        }))
      };
    } catch (error) {
      console.error("Error getting analytics:", error);
      throw error;
    }
  }

  // Payment Settings
  async getPaymentSettings(): Promise<PaymentSetting[]> {
    return await db.select().from(paymentSettings).where(eq(paymentSettings.isActive, true));
  }

  async getAllPaymentSettings(): Promise<PaymentSetting[]> {
    return await db.select().from(paymentSettings);
  }

  async createPaymentSetting(setting: InsertPaymentSetting): Promise<PaymentSetting> {
    const [newSetting] = await db.insert(paymentSettings).values(setting).returning();
    return newSetting;
  }

  async updatePaymentSetting(
    id: number,
    updates: Partial<InsertPaymentSetting>,
  ): Promise<PaymentSetting | undefined> {
    const [setting] = await db
      .update(paymentSettings)
      .set(updates)
      .where(eq(paymentSettings.id, id))
      .returning();
    return setting || undefined;
  }

  async deletePaymentSetting(id: number): Promise<boolean> {
    const result = await db.delete(paymentSettings).where(eq(paymentSettings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Flash Sales
  async getActiveFlashSales(): Promise<(FlashSale & { product: Product })[]> {
    try {
      const now = new Date();
      console.log('Fetching flash sales at:', now);

      // Use raw SQL for now to debug the issue
      const result = await pool.query(`
        SELECT 
          fs.id, fs.product_id, fs.discount_percentage, fs.start_time, fs.end_time, fs.is_active, fs.created_at,
          p.id as product_id, p.name, p.slug, p.description, p.price, p.sale_price, p.images, p.category_id, p.rating, p.review_count, p.product_type
        FROM flash_sales fs
        INNER JOIN products p ON fs.product_id = p.id
        WHERE fs.is_active = true 
          AND fs.start_time <= NOW() 
          AND fs.end_time >= NOW()
      `);

      console.log('Flash sales query result:', result.rows.length, 'items');

      return result.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        discountPercentage: row.discount_percentage,
        startTime: row.start_time,
        endTime: row.end_time,
        isActive: row.is_active,
        createdAt: row.created_at,
        discount: row.discount_percentage,
        product: {
          id: row.product_id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          price: row.price,
          salePrice: row.sale_price,
          images: row.images || [],
          imageUrl: (row.images && Array.isArray(row.images) && row.images.length > 0) 
            ? row.images[0] 
            : '/api/placeholder/300/300',
          categoryId: row.category_id,
          rating: row.rating,
          reviewCount: row.review_count,
          productType: row.product_type
        }
      }));
    } catch (error) {
      console.error('Error getting active flash sales:', error);
      return [];
    }
  }

  async getFlashSale(id: number): Promise<FlashSale | undefined> {
    const [flashSale] = await db.select().from(flashSales).where(eq(flashSales.id, id));
    return flashSale || undefined;
  }

  async getAllFlashSales(): Promise<FlashSale[]> {
    return await db.select().from(flashSales).orderBy(desc(flashSales.createdAt));
  }

  async createFlashSale(flashSale: InsertFlashSale): Promise<FlashSale> {
    const [newFlashSale] = await db.insert(flashSales).values(flashSale).returning();
    return newFlashSale;
  }

  async updateFlashSale(
    id: number,
    updates: Partial<InsertFlashSale>,
  ): Promise<FlashSale | undefined> {
    const [flashSale] = await db
      .update(flashSales)
      .set(updates)
      .where(eq(flashSales.id, id))
      .returning();
    return flashSale || undefined;
  }

  async deleteFlashSale(id: number): Promise<boolean> {
    const result = await db.delete(flashSales).where(eq(flashSales.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getFlashSaleProducts(): Promise<Product[]> {
    try {
      const flashSaleProductsData = await db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.productType, 'flash_sale'),
            eq(products.isActive, true)
          )
        )
        .orderBy(desc(products.createdAt));

      return flashSaleProductsData.map(({ products: product, categories: category }) => ({
        ...product,
        images: product.images as string[] || [],
        imageUrl: (product.images as string[])?.[0] || '/api/placeholder/300/300',
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug
        } : null
      }));
    } catch (error) {
      console.error('Error getting flash sale products:', error);
      return [];
    }
  }

  // Banners
  async getActiveBanners(): Promise<Banner[]> {
    return await db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(asc(banners.position));
  }

  async getAllBanners(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(asc(banners.position));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [newBanner] = await db.insert(banners).values(banner).returning();
    return newBanner;
  }

  async updateBanner(
    id: number,
    updates: Partial<InsertBanner>,
  ): Promise<Banner | undefined> {
    const [banner] = await db
      .update(banners)
      .set(updates)
      .where(eq(banners.id, id))
      .returning();
    return banner || undefined;
  }

  async deleteBanner(id: number): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Notifications
  async getUserNotifications(userId: number): Promise<Notification[]> {
    try {
      return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    return (result.rowCount || 0) > 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Order Items
  async getOrderItems(
    orderId: number,
  ): Promise<(OrderItem & { product: Product })[]> {
    const result = await db
      .select()
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return result.map((row) => ({
      ...row.order_items,
      product: row.products,
    }));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(asc(systemSettings.label));
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [newSetting] = await db.insert(systemSettings).values(setting).returning();
    return newSetting;
  }

  async updateSystemSetting(
    id: number,
    updates: Partial<InsertSystemSetting>,
  ): Promise<SystemSetting | undefined> {
    const [updated] = await db
      .update(systemSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemSettings.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSystemSetting(id: number): Promise<boolean> {
    const result = await db.delete(systemSettings).where(eq(systemSettings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Editor Settings
  async getEditorSettings(): Promise<EditorSetting | undefined> {
    const [settings] = await db.select().from(editorSettings).limit(1);
    return settings || undefined;
  }

  async createEditorSettings(settings: InsertEditorSetting): Promise<EditorSetting> {
    const [newSettings] = await db.insert(editorSettings).values(settings).returning();
    return newSettings;
  }

  async updateEditorSettings(
    id: number,
    updates: Partial<InsertEditorSetting>,
  ): Promise<EditorSetting | undefined> {
    const [updated] = await db
      .update(editorSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(editorSettings.id, id))
      .returning();
    return updated || undefined;
  }

  // Product Type System
  async getProductsByType(productType: string, limit?: number): Promise<Product[]> {
    try {
      let query = db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.productType, productType),
            eq(products.isActive, true)
          )
        )
        .orderBy(desc(products.createdAt));

      if (limit) {
        query = query.limit(limit);
      }

      const productsData = await query;

      return productsData.map(({ products: product, categories: category }) => ({
        ...product,
        images: product.images as string[] || [],
        imageUrl: (product.images as string[])?.[0] || '/api/placeholder/300/300',
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug
        } : null
      }));
    } catch (error) {
      console.error(`Error getting ${productType} products:`, error);
      return [];
    }
  }

  async getSearchSettings(): Promise<{ [key: string]: boolean }> {
    try {
      const searchSettingsData = await db
        .select()
        .from(systemSettings)
        .where(
          and(
            like(systemSettings.key, 'search_%'),
            eq(systemSettings.isActive, true)
          )
        );

      const settings: { [key: string]: boolean } = {};
      searchSettingsData.forEach(setting => {
        settings[setting.key] = setting.value === 'true';
      });

      return settings;
    } catch (error) {
      console.error('Error getting search settings:', error);
      // Default settings - allow simple products only
      return {
        search_include_simple: true,
        search_include_featured: false,
        search_include_new_arrivals: false,
        search_include_flash_sale: false
      };
    }
  }

  async getProductsForSearch(query: string, searchSettings: { [key: string]: boolean }): Promise<{ products: Product[]; total: number }> {
    try {
      // Build allowed product types based on search settings
      const allowedTypes: string[] = [];
      if (searchSettings.search_include_simple) allowedTypes.push('simple');
      if (searchSettings.search_include_featured) allowedTypes.push('featured');
      if (searchSettings.search_include_new_arrivals) allowedTypes.push('new_arrivals');
      if (searchSettings.search_include_flash_sale) allowedTypes.push('flash_sale');

      // If no types are allowed, return empty result
      if (allowedTypes.length === 0) {
        return { products: [], total: 0 };
      }

      const productsData = await db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            inArray(products.productType, allowedTypes),
            eq(products.isActive, true),
            or(
              ilike(products.name, `%${query}%`),
              ilike(products.description, `%${query}%`),
              ilike(products.shortDescription, `%${query}%`)
            )
          )
        )
        .limit(20)
        .orderBy(desc(products.createdAt));

      const formattedProducts = productsData.map(({ products: product, categories: category }) => ({
        ...product,
        images: product.images as string[] || [],
        imageUrl: (product.images as string[])?.[0] || '/api/placeholder/300/300',
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug
        } : null
      }));

      return { products: formattedProducts, total: formattedProducts.length };
    } catch (error) {
      console.error('Error searching products:', error);
      return { products: [], total: 0 };
    }
  }

  // Database export methods
  async getAllUsersForExport(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.id));
  }

  async getAllCategoriesForExport(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.id));
  }

  async getAllProductsForExport(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.id));
  }

  async getAllCartItemsForExport(): Promise<CartItem[]> {
    return await db.select().from(cartItems).orderBy(asc(cartItems.id));
  }

  async getAllWishlistItemsForExport(): Promise<WishlistItem[]> {
    return await db.select().from(wishlistItems).orderBy(asc(wishlistItems.id));
  }

  async getAllOrdersForExport(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(asc(orders.id));
  }

  async getAllOrderItemsForExport(): Promise<OrderItem[]> {
    return await db.select().from(orderItems).orderBy(asc(orderItems.id));
  }

  async getAllReviewsForExport(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(asc(reviews.id));
  }

  async getAllAddressesForExport(): Promise<Address[]> {
    return await db.select().from(addresses).orderBy(asc(addresses.id));
  }

  async getAllCouponsForExport(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(asc(coupons.id));
  }

  async getAllPaymentSettingsForExport(): Promise<PaymentSetting[]> {
    return await db.select().from(paymentSettings).orderBy(asc(paymentSettings.id));
  }

  async getAllSystemSettingsForExport(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(asc(systemSettings.id));
  }

  async getAllFlashSalesForExport(): Promise<FlashSale[]> {
    return await db.select().from(flashSales).orderBy(asc(flashSales.id));
  }

  async getAllBannersForExport(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(asc(banners.id));
  }

  async getAllNotificationsForExport(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(asc(notifications.id));
  }

  // Database import methods
  async clearAllData(): Promise<void> {
    // Delete in reverse dependency order to avoid foreign key constraint violations
    await db.delete(notifications);
    await db.delete(banners);
    await db.delete(flashSales);
    await db.delete(addresses);
    await db.delete(reviews);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(wishlistItems);
    await db.delete(cartItems);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(coupons);
    await db.delete(paymentSettings);
    await db.delete(systemSettings);
    await db.delete(users);
  }

  async importUsers(usersData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const userData of usersData) {
      try {
        // Remove id and timestamps for insert
        const { id, createdAt, updatedAt, ...insertData } = userData;
        
        // Check if user with same username or email already exists
        const existingUser = await db.select().from(users)
          .where(or(
            eq(users.username, insertData.username),
            eq(users.email, insertData.email)
          )).limit(1);
        
        if (existingUser.length > 0) {
          console.warn(`Skipping user: username '${insertData.username}' or email '${insertData.email}' already exists`);
          skipped++;
          continue;
        }
        
        await db.insert(users).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing user:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importCategories(categoriesData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const categoryData of categoriesData) {
      try {
        const { id, createdAt, ...insertData } = categoryData;
        await db.insert(categories).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing category:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importProducts(productsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const productData of productsData) {
      try {
        const { id, createdAt, updatedAt, ...insertData } = productData;
        
        // Validate foreign key references and map category IDs
        if (insertData.categoryId) {
          // Try to find category by ID first
          let categoryExists = await db.select().from(categories).where(eq(categories.id, insertData.categoryId)).limit(1);
          
          if (categoryExists.length === 0) {
            // If not found by ID, try to map to existing categories by finding the first available category
            const availableCategories = await db.select().from(categories).limit(5);
            if (availableCategories.length > 0) {
              // Map old category ID to first available category
              const oldCategoryId = insertData.categoryId;
              insertData.categoryId = availableCategories[0].id;
              console.warn(`Mapping product from category ${oldCategoryId} to available category ${availableCategories[0].id} (${availableCategories[0].name})`);
            } else {
              console.warn(`Skipping product: no categories available for mapping`);
              skipped++;
              continue;
            }
          }
        }
        
        // Validate required fields and fix data types
        if (!insertData.name || !insertData.price) {
          console.warn('Skipping product: missing required fields (name or price)');
          skipped++;
          continue;
        }
        
        // Ensure price and stock are numbers
        if (insertData.price) {
          insertData.price = Number(insertData.price);
        }
        if (insertData.stock) {
          insertData.stock = Number(insertData.stock);
        }
        
        // Convert rating to decimal if needed
        if (insertData.rating) {
          insertData.rating = Number(insertData.rating);
        }
        
        await db.insert(products).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing product:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importCartItems(cartItemsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const cartItemData of cartItemsData) {
      try {
        const { id, createdAt, ...insertData } = cartItemData;
        
        // Validate foreign key references
        if (insertData.userId) {
          const userExists = await db.select().from(users).where(eq(users.id, insertData.userId)).limit(1);
          if (userExists.length === 0) {
            console.warn(`Skipping cart item: user ${insertData.userId} not found`);
            skipped++;
            continue;
          }
        }
        
        if (insertData.productId) {
          const productExists = await db.select().from(products).where(eq(products.id, insertData.productId)).limit(1);
          if (productExists.length === 0) {
            console.warn(`Skipping cart item: product ${insertData.productId} not found`);
            skipped++;
            continue;
          }
        }
        
        // Ensure quantity is a number
        if (insertData.quantity) {
          insertData.quantity = Number(insertData.quantity);
        }
        
        await db.insert(cartItems).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing cart item:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importWishlistItems(wishlistItemsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const wishlistItemData of wishlistItemsData) {
      try {
        const { id, createdAt, ...insertData } = wishlistItemData;
        
        // Validate foreign key references
        if (insertData.userId) {
          const userExists = await db.select().from(users).where(eq(users.id, insertData.userId)).limit(1);
          if (userExists.length === 0) {
            console.warn(`Skipping wishlist item: user ${insertData.userId} not found`);
            skipped++;
            continue;
          }
        }
        
        if (insertData.productId) {
          const productExists = await db.select().from(products).where(eq(products.id, insertData.productId)).limit(1);
          if (productExists.length === 0) {
            console.warn(`Skipping wishlist item: product ${insertData.productId} not found`);
            skipped++;
            continue;
          }
        }
        
        await db.insert(wishlistItems).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing wishlist item:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importOrders(ordersData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const orderData of ordersData) {
      try {
        const { id, createdAt, updatedAt, ...insertData } = orderData;
        await db.insert(orders).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing order:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importOrderItems(orderItemsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const orderItemData of orderItemsData) {
      try {
        const { id, createdAt, ...insertData } = orderItemData;
        
        // Validate foreign key references
        if (insertData.orderId) {
          const orderExists = await db.select().from(orders).where(eq(orders.id, insertData.orderId)).limit(1);
          if (orderExists.length === 0) {
            console.warn(`Skipping order item: order ${insertData.orderId} not found`);
            skipped++;
            continue;
          }
        }
        
        if (insertData.productId) {
          const productExists = await db.select().from(products).where(eq(products.id, insertData.productId)).limit(1);
          if (productExists.length === 0) {
            console.warn(`Skipping order item: product ${insertData.productId} not found`);
            skipped++;
            continue;
          }
        }
        
        await db.insert(orderItems).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing order item:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importReviews(reviewsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const reviewData of reviewsData) {
      try {
        const { id, createdAt, ...insertData } = reviewData;
        
        // Validate foreign key references
        if (insertData.userId) {
          const userExists = await db.select().from(users).where(eq(users.id, insertData.userId)).limit(1);
          if (userExists.length === 0) {
            console.warn(`Skipping review: user ${insertData.userId} not found`);
            skipped++;
            continue;
          }
        }
        
        if (insertData.productId) {
          const productExists = await db.select().from(products).where(eq(products.id, insertData.productId)).limit(1);
          if (productExists.length === 0) {
            console.warn(`Skipping review: product ${insertData.productId} not found`);
            skipped++;
            continue;
          }
        }
        
        await db.insert(reviews).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing review:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importAddresses(addressesData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const addressData of addressesData) {
      try {
        const { id, createdAt, ...insertData } = addressData;
        await db.insert(addresses).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing address:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importCoupons(couponsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const couponData of couponsData) {
      try {
        const { id, createdAt, ...insertData } = couponData;
        
        // Debug: Log the coupon data structure (remove after fixing)
        // console.log('Processing coupon data:', JSON.stringify(insertData, null, 2));
        
        // Handle date fields properly - convert strings to Date objects or set to null if invalid
        const dateFields = ['expiryDate', 'startDate', 'expiresAt'];
        for (const field of dateFields) {
          if (insertData[field] !== undefined && insertData[field] !== null) {
            if (typeof insertData[field] === 'string') {
              const date = new Date(insertData[field]);
              insertData[field] = isNaN(date.getTime()) ? null : date;
            } else if (typeof insertData[field] === 'object' && !insertData[field].toISOString) {
              // Handle invalid date objects
              insertData[field] = null;
            }
          }
        }
        
        // Validate required fields
        if (!insertData.code || !insertData.discountType) {
          console.warn('Skipping coupon: missing required fields (code or discountType)');
          skipped++;
          continue;
        }
        
        // Map field names from export format to database format
        if (insertData.minimumAmount !== undefined) {
          insertData.minOrderAmount = Number(insertData.minimumAmount);
          delete insertData.minimumAmount;
        }
        if (insertData.usedCount !== undefined) {
          insertData.usageCount = Number(insertData.usedCount);
          delete insertData.usedCount;
        }
        if (insertData.expiresAt !== undefined) {
          insertData.expiryDate = insertData.expiresAt;
          delete insertData.expiresAt;
        }
        
        // Ensure numeric fields are proper numbers
        if (insertData.discountValue) {
          insertData.discountValue = Number(insertData.discountValue);
        }
        if (insertData.minOrderAmount) {
          insertData.minOrderAmount = Number(insertData.minOrderAmount);
        }
        if (insertData.usageLimit) {
          insertData.usageLimit = Number(insertData.usageLimit);
        }
        if (insertData.usageCount) {
          insertData.usageCount = Number(insertData.usageCount);
        }
        
        await db.insert(coupons).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing coupon:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importPaymentSettings(paymentSettingsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const paymentSettingData of paymentSettingsData) {
      try {
        const { id, createdAt, updatedAt, ...insertData } = paymentSettingData;
        await db.insert(paymentSettings).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing payment setting:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importSystemSettings(systemSettingsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const systemSettingData of systemSettingsData) {
      try {
        const { id, createdAt, updatedAt, ...insertData } = systemSettingData;
        await db.insert(systemSettings).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing system setting:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importFlashSales(flashSalesData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const flashSaleData of flashSalesData) {
      try {
        const { id, createdAt, ...insertData } = flashSaleData;
        await db.insert(flashSales).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing flash sale:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importBanners(bannersData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const bannerData of bannersData) {
      try {
        const { id, createdAt, ...insertData } = bannerData;
        await db.insert(banners).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing banner:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importNotifications(notificationsData: any[]): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    for (const notificationData of notificationsData) {
      try {
        const { id, createdAt, updatedAt, ...insertData } = notificationData;
        await db.insert(notifications).values(insertData);
        imported++;
      } catch (error) {
        console.error('Error importing notification:', error);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  // Clear all data from database (DANGEROUS - use only for admin database reset)
  async clearAllData(): Promise<void> {
    try {
      // Delete in reverse dependency order to avoid foreign key constraints
      await db.delete(notifications);
      await db.delete(banners);
      await db.delete(flashSales);
      await db.delete(systemSettings);
      await db.delete(paymentSettings);
      await db.delete(addresses);
      await db.delete(reviews);
      await db.delete(orderItems);
      await db.delete(orders);
      await db.delete(coupons);
      await db.delete(wishlistItems);
      await db.delete(cartItems);
      await db.delete(products);
      await db.delete(categories);
      
      // Delete users last but preserve admin user
      await db.delete(users).where(ne(users.role, 'admin'));
      
      console.log('All database data cleared successfully');
    } catch (error) {
      console.error('Error clearing database data:', error);
      throw error;
    }
  }

  // Implementation of missing methods
  async getPublicSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).where(eq(systemSettings.isPublic, true));
  }

  async searchProducts(query: string, options: any = {}): Promise<{ products: Product[]; total: number }> {
    const { limit = 20, offset = 0, categoryId, minPrice, maxPrice, inStock } = options;
    
    let conditions: any[] = [eq(products.isActive, true)];
    
    if (query) {
      conditions.push(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.description, `%${query}%`),
          ilike(products.shortDescription, `%${query}%`)
        )
      );
    }
    
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    if (minPrice) {
      conditions.push(gte(products.price, minPrice));
    }
    
    if (maxPrice) {
      conditions.push(lte(products.price, maxPrice));
    }
    
    if (inStock) {
      conditions.push(gt(products.stock, 0));
    }

    let baseQuery = db.select().from(products);
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    const [productsResult, totalCount] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      db.select({ count: count() }).from(products).where(and(...conditions))
    ]);

    return {
      products: productsResult,
      total: totalCount[0]?.count || 0
    };
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    
    const result = await db
      .select({ name: products.name })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          ilike(products.name, `%${query}%`)
        )
      )
      .limit(10);
    
    return result.map(p => p.name);
  }

  async getCartCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
    return result[0]?.count || 0;
  }

  async getCartItem(userId: number, productId: number): Promise<CartItem | undefined> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        )
      );
    return item;
  }

  async getWishlistCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId));
    return result[0]?.count || 0;
  }

  async getWishlistItem(userId: number, productId: number): Promise<WishlistItem | undefined> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.productId, productId)
        )
      );
    return item;
  }

  async getUserAddress(userId: number, addressId: number): Promise<Address | undefined> {
    const [address] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.userId, userId),
          eq(addresses.id, addressId)
        )
      );
    return address;
  }

  async updateOrderPaymentStatus(orderId: number, paymentStatus: string, paymentProof?: string): Promise<Order | undefined> {
    const updateData: any = { paymentStatus };
    if (paymentProof) {
      updateData.paymentProof = paymentProof;
    }
    
    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }
}

export const storage = new DatabaseStorage();