import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePriceFormatter } from "@/lib/currency";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { type PaymentSetting, type InsertPaymentSetting, type EditorSetting, type InsertEditorSetting } from "@shared/schema";
import {
  MoreVertical,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Calendar as CalendarIcon,
  Star,
  Heart,
  MessageSquare,
  Share2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Zap,
  Target,
  UserPlus,
  ShoppingBag,
  Truck,
  Gift,
  Tag,
  Percent,
  Globe,
  Smartphone,
  Laptop,
  Headphones,
  Camera,
  Watch,
  Gamepad2,
  Book,
  Home,
  Car,
  Shirt,
  Baby,
  Dumbbell,
  LogOut,
  Check,
  X,
  Menu,
  RefreshCw,
  Save,
  Shield,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { UsersTableEnhanced } from "@/components/users-table-enhanced";
import { Checkbox } from "@/components/ui/checkbox";
import { EncryptionSettings } from "@/components/admin/encryption-settings";


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoriesTableEnhanced } from "@/components/categories-table-enhanced";

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  stock: number;
  images?: string[];
  featured: boolean;
}

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentProof?: string;
  rejectionReason?: string;
  adminNotes?: string;
  shippingAddress: any;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  items?: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: string;
    product: {
      name: string;
      images: string[];
    };
  }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
}

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: string;
  description?: string;
  isActive: boolean;
  minimumAmount?: string;
  usageLimit?: number;
  usedCount?: number;
  expiresAt?: string;
  createdAt: string;
}



interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Order[];
  dailySales?: Array<{ date: string; sales: number; orders: number }>;
  categoryStats?: Array<{ name: string; value: number; color: string }>;
  monthlyGrowth?: { sales: number; users: number; orders: number };
  completedOrders: number;
  pendingOrders: number;
  ordersByStatus?: Array<{ status: string; count: number }>;
}

const sidebarItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "users", label: "Users", icon: Users },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "coupons", label: "Coupons", icon: FileText },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "payments", label: "Payment Settings", icon: CreditCard },
  { id: "encryption", label: "Encryption Control", icon: Shield },
  { id: "editor", label: "Editor", icon: Edit },
  { id: "settings", label: "Settings", icon: Settings },
];

// Function to determine status color for charts
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "yellow";
    case "processing":
      return "blue";
    case "shipped":
      return "purple";
    case "delivered":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
};

// DateTimePicker component for calendar inputs
interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = "Pick a date",
  id,
  required
}) => {
  const [date, setDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [timeString, setTimeString] = useState<string>(
    value ? new Date(value).toTimeString().slice(0, 5) : "12:00"
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const [hours, minutes] = timeString.split(':');
      selectedDate.setHours(parseInt(hours), parseInt(minutes));
      const isoString = selectedDate.toISOString().slice(0, 16);
      onChange(isoString);
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeString(time);
    if (date) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      const isoString = newDate.toISOString().slice(0, 16);
      onChange(isoString);
    }
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={`w-full justify-start text-left font-normal ${
              !date ? "text-muted-foreground" : ""
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {date ? format(date, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="p-3 border-t">
            <Label htmlFor="time-input" className="text-sm font-medium">
              Time
            </Label>
            <Input
              id="time-input"
              type="time"
              value={timeString}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="mt-1"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default function AdminCompleteEnhanced() {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Set document title
  useDocumentTitle("Admin Dashboard");
  const [productFilters, setProductFilters] = useState({
    category: "",
    status: "all",
    priceMin: "",
    priceMax: "",
    stock: "all",
    featured: "all",
    color: "",
    brand: "",
  });
  const [showProductFilters, setShowProductFilters] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Order detail states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewOrderDialog, setViewOrderDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Bulk operations states for orders
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showOrderCheckboxes, setShowOrderCheckboxes] = useState(false);

  // Search settings state
  const [searchSettings, setSearchSettings] = useState<{ [key: string]: boolean }>({
    search_include_simple: true,
    search_include_featured: true,
    search_include_new_arrivals: true,
    search_include_flash_sale: true,
  });
  const [searchSettingsUpdating, setSearchSettingsUpdating] = useState(false);

  // Editor settings local state
  const [editorFormData, setEditorFormData] = useState({
    footerEmail: "",
    footerPhone: "",
    footerAddress: "",
    facebookLink: "",
    twitterLink: "",
    instagramLink: "",
    linkedinLink: "",
  });

  // Search settings functions
  const handleSearchSettingChange = (key: string, checked: boolean | "indeterminate") => {
    setSearchSettings(prev => ({
      ...prev,
      [key]: checked === true
    }));
  };

  const saveSearchSettings = async () => {
    setSearchSettingsUpdating(true);
    try {
      const response = await fetch('/api/search-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save search settings');
      }

      toast({
        title: "Success",
        description: "Search settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving search settings:', error);
      toast({
        title: "Error",
        description: "Failed to save search settings",
        variant: "destructive",
      });
    } finally {
      setSearchSettingsUpdating(false);
    }
  };

  // Load search settings on component mount
  React.useEffect(() => {
    const loadSearchSettings = async () => {
      try {
        const response = await fetch('/api/search-settings');
        if (response.ok) {
          const settings = await response.json();
          setSearchSettings(settings);
        }
      } catch (error) {
        console.error('Error loading search settings:', error);
      }
    };
    
    loadSearchSettings();
  }, []);

  // Editor Settings queries and mutations
  const {
    data: editorSettings,
    isLoading: editorSettingsLoading,
    refetch: refetchEditorSettings,
  } = useQuery({
    queryKey: ["/api/editor-settings"],
    refetchInterval: 30000,
  });

  const updateEditorSettings = useMutation({
    mutationFn: async (data: any) => {
      const settings = editorSettings;
      if (settings?.id) {
        return apiRequest(`/api/editor-settings/${settings.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest("/api/editor-settings", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor-settings"] });
      toast({
        title: "Settings Updated",
        description: "Editor settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update editor settings",
        variant: "destructive",
      });
    },
  });

  // Update form data when editor settings are loaded
  useEffect(() => {
    if (editorSettings) {
      setEditorFormData({
        footerEmail: editorSettings.footerEmail || "",
        footerPhone: editorSettings.footerPhone || "",
        footerAddress: editorSettings.footerAddress || "",
        facebookLink: editorSettings.facebookLink || "",
        twitterLink: editorSettings.twitterLink || "",
        instagramLink: editorSettings.instagramLink || "",
        linkedinLink: editorSettings.linkedinLink || "",
      });
    }
  }, [editorSettings]);

  // Hide order checkboxes when no items are selected
  React.useEffect(() => {
    if (selectedOrders.length === 0 && showOrderCheckboxes) {
      setShowOrderCheckboxes(false);
    }
  }, [selectedOrders.length, showOrderCheckboxes]);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<"delete" | "status" | "payment">(
    "delete",
  );
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [bulkPaymentValue, setBulkPaymentValue] = useState("");

  // Bulk operations states for products
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showProductCheckboxes, setShowProductCheckboxes] = useState(false);

  // Hide product checkboxes when no items are selected
  React.useEffect(() => {
    if (selectedProducts.length === 0 && showProductCheckboxes) {
      setShowProductCheckboxes(false);
    }
  }, [selectedProducts.length, showProductCheckboxes]);
  const [productBulkActionDialog, setProductBulkActionDialog] = useState(false);
  const [productBulkAction, setProductBulkAction] = useState<
    "delete" | "featured" | "active"
  >("delete");
  const [selectAllProducts, setSelectAllProducts] = useState(false);

  // Payment settings states
  const [editingPayment, setEditingPayment] = useState<PaymentSetting | null>(
    null,
  );
  const [paymentDialog, setPaymentDialog] = useState(false);

  // System settings states
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(
    null,
  );
  const [settingDialog, setSettingDialog] = useState(false);

  // Review management states
  const [reviewsCurrentPage, setReviewsCurrentPage] = useState(1);
  const [reviewsItemsPerPage, setReviewsItemsPerPage] = useState(20);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewsSearchTerm, setReviewsSearchTerm] = useState("");
  const [debouncedReviewsSearchTerm, setDebouncedReviewsSearchTerm] = useState("");
  const [reviewsFilters, setReviewsFilters] = useState({
    status: "all",
    rating: "all",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Enhanced product form state
  const [productForm, setProductForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    price: "",
    originalPrice: "",
    salePrice: "",
    discountPercentage: "",
    categoryId: "",
    stock: "",
    sku: "",
    weight: "",
    dimensions: "",
    material: "",
    brand: "",
    color: "",
    size: "",
    tags: "",
    productType: "simple", // New product type field
    flashSaleDiscount: "",
    flashSaleStartDate: "",
    flashSaleEndDate: "",
    // Removed legacy featured field - now using productType
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    images: [] as File[],
  });

  // Track existing product images separately from new file uploads
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);

  // Pagination and filtering state for products
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage] = useState(20);
  const [productsHasMore, setProductsHasMore] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Pagination and filtering state for orders
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage] = useState(20);
  const [ordersHasMore, setOrdersHasMore] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [ordersSearchTerm, setOrdersSearchTerm] = useState("");
  const [debouncedOrdersSearchTerm, setDebouncedOrdersSearchTerm] =
    useState("");
  const [showOrdersFilters, setShowOrdersFilters] = useState(false);
  const [ordersFilters, setOrdersFilters] = useState({
    status: "all",
    paymentStatus: "all",
    paymentMethod: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Enhanced category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    slug: "",
    image: null as File | null,
    metaTitle: "",
    metaDescription: "",
    isActive: true,
    sortOrder: 0,
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    description: "",
    minimumAmount: "",
    usageLimit: "",
    expiresAt: "",
    applyToShipping: false,
    applyToTax: false,
    isActive: true,
  });
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState<number[]>([]);
  const [showCouponCheckboxes, setShowCouponCheckboxes] = useState(false);
  
  // Real-time updates state
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<string, Date>>({});

  // Comprehensive real-time update function for all sections
  const performRealTimeUpdate = async (section: string, message: string) => {
    setUpdateMessage(`${message} - refreshing data...`);
    setShowUpdateNotification(true);
    
    // Define all query keys that need to be updated
    const allQueryKeys = [
      ["/api/users"],
      ["/api/admin/users"],
      ["/api/orders"],
      ["/api/products"],
      ["/api/categories"],
      ["/api/admin/coupons"],
      ["/api/admin/reviews"],
      ["/api/analytics"],
      ["/api/payment-settings"],
      ["/api/system-settings"],
      ["/api/admin/orders/awaiting-confirmation"],
      ["/api/coupons"],
      ["/api/reviews"],
      ["/api/cart"],
      ["/api/wishlist"],
      ["/api/notifications"]
    ];

    // Perform comprehensive cache invalidation and refetch
    allQueryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.refetchQueries({ queryKey });
    });

    // Update last update time
    setLastUpdateTime(prev => ({ ...prev, [section]: new Date() }));
    
    // Show success notification
    setTimeout(() => {
      setUpdateMessage(`${message} - data refreshed successfully`);
      setTimeout(() => setShowUpdateNotification(false), 2000);
    }, 1000);
  };
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  // Hide coupon checkboxes when no items are selected
  React.useEffect(() => {
    if (selectedCoupons.length === 0 && showCouponCheckboxes) {
      setShowCouponCheckboxes(false);
    }
  }, [selectedCoupons.length, showCouponCheckboxes]);
  const [selectAllCoupons, setSelectAllCoupons] = useState(false);
  const [couponBulkAction, setCouponBulkAction] = useState<
    "delete" | "activate" | "deactivate" | null
  >(null);
  const [couponBulkActionDialog, setCouponBulkActionDialog] = useState(false);

  // Coupon filtering and pagination state
  const [couponsCurrentPage, setCouponsCurrentPage] = useState(1);
  const [couponsItemsPerPage, setCouponsItemsPerPage] = useState(10);
  const [couponsTotal, setCouponsTotal] = useState(0);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [couponsSearchTerm, setCouponsSearchTerm] = useState("");
  const [debouncedCouponsSearchTerm, setDebouncedCouponsSearchTerm] =
    useState("");
  const [couponsFilters, setCouponsFilters] = useState({
    status: "all",
    discountType: "all",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Users filtering and pagination state 
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersItemsPerPage, setUsersItemsPerPage] = useState(20);
  const [usersTotal, setUsersTotal] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersSearchTerm, setUsersSearchTerm] = useState("");
  const [debouncedUsersSearchTerm, setDebouncedUsersSearchTerm] = useState("");
  const [usersFilters, setUsersFilters] = useState({
    role: "all",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Categories filtering and pagination state
  const [categoriesCurrentPage, setCategoriesCurrentPage] = useState(1);
  const [categoriesItemsPerPage, setCategoriesItemsPerPage] = useState(20);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoriesSearchTerm, setCategoriesSearchTerm] = useState("");
  const [debouncedCategoriesSearchTerm, setDebouncedCategoriesSearchTerm] = useState("");
  const [categoriesFilters, setCategoriesFilters] = useState({
    status: "all",
    sortBy: "name",
    sortOrder: "asc" as "asc" | "desc",
  });

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "customer" as "customer" | "admin",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  // System Settings Query
  const { data: systemSettings = [], error: systemSettingsError, refetch: refetchSystemSettings } = useQuery({
    queryKey: ["/api/system-settings"],
    enabled: activeSection === "settings",
    staleTime: 0,
  });

  // Load system settings when settings section is active
  React.useEffect(() => {
    if (activeSection === "settings") {
      refetchSystemSettings();
    }
  }, [activeSection, refetchSystemSettings]);

  // Enhanced real-time queries for all admin sections
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  // Categories with real-time updates
  const { data: realtimeCategories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["/api/categories"],
    refetchInterval: 15000, // Refresh every 15 seconds
    enabled: activeSection === "categories",
  });

  // Users with real-time updates
  const { data: realtimeUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 20000, // Refresh every 20 seconds
    enabled: activeSection === "users",
  });

  // Orders with real-time updates
  const { data: realtimeOrdersData, refetch: refetchOrders } = useQuery({
    queryKey: ["/api/orders", ordersFilters, debouncedOrdersSearchTerm],
    refetchInterval: 15000, // Refresh every 15 seconds
    enabled: activeSection === "orders",
  });

  // Coupons with real-time updates
  const { data: realtimeCouponsData, refetch: refetchCoupons } = useQuery({
    queryKey: ["/api/admin/coupons"],
    refetchInterval: 20000, // Refresh every 20 seconds
    enabled: activeSection === "coupons",
  });

  // Reviews with real-time updates
  const { data: realtimeReviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ["/api/reviews"],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: activeSection === "reviews",
  });

  // Payment settings with real-time updates
  const { data: realtimePaymentSettings = [], refetch: refetchPaymentSettings } = useQuery({
    queryKey: ["/api/payment-settings"],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: activeSection === "payments",
  });

  // Updated products query with pagination and filtering
  const buildProductsQuery = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (productFilters.category && productFilters.category !== "all")
      params.append("categoryId", productFilters.category);
    if (productFilters.status === "active") params.append("active", "true");
    if (productFilters.status === "inactive") params.append("active", "false");
    if (productFilters.status === "archived") params.append("archived", "true");
    // For "all" status, don't add any active filter to show both active and inactive products
    if (productFilters.status === "all") {
      // Don't add active parameter - let storage show all products by not filtering by isActive
      params.append("showAll", "true");
    }
    if (productFilters.featured === "featured") params.append("featured", "true");
    if (productFilters.featured === "flash-sale") params.append("flashSale", "true");
    if (productFilters.featured === "new-arrivals") params.append("newArrivals", "true");
    if (productFilters.brand) params.append("brand", productFilters.brand);
    if (productFilters.color) params.append("color", productFilters.color);
    if (productFilters.priceMin)
      params.append("priceMin", productFilters.priceMin);
    if (productFilters.priceMax)
      params.append("priceMax", productFilters.priceMax);
    params.append("limit", productsPerPage.toString());
    params.append("offset", ((productsPage - 1) * productsPerPage).toString());
    return params.toString();
  };

  // Load products with pagination
  const loadProducts = async (page = 1, reset = false) => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (productFilters.category && productFilters.category !== "all")
        params.append("categoryId", productFilters.category);
      if (productFilters.status === "active") params.append("active", "true");
      if (productFilters.status === "inactive") params.append("active", "false");
      if (productFilters.status === "archived") params.append("archived", "true");
      // For "all" status, don't add any active filter to show both active and inactive products
      if (productFilters.status === "all") {
        params.append("showAll", "true");
      }
      if (productFilters.featured === "featured") params.append("featured", "true");
      if (productFilters.featured === "flash-sale") params.append("flashSale", "true");
      if (productFilters.featured === "new-arrivals") params.append("newArrivals", "true");
      if (productFilters.brand) params.append("brand", productFilters.brand);
      if (productFilters.color) params.append("color", productFilters.color);
      if (productFilters.priceMin)
        params.append("priceMin", productFilters.priceMin);
      if (productFilters.priceMax)
        params.append("priceMax", productFilters.priceMax);
      if (productFilters.stock && productFilters.stock !== "all")
        params.append("stock", productFilters.stock);
      params.append("limit", productsPerPage.toString());
      params.append("offset", ((page - 1) * productsPerPage).toString());

      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (reset || page === 1) {
        setAllProducts(data.products || []);
      } else {
        setAllProducts((prev) => [...prev, ...(data.products || [])]);
      }

      setProductsHasMore((data.products || []).length === productsPerPage);
      setProductsPage(page);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({ title: "Error loading products", variant: "destructive" });
    } finally {
      setProductsLoading(false);
    }
  };

  // Debounced search to reduce API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load and filter/search changes
  React.useEffect(() => {
    loadProducts(1, true);
  }, [debouncedSearchTerm, productFilters]);

  // Load more products (infinite scroll)
  const loadMoreProducts = () => {
    if (!productsLoading && productsHasMore) {
      loadProducts(productsPage + 1, false);
    }
  };

  // Load orders with pagination and filtering
  const loadOrders = async (page = 1, reset = false) => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedOrdersSearchTerm)
        params.append("search", debouncedOrdersSearchTerm);
      if (ordersFilters.status && ordersFilters.status !== "all")
        params.append("status", ordersFilters.status);
      if (ordersFilters.paymentStatus && ordersFilters.paymentStatus !== "all")
        params.append("paymentStatus", ordersFilters.paymentStatus);
      if (ordersFilters.paymentMethod && ordersFilters.paymentMethod !== "all")
        params.append("paymentMethod", ordersFilters.paymentMethod);
      if (ordersFilters.dateFrom)
        params.append("dateFrom", ordersFilters.dateFrom);
      if (ordersFilters.dateTo) params.append("dateTo", ordersFilters.dateTo);
      params.append("limit", ordersPerPage.toString());
      params.append("offset", ((page - 1) * ordersPerPage).toString());
      params.append("sortBy", "createdAt");
      params.append("sortOrder", "asc"); // Oldest first as requested

      const response = await fetch(`/api/orders?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (reset || page === 1) {
        setAllOrders(data.orders || []);
      } else {
        setAllOrders((prev) => [...prev, ...(data.orders || [])]);
      }

      setOrdersHasMore((data.orders || []).length === ordersPerPage);
      setOrdersPage(page);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({ title: "Error loading orders", variant: "destructive" });
    } finally {
      setOrdersLoading(false);
    }
  };

  // Debounced search for orders
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrdersSearchTerm(ordersSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [ordersSearchTerm]);

  // Initial load and filter/search changes for orders
  React.useEffect(() => {
    if (activeSection === "orders") {
      loadOrders(1, true);
    }
  }, [debouncedOrdersSearchTerm, ordersFilters, activeSection]);

  // Load orders on component mount for overview section
  React.useEffect(() => {
    loadOrders(1, true);
  }, []);

  // Debounced search for users
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsersSearchTerm(usersSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [usersSearchTerm]);

  // Debounced search for categories
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCategoriesSearchTerm(categoriesSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [categoriesSearchTerm]);

  // Load users automatically and when filters change
  React.useEffect(() => {
    loadUsers(1, true);
  }, [debouncedUsersSearchTerm, usersFilters]);

  // Load categories automatically and when filters change
  React.useEffect(() => {
    loadCategories(1, true);
  }, [debouncedCategoriesSearchTerm, categoriesFilters]);

  // Load users on component mount
  React.useEffect(() => {
    loadUsers(1, true);
  }, []);

  // Load categories on component mount
  React.useEffect(() => {
    loadCategories(1, true);
  }, []);

  // Debounced search for reviews
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedReviewsSearchTerm(reviewsSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [reviewsSearchTerm]);

  // Load reviews with pagination and filtering
  const loadReviews = async (page = 1, reset = false) => {
    try {
      const params = new URLSearchParams();
      if (debouncedReviewsSearchTerm)
        params.append("search", debouncedReviewsSearchTerm);
      if (reviewsFilters.status !== "all")
        params.append("status", reviewsFilters.status);
      if (reviewsFilters.rating !== "all")
        params.append("rating", reviewsFilters.rating);
      params.append("sortBy", reviewsFilters.sortBy);
      params.append("sortOrder", reviewsFilters.sortOrder);
      params.append("limit", reviewsItemsPerPage.toString());
      params.append("offset", ((page - 1) * reviewsItemsPerPage).toString());

      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (reset || page === 1) {
        setAllReviews(data.reviews || data || []);
      } else {
        setAllReviews((prev) => [...prev, ...(data.reviews || data || [])]);
      }

      setReviewsTotal(data.total || (data.reviews || data || []).length);
      setReviewsCurrentPage(page);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast({ title: "Error loading reviews", variant: "destructive" });
    }
  };

  // Load reviews automatically and when filters change
  React.useEffect(() => {
    loadReviews(1, true);
  }, [debouncedReviewsSearchTerm, reviewsFilters]);

  // Load reviews on component mount
  React.useEffect(() => {
    loadReviews(1, true);
  }, []);

  // Load more orders
  const loadMoreOrders = () => {
    if (!ordersLoading && ordersHasMore) {
      loadOrders(ordersPage + 1, false);
    }
  };

  // Load users with pagination and filtering
  const loadUsers = async (page = 1, reset = false) => {
    try {
      const params = new URLSearchParams();
      if (debouncedUsersSearchTerm)
        params.append("search", debouncedUsersSearchTerm);
      if (usersFilters.role !== "all")
        params.append("role", usersFilters.role);
      if (usersFilters.status !== "all")
        params.append("status", usersFilters.status);
      params.append("sortBy", usersFilters.sortBy);
      params.append("sortOrder", usersFilters.sortOrder);
      params.append("limit", usersItemsPerPage.toString());
      params.append("offset", ((page - 1) * usersItemsPerPage).toString());

      const response = await fetch(`/api/users?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (reset || page === 1) {
        setAllUsers(data.users || data || []);
      } else {
        setAllUsers((prev) => [...prev, ...(data.users || data || [])]);
      }

      setUsersTotal(data.total || (data.users || data || []).length);
      setUsersCurrentPage(page);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({ title: "Error loading users", variant: "destructive" });
    }
  };

  // Load categories with pagination and filtering
  const loadCategories = async (page = 1, reset = false) => {
    try {
      const params = new URLSearchParams();
      if (debouncedCategoriesSearchTerm)
        params.append("search", debouncedCategoriesSearchTerm);
      if (categoriesFilters.status !== "all")
        params.append("status", categoriesFilters.status);
      params.append("sortBy", categoriesFilters.sortBy);
      params.append("sortOrder", categoriesFilters.sortOrder);
      params.append("limit", categoriesItemsPerPage.toString());
      params.append("offset", ((page - 1) * categoriesItemsPerPage).toString());

      const response = await fetch(`/api/categories?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (reset || page === 1) {
        setAllCategories(data.categories || data || []);
      } else {
        setAllCategories((prev) => [...prev, ...(data.categories || data || [])]);
      }

      setCategoriesTotal(data.total || (data.categories || data || []).length);
      setCategoriesCurrentPage(page);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({ title: "Error loading categories", variant: "destructive" });
    }
  };

  // Load coupons with server-side filtering and pagination
  const loadCoupons = async (page = 1, reset = false) => {
    try {
      const params = new URLSearchParams();
      if (debouncedCouponsSearchTerm)
        params.append("search", debouncedCouponsSearchTerm);
      if (couponsFilters.status !== "all")
        params.append("status", couponsFilters.status);
      if (couponsFilters.discountType !== "all")
        params.append("discountType", couponsFilters.discountType);
      params.append("sortBy", couponsFilters.sortBy);
      params.append("sortOrder", couponsFilters.sortOrder);
      params.append("limit", couponsItemsPerPage.toString());
      params.append("offset", ((page - 1) * couponsItemsPerPage).toString());

      const response = await apiRequest(
        `/api/admin/coupons?${params.toString()}`,
      );

      setAllCoupons(response.coupons || []);
      setCouponsTotal(response.total || 0);
      setCouponsCurrentPage(page);
    } catch (error: any) {
      console.error("Load coupons error:", error);
      toast({
        title: "Error loading coupons",
        description: error.message || "Failed to load coupons",
        variant: "destructive",
      });
    }
  };

  // Debounce coupon search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCouponsSearchTerm(couponsSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [couponsSearchTerm]);

  // Real-time coupon data with React Query for automatic refresh
  const buildCouponsUrl = () => {
    const params = new URLSearchParams();
    if (debouncedCouponsSearchTerm)
      params.append("search", debouncedCouponsSearchTerm);
    if (couponsFilters.status !== "all")
      params.append("status", couponsFilters.status);
    if (couponsFilters.discountType !== "all")
      params.append("discountType", couponsFilters.discountType);
    params.append("sortBy", couponsFilters.sortBy);
    params.append("sortOrder", couponsFilters.sortOrder);
    params.append("limit", couponsItemsPerPage.toString());
    params.append(
      "offset",
      ((couponsCurrentPage - 1) * couponsItemsPerPage).toString(),
    );
    return `/api/admin/coupons?${params.toString()}`;
  };

  const { data: couponsQueryData } = useQuery({
    queryKey: [buildCouponsUrl()],
    enabled: true, // Always enabled for automatic data loading
    refetchInterval: 3000, // Refresh every 3 seconds like other sections
  });

  // Update local state when query data changes
  React.useEffect(() => {
    if (couponsQueryData) {
      setAllCoupons(couponsQueryData.coupons || []);
      setCouponsTotal(couponsQueryData.total || 0);
    }
  }, [couponsQueryData]);

  // Load more coupons
  const loadMoreCoupons = () => {
    if (!couponsLoading && couponsHasMore) {
      loadCoupons(couponsPage + 1, false);
    }
  };

  const { data: awaitingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders/awaiting-confirmation"],
    refetchInterval: 3000,
  });

  // Remove the old React Query calls since we're now using manual loading
  // This ensures data is pre-loaded and available immediately when sections are clicked

  const { data: paymentSettings = [] } = useQuery<PaymentSetting[]>({
    queryKey: ["/api/payment-settings"],
    refetchInterval: 10000,
  });

  // Safe products array handling - using pagination state
  const safeProducts = Array.isArray(allProducts) ? allProducts : [];

  // Enhanced analytics data processing
  const analyticsData = {
    dailySales:
      analytics?.dailySales?.map((day) => ({
        ...day,
        date: new Date(day.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: day.sales,
        orderCount: day.orders,
      })) || [],
    ordersByStatus:
      analytics?.ordersByStatus
        ?.filter((stat) => stat?.status)
        ?.map((stat) => ({
          name: stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
          value: stat.count,
          color: getStatusColor(stat.status).includes("yellow")
            ? "#fbbf24"
            : getStatusColor(stat.status).includes("blue")
              ? "#3b82f6"
              : getStatusColor(stat.status).includes("purple")
                ? "#8b5cf6"
                : getStatusColor(stat.status).includes("green")
                  ? "#10b981"
                  : getStatusColor(stat.status).includes("red")
                    ? "#ef4444"
                    : "#6b7280",
        })) || [],
    monthlyGrowth: analytics?.monthlyGrowth || {
      sales: 0,
      users: 0,
      orders: 0,
    },
    paymentMethodStats: analytics?.paymentMethodStats || [],
  };

  // Category performance data - real revenue from completed orders
  const categoryPerformance =
    allCategories?.map((cat) => {
      const categoryProducts = safeProducts.filter(
        (p) => p.categoryId === cat.id,
      );

      // Calculate real revenue from delivered orders with paid/approved payment status
      const completedOrders = allOrders.filter(
        (order) =>
          order.status === "delivered" &&
          (order.paymentStatus === "paid" ||
            order.paymentStatus === "approved"),
      );

      // Get revenue for this category from completed orders
      const categoryRevenue = completedOrders.reduce((total, order) => {
        // Calculate revenue for items in this category within this order
        const orderItems = order.items || [];
        const categoryOrderRevenue = orderItems
          .filter((item) => {
            const product = safeProducts.find((p) => p.id === item.productId);
            return product && product.categoryId === cat.id;
          })
          .reduce((sum, item) => sum + item.price * item.quantity, 0);

        return total + categoryOrderRevenue;
      }, 0);

      return {
        name: cat.name,
        products: categoryProducts.length,
        revenue: categoryRevenue,
        avgPrice:
          categoryProducts.length > 0
            ? categoryProducts.reduce((sum, p) => sum + p.price, 0) /
              categoryProducts.length
            : 0,
      };
    }) || [];

  // User growth simulation based on real user count
  const userGrowthData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const baseUsers = (analytics?.totalUsers || 1) - 6 + i;
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      users: Math.max(1, baseUsers),
      newUsers: Math.floor(Math.random() * 3) + 1,
    };
  });

  // Revenue trend data
  const revenueTrendData = analyticsData.dailySales.map((day, index) => ({
    ...day,
    cumulativeRevenue: analyticsData.dailySales
      .slice(0, index + 1)
      .reduce((sum, d) => sum + d.sales, 0),
    averageOrderValue: day.orders > 0 ? Math.round(day.sales / day.orders) : 0,
  }));

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setProductForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...files],
      }));
    }
  };

  // Remove new uploaded image
  const removeImage = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  // Remove existing image from database
  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Category image upload handler
  const handleCategoryImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setCategoryForm((prev) => ({
        ...prev,
        image: e.target.files![0],
      }));
    }
  };

  // Category handlers for enhanced table
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      slug: category.slug || "",
      image: null,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
      isActive: category.isActive !== false,
      sortOrder: category.sortOrder || 0,
    });
    setShowCategoryDialog(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await apiRequest(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });
      toast({ title: "Category deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-enhanced"] });
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  // Category form submit handler
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", categoryForm.name);
    formData.append("description", categoryForm.description || "");
    formData.append("slug", categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, "-"));
    formData.append("metaTitle", categoryForm.metaTitle || "");
    formData.append("metaDescription", categoryForm.metaDescription || "");
    formData.append("isActive", categoryForm.isActive.toString());
    formData.append("sortOrder", categoryForm.sortOrder.toString());

    // Handle image upload
    if (categoryForm.image) {
      formData.append("image", categoryForm.image);
    }

    // Handle existing image for updates
    if (editingCategory && editingCategory.image && !categoryForm.image) {
      formData.append("existingImage", editingCategory.image);
    }

    try {
      let response;
      if (editingCategory) {
        response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          body: formData,
          credentials: "include",
        });
      } else {
        response = await fetch("/api/categories", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save category');
      }

      toast({ 
        title: editingCategory ? "Category updated successfully" : "Category created successfully" 
      });

      // Reload categories data
      loadCategories(1, true);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-enhanced"] });
      
      setShowCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        description: "",
        slug: "",
        image: null,
        metaTitle: "",
        metaDescription: "",
        isActive: true,
        sortOrder: 0,
      });
    } catch (error: any) {
      console.error('Category save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  // Product form submit handler
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();

    // Add all form fields ensuring complete data submission
    formData.append("name", productForm.name);
    formData.append("shortDescription", productForm.shortDescription || "");
    formData.append("description", productForm.description);
    formData.append("price", productForm.price);
    formData.append("originalPrice", productForm.originalPrice || "");
    formData.append("salePrice", productForm.salePrice || "");
    formData.append("discountPercentage", productForm.discountPercentage || "");
    formData.append("categoryId", productForm.categoryId);
    formData.append("stock", productForm.stock);
    formData.append("sku", productForm.sku || `SKU-${Date.now()}`);
    formData.append("weight", productForm.weight || "");
    formData.append("dimensions", productForm.dimensions || "");
    formData.append("material", productForm.material || "");
    formData.append("brand", productForm.brand || "");
    formData.append("color", productForm.color || "");
    formData.append("size", productForm.size || "");
    formData.append("metaTitle", productForm.metaTitle || "");
    formData.append("metaDescription", productForm.metaDescription || "");
    formData.append("productType", productForm.productType || "simple");
    formData.append("flashSaleDiscount", productForm.flashSaleDiscount || "");
    formData.append("flashSaleStartDate", productForm.flashSaleStartDate || "");
    formData.append("flashSaleEndDate", productForm.flashSaleEndDate || "");
    // Removed legacy isFeatured field - now using productType
    formData.append("isActive", productForm.isActive?.toString() || "true");

    // Process tags
    const tagsArray = productForm.tags
      ? productForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];
    formData.append("tags", JSON.stringify(tagsArray));

    // Add existing images (URLs) and new images (Files) to FormData
    if (editingProduct) {
      // Send existing images that weren't removed
      formData.append("existingImages", JSON.stringify(existingImages));
    }

    // Add new uploaded images
    if (productForm.images && productForm.images.length > 0) {
      productForm.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    try {
      if (editingProduct) {
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update product");
        }

        toast({ title: "Product updated successfully" });
      } else {
        const response = await fetch("/api/products", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create product");
        }

        toast({ title: "Product created successfully" });
      }

      // Reload products instead of using query invalidation
      loadProducts(1, true);
      setShowProductDialog(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        shortDescription: "",
        description: "",
        price: "",
        originalPrice: "",
        salePrice: "",
        discountPercentage: "",
        categoryId: "",
        stock: "",
        sku: "",
        weight: "",
        dimensions: "",
        material: "",
        brand: "",
        color: "",
        size: "",
        tags: "",
        productType: "simple",
        flashSaleDiscount: "",
        flashSaleStartDate: "",
        flashSaleEndDate: "",
        // Removed legacy featured field - now using productType
        isActive: true,
        metaTitle: "",
        metaDescription: "",
        images: [],
      });
      setExistingImages([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  // Payment approval/rejection mutations
  const approvePayment = useMutation({
    mutationFn: (data: { orderId: number; adminNotes: string }) =>
      apiRequest(`/api/admin/orders/${data.orderId}/approve`, {
        method: "PUT",
        body: JSON.stringify({ adminNotes: data.adminNotes }),
      }),
    onSuccess: () => {
      toast({ title: "Payment approved successfully" });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/orders/awaiting-confirmation"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setViewOrderDialog(false);
      setAdminNotes("");
      // Refresh orders list immediately
      loadOrders(1, true);
    },
    onError: () => {
      toast({ title: "Failed to approve payment", variant: "destructive" });
    },
  });

  const rejectPayment = useMutation({
    mutationFn: (data: {
      orderId: number;
      rejectionReason: string;
      adminNotes: string;
    }) =>
      apiRequest(`/api/admin/orders/${data.orderId}/reject`, {
        method: "PUT",
        body: JSON.stringify({
          rejectionReason: data.rejectionReason,
          adminNotes: data.adminNotes,
        }),
      }),
    onSuccess: () => {
      toast({ title: "Payment rejected" });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/orders/awaiting-confirmation"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setRejectDialog(false);
      setViewOrderDialog(false);
      setRejectionReason("");
      setAdminNotes("");
      // Refresh orders list immediately
      loadOrders(1, true);
    },
    onError: () => {
      toast({ title: "Failed to reject payment", variant: "destructive" });
    },
  });

  // Order status update mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      // Force immediate refetch of all order-related data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/orders/awaiting-confirmation"],
      });
      // Force immediate refetch to show changes immediately
      queryClient.refetchQueries({ queryKey: ["/api/orders"] });
      queryClient.refetchQueries({ queryKey: ["/api/analytics"] });
      queryClient.refetchQueries({
        queryKey: ["/api/admin/orders/awaiting-confirmation"],
      });
      setLastUpdateTime(prev => ({ ...prev, orders: new Date() }));
      setUpdateMessage("Order status updated - data refreshed immediately");
      setShowUpdateNotification(true);
      setTimeout(() => setShowUpdateNotification(false), 3000);
      toast({ title: "Order status updated successfully" });
      // Refresh orders list immediately
      loadOrders(1, true);
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  // Payment status update mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({
      id,
      paymentStatus,
    }: {
      id: number;
      paymentStatus: string;
    }) =>
      apiRequest(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ paymentStatus }),
      }),
    onSuccess: () => {
      toast({ title: "Payment status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/orders/awaiting-confirmation"],
      });
      // Refresh orders list immediately
      loadOrders(1, true);
    },
    onError: () => {
      toast({
        title: "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (orderIds: number[]) =>
      Promise.all(
        orderIds.map((id) =>
          apiRequest(`/api/orders/${id}`, { method: "DELETE" }),
        ),
      ),
    onSuccess: () => {
      toast({ title: "Orders deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setSelectedOrders([]);
      setBulkActionDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to delete orders", variant: "destructive" });
    },
  });

  // Bulk status update mutation
  const bulkStatusUpdateMutation = useMutation({
    mutationFn: ({
      orderIds,
      status,
    }: {
      orderIds: number[];
      status: string;
    }) =>
      Promise.all(
        orderIds.map((id) =>
          apiRequest(`/api/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status }),
          }),
        ),
      ),
    onSuccess: () => {
      toast({ title: "Order statuses updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setSelectedOrders([]);
      setBulkActionDialog(false);
    },
    onError: () => {
      toast({
        title: "Failed to update order statuses",
        variant: "destructive",
      });
    },
  });

  // Bulk payment status update mutation
  const bulkPaymentUpdateMutation = useMutation({
    mutationFn: ({
      orderIds,
      paymentStatus,
    }: {
      orderIds: number[];
      paymentStatus: string;
    }) =>
      Promise.all(
        orderIds.map((id) =>
          apiRequest(`/api/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify({ paymentStatus }),
          }),
        ),
      ),
    onSuccess: () => {
      toast({ title: "Payment statuses updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setSelectedOrders([]);
      setBulkActionDialog(false);
    },
    onError: () => {
      toast({
        title: "Failed to update payment statuses",
        variant: "destructive",
      });
    },
  });

  // Update payment settings mutation
  const updatePaymentSetting = useMutation({
    mutationFn: (data: PaymentSetting) =>
      apiRequest(`/api/payment-settings/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Payment settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
      setPaymentDialog(false);
      setEditingPayment(null);
    },
    onError: () => {
      toast({
        title: "Failed to update payment settings",
        variant: "destructive",
      });
    },
  });

  // System settings mutations
  const createSystemSetting = useMutation({
    mutationFn: async (data: Partial<SystemSetting>) => {
      return await apiRequest(`/api/system-settings`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/public"] });
      toast({ title: "System setting created successfully" });
      setSettingDialog(false);
      setEditingSetting(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating system setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSystemSetting = useMutation({
    mutationFn: async (data: SystemSetting) => {
      return await apiRequest(`/api/system-settings/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/public"] });
      toast({ title: "System setting updated successfully" });
      setSettingDialog(false);
      setEditingSetting(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating system setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSystemSetting = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/system-settings/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/public"] });
      toast({ title: "System setting deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting system setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create payment setting mutation
  const createPaymentSetting = useMutation({
    mutationFn: (data: InsertPaymentSetting) =>
      apiRequest("/api/payment-settings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Payment method added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
      setPaymentDialog(false);
      setEditingPayment(null);
    },
    onError: () => {
      toast({ title: "Failed to add payment method", variant: "destructive" });
    },
  });

  // Delete payment setting mutation
  const deletePaymentSetting = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/payment-settings/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "Payment method deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
    },
    onError: () => {
      toast({
        title: "Failed to delete payment method",
        variant: "destructive",
      });
    },
  });

  // Review management mutations
  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest(`/api/admin/reviews/${reviewId}/approve`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review approved successfully" });
      loadReviews(reviewsCurrentPage, true);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to approve review",
        variant: "destructive" 
      });
    },
  });

  const rejectReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest(`/api/admin/reviews/${reviewId}/reject`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review rejected successfully" });
      loadReviews(reviewsCurrentPage, true);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to reject review",
        variant: "destructive" 
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review deleted successfully" });
      loadReviews(reviewsCurrentPage, true);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete review",
        variant: "destructive" 
      });
    },
  });

  // Database export/import handlers
  const handleExportDatabase = async () => {
    try {
      const response = await fetch('/api/admin/export-database', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export database');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Database exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export database",
        variant: "destructive",
      });
    }
  };

  const handleDatabaseImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show loading toast
    const loadingToast = toast({
      title: "Importing Database",
      description: "This may take a while for large files...",
    });

    try {
      // Check file size (warn if > 10MB)
      if (file.size > 10 * 1024 * 1024) {
        const proceed = window.confirm(
          `Large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB). Import may take several minutes. Continue?`
        );
        if (!proceed) {
          event.target.value = '';
          return;
        }
      }

      console.log('Reading database file...');
      const text = await file.text();
      
      console.log('Parsing database file...');
      const data = JSON.parse(text);

      // Validate basic structure
      if (!data.data || typeof data.data !== 'object') {
        throw new Error('Invalid database file format - missing data structure');
      }

      // Validate version if present
      if (data.version && data.version !== '1.0.0') {
        console.warn(`Database version ${data.version} may not be fully compatible`);
      }

      console.log('Uploading to server...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      const response = await fetch('/api/admin/import-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          data,
          clearExisting: false // Don't clear existing data by default
        }),
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to import database');
      }

      console.log('Database import completed:', result);

      toast({
        title: "Success",
        description: `Database imported successfully. ${Object.keys(result.results || {}).length} tables processed.`,
      });

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      
      // Reset file input
      event.target.value = '';
      
    } catch (error: any) {
      console.error('Import error:', error);
      
      let errorMessage = "Failed to import database";
      
      if (error.name === 'AbortError') {
        errorMessage = "Import timed out - file may be too large";
      } else if (error.message?.includes('JSON')) {
        errorMessage = "Invalid file format - must be a valid JSON file";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearCache = async () => {
    try {
      setUpdateMessage("Clearing all caches...");
      setShowUpdateNotification(true);
      
      // 1. Clear React Query cache completely
      queryClient.clear();
      
      // 2. Clear browser storage caches
      if (typeof Storage !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // 3. Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 4. Reset all last update times
      setLastUpdateTime({});
      
      // 5. Force immediate refetch of all critical data
      const criticalQueries = [
        ["/api/users"],
        ["/api/admin/users"], 
        ["/api/orders"],
        ["/api/products"],
        ["/api/categories"],
        ["/api/admin/coupons"],
        ["/api/admin/reviews"],
        ["/api/analytics"],
        ["/api/payment-settings"],
        ["/api/system-settings"],
        ["/api/admin/orders/awaiting-confirmation"]
      ];
      
      // Invalidate and refetch all critical queries
      await Promise.all(
        criticalQueries.map(async (queryKey) => {
          queryClient.invalidateQueries({ queryKey });
          queryClient.resetQueries({ queryKey });
          await queryClient.refetchQueries({ queryKey });
        })
      );
      
      setTimeout(() => {
        setShowUpdateNotification(false);
        setUpdateMessage("All caches cleared and data refreshed successfully");
        setShowUpdateNotification(true);
        setLastUpdateTime(prev => ({ ...prev, cache: new Date() }));
        setTimeout(() => setShowUpdateNotification(false), 3000);
      }, 1000);
      
      toast({
        title: "Success",
        description: "All caches cleared and data refreshed successfully",
      });
    } catch (error) {
      console.error('Clear cache error:', error);
      setShowUpdateNotification(false);
      toast({
        title: "Error",
        description: "Failed to clear some caches",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDatabase = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all database data? This action cannot be undone!"
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/delete-database', {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete database');
      }

      toast({
        title: "Success",
        description: "Database deleted successfully",
      });

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      
    } catch (error) {
      console.error('Delete database error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete database",
        variant: "destructive",
      });
    }
  };

  // Delete product mutation (only mutation needed, create/update handled by FormData submission)
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setLastUpdateTime(prev => ({ ...prev, products: new Date() }));
      setUpdateMessage("Product deleted - refreshing data...");
      setShowUpdateNotification(true);
      setTimeout(() => setShowUpdateNotification(false), 3000);
      toast({ title: "Product deleted successfully" });
      // Refresh current products list
      loadProducts(1, true);
    },
  });

  // Bulk product operations mutations
  const bulkDeleteProductsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(
        ids.map((id) =>
          apiRequest(`/api/products/${id}`, { method: "DELETE" }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setSelectedProducts([]);
      setSelectAllProducts(false);
      toast({
        title: `${selectedProducts.length} products deleted successfully`,
      });
      // Refresh current products list
      loadProducts(1, true);
    },
  });

  const bulkUpdateProductsMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[]; updates: any }) => {
      await Promise.all(
        ids.map((id) =>
          apiRequest(`/api/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updates),
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setSelectedProducts([]);
      setSelectAllProducts(false);
      toast({
        title: `${selectedProducts.length} products updated successfully`,
      });
      // Refresh current products list
      loadProducts(1, true);
    },
  });

  // Product selection handlers
  const handleProductSelect = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleSelectAllProducts = () => {
    if (selectAllProducts) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
    setSelectAllProducts(!selectAllProducts);
  };

  const handleProductBulkAction = (
    action: "delete" | "featured" | "active",
  ) => {
    setProductBulkAction(action);
    setProductBulkActionDialog(true);
  };

  const executeProductBulkAction = () => {
    switch (productBulkAction) {
      case "delete":
        bulkDeleteProductsMutation.mutate(selectedProducts);
        break;
      case "featured":
        bulkUpdateProductsMutation.mutate({
          ids: selectedProducts,
          updates: { productType: "featured" },
        });
        break;
      case "active":
        bulkUpdateProductsMutation.mutate({
          ids: selectedProducts,
          updates: { isActive: true },
        });
        break;
    }
    setProductBulkActionDialog(false);
  };

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      performRealTimeUpdate("categories", "Category created");
      setShowCategoryDialog(false);
      setCategoryForm({ name: "", description: "" });
      toast({ title: "Category created successfully" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      performRealTimeUpdate("categories", "Category updated");
      setShowCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
      toast({ title: "Category updated successfully" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      performRealTimeUpdate("categories", "Category deleted");
      toast({ title: "Category deleted successfully" });
    },
  });

  // Coupon mutations
  const createCouponMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/coupons", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      performRealTimeUpdate("coupons", "Coupon created");
      setShowCouponDialog(false);
      setCouponForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        description: "",
        minimumAmount: "",
        usageLimit: "",
        expiresAt: "",
        applyToShipping: false,
        applyToTax: false,
        isActive: true,
      });
      toast({ title: "Coupon created successfully" });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      performRealTimeUpdate("coupons", "Coupon updated");
      setShowCouponDialog(false);
      setEditingCoupon(null);
      setCouponForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        description: "",
        minimumAmount: "",
        usageLimit: "",
        expiresAt: "",
        applyToShipping: false,
        applyToTax: false,
        isActive: true,
      });
      toast({ title: "Coupon updated successfully" });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/coupons/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      performRealTimeUpdate("coupons", "Coupon deleted");
      toast({ title: "Coupon deleted successfully" });
    },
  });

  // Bulk coupons mutations
  const bulkDeleteCouponsMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(
        ids.map((id) => apiRequest(`/api/coupons/${id}`, { method: "DELETE" })),
      ),
    onSuccess: () => {
      performRealTimeUpdate("coupons", "Coupons deleted");
      setSelectedCoupons([]);
      setSelectAllCoupons(false);
      toast({ title: "Coupons deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting coupons",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUpdateCouponsMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: any }) =>
      Promise.all(
        ids.map((id) =>
          apiRequest(`/api/coupons/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updates),
          }),
        ),
      ),
    onSuccess: () => {
      performRealTimeUpdate("coupons", "Coupons updated");
      setSelectedCoupons([]);
      setSelectAllCoupons(false);
      toast({ title: "Coupons updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating coupons",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/users", { 
        method: "POST", 
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    onMutate: async (newUser) => {
      // Cancel outgoing refetches to prevent interference
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });
      
      // Snapshot previous values
      const previousUsers = queryClient.getQueryData(["users"]);
      const previousApiUsers = queryClient.getQueryData(["/api/users"]);
      const previousAdminUsers = queryClient.getQueryData(["/api/admin/users"]);
      
      // Create optimistic user object with proper validation
      const optimisticUser = {
        id: Date.now(), // Temporary ID
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role || 'customer',
        isActive: newUser.isActive !== false,
        createdAt: new Date().toISOString(),
      };
      
      // Optimistically add user to all caches with proper structure handling
      const addUserToArray = (userArray: any) => {
        if (!userArray) return [optimisticUser];
        
        if (Array.isArray(userArray)) {
          return [optimisticUser, ...userArray];
        } else if (userArray && typeof userArray === 'object') {
          if (Array.isArray(userArray.users)) {
            return { 
              ...userArray, 
              users: [optimisticUser, ...userArray.users],
              total: (userArray.total || 0) + 1
            };
          } else if (Array.isArray(userArray.data)) {
            return { 
              ...userArray, 
              data: [optimisticUser, ...userArray.data]
            };
          }
        }
        
        return [optimisticUser];
      };
      
      queryClient.setQueryData(["users"], addUserToArray(previousUsers as any[]));
      queryClient.setQueryData(["/api/users"], addUserToArray(previousApiUsers as any[]));
      queryClient.setQueryData(["/api/admin/users"], addUserToArray(previousAdminUsers as any[]));
      
      return { previousUsers, previousApiUsers, previousAdminUsers };
    },
    onSuccess: (newUser, variables) => {
      // Prevent search interference by not calling global update
      setShowUserDialog(false);
      
      // Clear form without affecting any other state
      setUserForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "customer",
      });
      
      toast({ 
        title: "Success",
        description: "User created successfully" 
      });
      
      // Reload users data to get correct server data  
      loadUsers(1, true);
      
      // Force refetch with isolated cache invalidation
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates gracefully
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      if (context?.previousApiUsers) {
        queryClient.setQueryData(["/api/users"], context.previousApiUsers);
      }
      if (context?.previousAdminUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousAdminUsers);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });
      
      // Snapshot previous values
      const previousUsers = queryClient.getQueryData(["users"]);
      const previousApiUsers = queryClient.getQueryData(["/api/users"]);
      const previousAdminUsers = queryClient.getQueryData(["/api/admin/users"]);
      
      // Optimistically update user in all caches
      const updateUserInArray = (userArray: any) => {
        if (!userArray) return [];
        
        if (Array.isArray(userArray)) {
          return userArray.map(user => 
            user.id === id ? { ...user, ...data, updatedAt: new Date().toISOString() } : user
          );
        } else if (userArray && typeof userArray === 'object') {
          if (Array.isArray(userArray.users)) {
            return { 
              ...userArray, 
              users: userArray.users.map(user => 
                user.id === id ? { ...user, ...data, updatedAt: new Date().toISOString() } : user
              )
            };
          } else if (Array.isArray(userArray.data)) {
            return { 
              ...userArray, 
              data: userArray.data.map(user => 
                user.id === id ? { ...user, ...data, updatedAt: new Date().toISOString() } : user
              )
            };
          }
        }
        
        return [];
      };
      
      queryClient.setQueryData(["users"], updateUserInArray(previousUsers as any[]));
      queryClient.setQueryData(["/api/users"], updateUserInArray(previousApiUsers as any[]));
      queryClient.setQueryData(["/api/admin/users"], updateUserInArray(previousAdminUsers as any[]));
      
      return { previousUsers, previousApiUsers, previousAdminUsers };
    },
    onSuccess: (data, variables) => {
      // Don't call performRealTimeUpdate which might interfere with search state
      setShowUserDialog(false);
      setEditingUser(null);
      
      // Clear form without affecting search state
      setUserForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "customer",
      });
      
      toast({ title: "User updated successfully" });
      
      // Reload users data to get correct server data
      loadUsers(1, true);
      
      // Force refetch to ensure data consistency without affecting search
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      if (context?.previousApiUsers) {
        queryClient.setQueryData(["/api/users"], context.previousApiUsers);
      }
      if (context?.previousAdminUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousAdminUsers);
      }
      
      toast({
        title: "Error updating user",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/users/${id}`, { method: "DELETE" });
      return response;
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches to prevent interference
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });
      
      // Snapshot previous values
      const previousUsers = queryClient.getQueryData(["users"]);
      const previousApiUsers = queryClient.getQueryData(["/api/users"]);
      const previousAdminUsers = queryClient.getQueryData(["/api/admin/users"]);
      
      // Optimistically remove user from all caches with better handling
      const removeUserFromArray = (userArray: any) => {
        if (!userArray) return [];
        
        if (Array.isArray(userArray)) {
          return userArray.filter(user => user?.id !== userId);
        } else if (userArray && typeof userArray === 'object') {
          if (Array.isArray(userArray.users)) {
            return { 
              ...userArray, 
              users: userArray.users.filter(user => user?.id !== userId),
              total: Math.max(0, (userArray.total || 0) - 1)
            };
          } else if (Array.isArray(userArray.data)) {
            return { 
              ...userArray, 
              data: userArray.data.filter(user => user?.id !== userId)
            };
          }
        }
        
        return [];
      };
      
      queryClient.setQueryData(["users"], removeUserFromArray(previousUsers as any[]));
      queryClient.setQueryData(["/api/users"], removeUserFromArray(previousApiUsers as any[]));
      queryClient.setQueryData(["/api/admin/users"], removeUserFromArray(previousAdminUsers as any[]));
      
      return { previousUsers, previousApiUsers, previousAdminUsers };
    },
    onSuccess: (data, userId) => {
      // Prevent search interference by avoiding global updates
      toast({ 
        title: "Success",
        description: "User deleted successfully" 
      });
      
      // Reload users data to get correct server data
      loadUsers(1, true);
      
      // Force refetch with isolated cache invalidation
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates gracefully
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      if (context?.previousApiUsers) {
        queryClient.setQueryData(["/api/users"], context.previousApiUsers);
      }
      if (context?.previousAdminUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousAdminUsers);
      }
      
      toast({
        title: "Error deleting user",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleViewOrder = async (order: Order) => {
    try {
      // Fetch order details with items and user info
      const response = await apiRequest(`/api/orders/${order.id}`);
      const orderDetails = await response.json();

      // Fetch order items
      const itemsResponse = await apiRequest(`/api/orders/${order.id}/items`);
      const items = await itemsResponse.json();

      setSelectedOrder({ ...orderDetails, items });
      setViewOrderDialog(true);
    } catch (error) {
      toast({ title: "Failed to load order details", variant: "destructive" });
    }
  };

  const handleApprovePayment = () => {
    if (selectedOrder) {
      approvePayment.mutate({
        orderId: selectedOrder.id,
        adminNotes,
      });
    }
  };

  const handleRejectPayment = () => {
    if (selectedOrder) {
      rejectPayment.mutate({
        orderId: selectedOrder.id,
        rejectionReason,
        adminNotes,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      awaiting_confirmation: "outline",
      pending: "default",
      processing: "secondary",
      shipped: "secondary",
      delivered: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      unpaid: "outline",
      awaiting_confirmation: "outline",
      approved: "default",
      paid: "default",
      rejected: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatAddress = (address: any) => {
    if (typeof address === "string") {
      return address;
    }
    return `${address.firstName} ${address.lastName}, ${address.address}, ${address.city}, ${address.postalCode}, ${address.country}`;
  };

  // Bulk operation handlers
  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  const handleBulkAction = (action: "delete" | "status" | "payment") => {
    if (selectedOrders.length === 0) {
      toast({ title: "Please select orders first", variant: "destructive" });
      return;
    }
    setBulkAction(action);
    setBulkActionDialog(true);
  };

  const executeBulkAction = () => {
    if (bulkAction === "delete") {
      bulkDeleteMutation.mutate(selectedOrders);
    } else if (bulkAction === "status" && bulkStatusValue) {
      bulkStatusUpdateMutation.mutate({
        orderIds: selectedOrders,
        status: bulkStatusValue,
      });
    } else if (bulkAction === "payment" && bulkPaymentValue) {
      bulkPaymentUpdateMutation.mutate({
        orderIds: selectedOrders,
        paymentStatus: bulkPaymentValue,
      });
    }
  };

  // Products are already filtered on the server, no need for client-side filtering
  const filteredProducts = safeProducts;

  // Orders are already filtered on the server, no need for client-side filtering
  const filteredOrders = allOrders;

  // Users are handled by the enhanced component - no filtering needed here

  const filteredCategories =
    allCategories?.filter((category: Category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  // Coupons are now handled by server-side filtering

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-xs text-muted-foreground">
                  (Delivered + Paid/Approved)
                </p>
                <h2 className="text-3xl font-bold">
                  ${analytics?.totalSales?.toLocaleString() || 0}
                </h2>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <CheckCircle className="h-4 w-4 mr-1" />
              {analytics?.completedOrders || 0} completed orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <h2 className="text-3xl font-bold">
                  {analytics?.totalOrders || 0}
                </h2>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center text-sm text-amber-600 mt-2">
              <Clock className="h-4 w-4 mr-1" />
              {analytics?.pendingOrders || 0} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <h2 className="text-3xl font-bold">
                  {analytics?.totalUsers || 0}
                </h2>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center text-sm text-blue-600 mt-2">
              <UserPlus className="h-4 w-4 mr-1" />
              Active customers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Products
                </p>
                <h2 className="text-3xl font-bold">
                  {analytics?.totalProducts || 0}
                </h2>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center text-sm text-purple-600 mt-2">
              <Package className="h-4 w-4 mr-1" />
              In inventory
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Alert */}
      {awaitingOrders.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                {awaitingOrders.length} payment
                {awaitingOrders.length > 1 ? "s" : ""} awaiting confirmation
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSection("orders")}
                className="ml-auto"
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Orders Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Revenue & Orders Trend
            </CardTitle>
            <CardDescription>
              Daily revenue and order volume for the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => [
                    name === "sales" ? `$${value}` : value,
                    name === "sales" ? "Revenue" : "Orders",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="url(#salesGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stackId="2"
                  stroke="#10b981"
                  fill="url(#ordersGradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="ordersGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Order Status Distribution
            </CardTitle>
            <CardDescription>
              Current status breakdown of all orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {analyticsData.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Category Performance
            </CardTitle>
            <CardDescription>
              Revenue and product count by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => [
                    name === "revenue" ? `$${value.toFixed(2)}` : value,
                    name === "revenue" ? "Revenue" : "Products",
                  ]}
                />
                <Bar dataKey="products" fill="#8b5cf6" name="Products" />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              User Growth
            </CardTitle>
            <CardDescription>
              Daily user registrations and total users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2 }}
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
                  name="New Users"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-500" />
            Revenue Analysis
          </CardTitle>
          <CardDescription>
            Cumulative revenue and average order value trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} />
              <YAxis
                yAxisId="revenue"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis
                yAxisId="aov"
                orientation="right"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value, name) => [
                  `$${value}`,
                  name === "cumulativeRevenue"
                    ? "Cumulative Revenue"
                    : name === "sales"
                      ? "Daily Revenue"
                      : "Avg Order Value",
                ]}
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="cumulativeRevenue"
                stroke="#ec4899"
                fill="url(#cumulativeGradient)"
                fillOpacity={0.3}
                strokeWidth={2}
                name="Cumulative Revenue"
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                name="Daily Revenue"
              />
              <Line
                yAxisId="aov"
                type="monotone"
                dataKey="averageOrderValue"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                name="Avg Order Value"
              />
              <defs>
                <linearGradient
                  id="cumulativeGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allOrders.slice(0, 5).map((order: Order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : `User ID: ${order.userId}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.totalAmount}</p>
                    <Badge
                      variant={
                        order.status === "delivered" ? "default" : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeProducts.slice(0, 5).map((product: Product) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <img
                    src={
                      product.imageUrl ||
                      product.images?.[0] ||
                      "/api/placeholder/40/40"
                    }
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${product.price}
                    </p>
                  </div>
                  <Badge
                    variant={product.stock > 0 ? "default" : "destructive"}
                  >
                    {product.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => setShowProductDialog(true)}
              className="h-20 flex flex-col"
            >
              <Plus className="h-6 w-6 mb-2" />
              Add Product
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveSection("orders")}
              className="h-20 flex flex-col"
            >
              <ShoppingCart className="h-6 w-6 mb-2" />
              View Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveSection("users")}
              className="h-20 flex flex-col"
            >
              <Users className="h-6 w-6 mb-2" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveSection("categories")}
              className="h-20 flex flex-col"
            >
              <Tag className="h-6 w-6 mb-2" />
              Categories
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <CardTitle>Products Management</CardTitle>
              <CardDescription>
                Manage your product catalog with advanced filtering and bulk
                operations
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowProductDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Button */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowProductFilters(true)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(productFilters.category !== "" &&
                productFilters.category !== "all") ||
              productFilters.status !== "all" ||
              productFilters.priceMin !== "" ||
              productFilters.priceMax !== "" ||
              productFilters.stock !== "all" ||
              (productFilters.featured && productFilters.featured !== "all") ||
              productFilters.color !== "" ||
              productFilters.brand !== "" ? (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              ) : null}
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-800">
                    {selectedProducts.length} product
                    {selectedProducts.length > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProductBulkAction("featured")}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Mark Featured
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProductBulkAction("active")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Mark Active
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleProductBulkAction("delete")}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProducts([]);
                        setSelectAllProducts(false);
                      }}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={showProductCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                    {showProductCheckboxes && (
                      <Checkbox
                        checked={selectAllProducts}
                        onCheckedChange={handleSelectAllProducts}
                      />
                    )}
                  </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product: Product) => (
                <TableRow 
                  key={product.id}
                  className="hover:bg-muted/50 hover:shadow-md cursor-pointer transition-all duration-200"
                  onClick={() => {
                    setShowProductCheckboxes(true);
                    handleProductSelect(product.id);
                  }}
                >
                  <TableCell className={showProductCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                    {showProductCheckboxes && (
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductSelect(product.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          product.images &&
                          Array.isArray(product.images) &&
                          product.images.length > 0
                            ? product.images[0]
                            : product.imageUrls &&
                                Array.isArray(product.imageUrls) &&
                                product.imageUrls.length > 0
                              ? product.imageUrls[0]
                              : "/api/placeholder/40/40"
                        }
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {product.sku || "N/A"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {allCategories?.find(
                        (cat: Category) => cat.id === product.categoryId,
                      )?.name || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">${product.price}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.stock > 0 ? "default" : "destructive"}
                    >
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {(product as any).productType === "featured" && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                      {(product as any).productType === "flash_sale" && (
                        <Badge variant="destructive">Flash Sale</Badge>
                      )}
                      {(product as any).productType === "new_arrivals" && (
                        <Badge variant="outline">New Arrival</Badge>
                      )}
                      <Badge variant={product.isActive ? "default" : "destructive"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                          // Set existing images from the database
                          const productImages =
                            product.images && Array.isArray(product.images)
                              ? product.images
                              : [];
                          setExistingImages(productImages);

                          setProductForm({
                            name: product.name || "",
                            shortDescription: product.shortDescription || "",
                            description: product.description || "",
                            price: product.price.toString(),
                            originalPrice:
                              product.originalPrice?.toString() || "",
                            salePrice: product.salePrice?.toString() || "",
                            discountPercentage:
                              product.discountPercentage?.toString() || "",
                            categoryId: product.categoryId.toString(),
                            stock: product.stock.toString(),
                            sku: product.sku || "",
                            weight: product.weight || "",
                            dimensions: product.dimensions || "",
                            material: product.material || "",
                            brand: product.brand || "",
                            color: product.color || "",
                            size: product.size || "",
                            tags: product.tags ? product.tags.join(", ") : "",
                            productType: (product as any).productType || "simple",
                            flashSaleDiscount: (product as any).flashSaleDiscount?.toString() || "",
                            flashSaleStartDate: (product as any).flashSaleStartDate ? new Date((product as any).flashSaleStartDate).toISOString().slice(0, 16) : "",
                            flashSaleEndDate: (product as any).flashSaleEndDate ? new Date((product as any).flashSaleEndDate).toISOString().slice(0, 16) : "",
                            // Removed legacy featured field - now using productType
                            isActive: product.isActive !== false,
                            metaTitle: product.metaTitle || "",
                            metaDescription: product.metaDescription || "",
                            images: [], // Keep new uploads separate
                          });
                          setShowProductDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProductMutation.mutate(product.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && !productsLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {debouncedSearchTerm ||
                Object.values(productFilters).some((f) => f && f !== "all")
                  ? "No products found matching your filters."
                  : "No products available."}
              </p>
            </div>
          )}

          {/* Infinite scroll trigger and loading indicator */}
          {productsHasMore && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={loadMoreProducts}
                disabled={productsLoading}
                className="w-full"
              >
                {productsLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading products...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Load More Products ({productsPerPage} more)
                  </>
                )}
              </Button>
            </div>
          )}

          {!productsHasMore && filteredProducts.length > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                All products loaded ({filteredProducts.length} total)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Product Form Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update product information and settings"
                : "Add a new product to your catalog"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={productForm.sku}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            sku: e.target.value,
                          }))
                        }
                        placeholder="Product SKU"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Input
                      id="shortDescription"
                      value={productForm.shortDescription}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          shortDescription: e.target.value,
                        }))
                      }
                      placeholder="Brief product summary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Full Description *</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      required
                      placeholder="Detailed product description"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={productForm.brand}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            brand: e.target.value,
                          }))
                        }
                        placeholder="Product brand"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={productForm.tags}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            tags: e.target.value,
                          }))
                        }
                        placeholder="electronics, smartphone, android"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="images">Upload Images</Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload multiple images (JPG, PNG, WebP)
                    </p>
                  </div>
                  {/* Display existing images from database */}
                  {existingImages.length > 0 && (
                    <div className="space-y-2">
                      <Label>Current Product Images</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {existingImages.map((imageUrl, index) => (
                          <div key={`existing-${index}`} className="relative">
                            <img
                              src={imageUrl}
                              alt={`Current image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeExistingImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display newly selected images */}
                  {productForm.images && productForm.images.length > 0 && (
                    <div className="space-y-2">
                      <Label>New Images to Upload</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {productForm.images.map((file, index) => (
                          <div key={`new-${index}`} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing & Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing & Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price">Regular Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => {
                        const regularPrice = parseFloat(e.target.value) || 0;
                        setProductForm((prev) => {
                          // Handle different discount scenarios
                          const flashDiscount = parseFloat(prev.flashSaleDiscount) || 0;
                          const regularDiscount = parseFloat(prev.discountPercentage) || 0;
                          
                          let newSalePrice = prev.salePrice;
                          
                          // Flash sale takes priority over regular discount
                          if (prev.productType === "flash_sale" && flashDiscount > 0) {
                            newSalePrice = (regularPrice * (1 - flashDiscount / 100)).toFixed(2);
                          } else if (regularDiscount > 0) {
                            newSalePrice = (regularPrice * (1 - regularDiscount / 100)).toFixed(2);
                          }
                          
                          return {
                            ...prev,
                            price: e.target.value,
                            salePrice: newSalePrice,
                          };
                        });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Original Price</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={productForm.originalPrice}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          originalPrice: e.target.value,
                        }))
                      }
                      placeholder="Compare at price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salePrice">
                      Sale Price 
                      {productForm.discountPercentage && parseFloat(productForm.discountPercentage) > 0 && (
                        <span className="text-sm text-muted-foreground">
                          (Auto-calculated from {productForm.discountPercentage}% discount)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={productForm.salePrice}
                      onChange={(e) => {
                        const salePrice = parseFloat(e.target.value) || 0;
                        const regularPrice = parseFloat(productForm.price) || 0;
                        
                        setProductForm((prev) => {
                          const discountPercentage = regularPrice > 0 && salePrice < regularPrice ? 
                            (((regularPrice - salePrice) / regularPrice) * 100).toFixed(2) : 
                            "";
                          
                          return {
                            ...prev,
                            salePrice: e.target.value,
                            discountPercentage: discountPercentage,
                          };
                        });
                      }}
                      placeholder="Discounted price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountPercentage">
                      Regular Discount % 
                      {productForm.salePrice && parseFloat(productForm.salePrice) > 0 && (
                        <span className="text-sm text-muted-foreground">
                          (Auto-calculated from sale price)
                        </span>
                      )}
                      {productForm.productType === "flash_sale" && (
                        <span className="text-sm text-blue-600 font-medium ml-2">
                          Synced with flash sale discount
                        </span>
                      )}
                    </Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={productForm.discountPercentage}
                      onChange={(e) => {
                        const discountPercentage = parseFloat(e.target.value) || 0;
                        const regularPrice = parseFloat(productForm.price) || 0;
                        
                        setProductForm((prev) => {
                          const salePrice = discountPercentage > 0 && regularPrice > 0 ? 
                            (regularPrice * (1 - discountPercentage / 100)).toFixed(2) : 
                            prev.salePrice;
                          
                          return {
                            ...prev,
                            discountPercentage: e.target.value,
                            salePrice: discountPercentage > 0 && regularPrice > 0 ? salePrice : prev.salePrice,
                          };
                        });
                      }}
                      placeholder="e.g., 25 for 25% off"
                      disabled={productForm.productType === "flash_sale"}
                      className={productForm.productType === "flash_sale" ? "opacity-75 cursor-not-allowed bg-blue-50" : ""}
                    />
                    {productForm.productType === "flash_sale" && (
                      <p className="text-xs text-blue-600 mt-1">
                        This field is automatically synced with the flash sale discount percentage.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={productForm.stock}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          stock: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select
                      value={productForm.categoryId}
                      onValueChange={(value) =>
                        setProductForm((prev) => ({
                          ...prev,
                          categoryId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(allCategories) &&
                          (allCategories as Category[]).map(
                            (category: Category) => (
                              <SelectItem
                                key={category.id}
                                value={
                                  category.id?.toString() ||
                                  `cat-${category.id}`
                                }
                              >
                                {category.name || "Unnamed Category"}
                              </SelectItem>
                            ),
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Product Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        value={productForm.color}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        placeholder="Product color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        value={productForm.size}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            size: e.target.value,
                          }))
                        }
                        placeholder="Product size"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={productForm.material}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          material: e.target.value,
                        }))
                      }
                      placeholder="Product material"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        value={productForm.weight}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                        placeholder="e.g., 500g"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        value={productForm.dimensions}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            dimensions: e.target.value,
                          }))
                        }
                        placeholder="L x W x H"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEO & Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SEO & Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={productForm.metaTitle}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          metaTitle: e.target.value,
                        }))
                      }
                      placeholder="SEO title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={productForm.metaDescription}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          metaDescription: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="SEO description"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="productType">Product Type *</Label>
                      <Select
                        value={productForm.productType}
                        onValueChange={(value) =>
                          setProductForm((prev) => {
                            // When switching to flash_sale, sync discountPercentage with flashSaleDiscount
                            if (value === "flash_sale" && prev.flashSaleDiscount) {
                              return {
                                ...prev,
                                productType: value,
                                discountPercentage: prev.flashSaleDiscount,
                              };
                            }
                            return {
                              ...prev,
                              productType: value,
                            };
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple Product</SelectItem>
                          <SelectItem value="featured">Featured Product</SelectItem>
                          <SelectItem value="new_arrivals">New Arrivals</SelectItem>
                          <SelectItem value="flash_sale">Flash Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Flash Sale specific fields */}
                    {productForm.productType === "flash_sale" && (
                      <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-medium text-red-800 dark:text-red-200">Flash Sale Settings</h4>
                        <div className="w-full space-y-3">
                          <div>
                            <Label htmlFor="flashSaleDiscount">
                              Flash Sale Discount % *
                              <span className="text-sm text-red-600 font-medium ml-2">
                                (This will show on product cards)
                              </span>
                            </Label>
                            <Input
                              id="flashSaleDiscount"
                              type="number"
                              min="1"
                              max="99"
                              value={productForm.flashSaleDiscount}
                              onChange={(e) => {
                                const flashDiscount = parseFloat(e.target.value) || 0;
                                const regularPrice = parseFloat(productForm.price) || 0;
                                
                                setProductForm((prev) => {
                                  // Calculate flash sale price from regular price and flash discount
                                  const flashSalePrice = flashDiscount > 0 && regularPrice > 0 ? 
                                    (regularPrice * (1 - flashDiscount / 100)).toFixed(2) : 
                                    prev.salePrice;
                                  
                                  return {
                                    ...prev,
                                    flashSaleDiscount: e.target.value,
                                    salePrice: flashDiscount > 0 && regularPrice > 0 ? flashSalePrice : prev.salePrice,
                                    // Sync regular discount to match flash sale discount
                                    discountPercentage: e.target.value,
                                  };
                                });
                              }}
                              placeholder="e.g., 33 for 33% off"
                              required={productForm.productType === "flash_sale"}
                              className="w-full"
                            />
                            {productForm.flashSaleDiscount && parseFloat(productForm.flashSaleDiscount) > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                Sale price will be auto-calculated: {productForm.price && (parseFloat(productForm.price) * (1 - parseFloat(productForm.flashSaleDiscount) / 100)).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="flashSaleStartDate">Start Date *</Label>
                            <DateTimePicker
                              id="flashSaleStartDate"
                              value={productForm.flashSaleStartDate}
                              onChange={(value) =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  flashSaleStartDate: value,
                                }))
                              }
                              placeholder="Select start date and time"
                              required={productForm.productType === "flash_sale"}
                            />
                          </div>
                          <div>
                            <Label htmlFor="flashSaleEndDate">End Date *</Label>
                            <DateTimePicker
                              id="flashSaleEndDate"
                              value={productForm.flashSaleEndDate}
                              onChange={(value) =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  flashSaleEndDate: value,
                                }))
                              }
                              placeholder="Select end date and time"
                              required={productForm.productType === "flash_sale"}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={productForm.isActive}
                        onCheckedChange={(checked) =>
                          setProductForm((prev) => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                      />
                      <Label htmlFor="isActive">Active Status</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">

      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800">
                {selectedOrders.length} order
                {selectedOrders.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("status")}
                >
                  <Package className="h-4 w-4 mr-1" />
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("payment")}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Update Payment
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrders([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority section for payments awaiting confirmation */}
      {awaitingOrders.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <CreditCard className="h-5 w-5" />
              Payments Awaiting Confirmation ({awaitingOrders.length})
            </CardTitle>
            <CardDescription>
              These orders require payment verification before processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awaitingOrders.map((order: Order) => (
                  <TableRow key={order.id} className="bg-amber-50">
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {order.user
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>${order.totalAmount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Orders management</CardTitle>
          <CardDescription>Monitor and manage customer orders</CardDescription>

          {/* Search and Filter Section */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search orders by order number, customer name, email, address, amount..."
                value={ordersSearchTerm}
                onChange={(e) => setOrdersSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowOrdersFilters(true)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {ordersFilters.status !== "all" ||
              ordersFilters.paymentStatus !== "all" ||
              ordersFilters.paymentMethod !== "all" ||
              ordersFilters.dateFrom !== "" ||
              ordersFilters.dateTo !== "" ? (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              ) : null}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={showOrderCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                    {showOrderCheckboxes && (
                      <Checkbox
                        checked={
                          filteredOrders.length > 0 &&
                          selectedOrders.length === filteredOrders.length
                        }
                        onCheckedChange={handleSelectAllOrders}
                      />
                    )}
                  </TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 && !ordersLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    {ordersSearchTerm ||
                    Object.values(ordersFilters).some((f) => f && f !== "all")
                      ? "No orders found matching your filters."
                      : "No orders available."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: Order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/50 hover:shadow-md cursor-pointer transition-all duration-200"
                    onClick={() => {
                      setShowOrderCheckboxes(true);
                      handleSelectOrder(order.id);
                    }}
                  >
                    <TableCell className={showOrderCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                      {showOrderCheckboxes && (
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleSelectOrder(order.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {order.user
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>${order.totalAmount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            {/* Infinite scroll trigger and loading indicator for orders */}
            {ordersHasMore && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreOrders}
                    disabled={ordersLoading}
                    className="w-full"
                  >
                    {ordersLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading orders...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Load More Orders ({ordersPerPage} more)
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {!ordersHasMore && filteredOrders.length > 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    All orders loaded ({filteredOrders.length} total)
                  </p>
                </TableCell>
              </TableRow>
            )}
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => {
    const handleEditUser = (user: User) => {
      // Prevent search interference
      event?.stopPropagation?.();
      
      setEditingUser(user);
      setUserForm({
        username: user.username,
        email: user.email,
        password: "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role as "customer" | "admin",
      });
      setShowUserDialog(true);
    };

    const handleDeleteUser = (userId: number) => {
      // Prevent search interference
      event?.stopPropagation?.();
      
      if (window.confirm("Are you sure you want to delete this user?")) {
        deleteUserMutation.mutate(userId);
      }
    };

    const handleAddUser = () => {
      // Prevent search interference  
      event?.stopPropagation?.();
      
      setEditingUser(null);
      setUserForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "customer",
      });
      setShowUserDialog(true);
    };

    return (
      <div className="space-y-6">
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={userForm.firstName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={userForm.lastName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                />
              </div>
              {!editingUser && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                  />
                </div>
              )}
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) =>
                    setUserForm({
                      ...userForm,
                      role: value as "customer" | "admin",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowUserDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (editingUser) {
                    const updateData = { ...userForm };
                    if (!updateData.password) delete updateData.password;
                    updateUserMutation.mutate({
                      id: editingUser.id,
                      data: updateData,
                    });
                  } else {
                    createUserMutation.mutate(userForm);
                  }
                }}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {createUserMutation.isPending || updateUserMutation.isPending 
                  ? "Processing..." 
                  : editingUser ? "Update" : "Create"
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <UsersTableEnhanced
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onAddUser={handleAddUser}
          users={allUsers}
          total={usersTotal}
          loading={false}
        />
      </div>
    );
  };

  const renderCategories = () => {
    const handleAddCategory = () => {
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        slug: "",
        description: "",
        sortOrder: 0,
        image: null,
        metaTitle: "",
        metaDescription: "",
        isActive: true,
      });
      setShowCategoryDialog(true);
    };

    return (
      <div className="space-y-6">
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update category information and settings"
                  : "Create a new product category"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="categoryName">Category Name *</Label>
                      <Input
                        id="categoryName"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="categorySlug">Slug</Label>
                      <Input
                        id="categorySlug"
                        value={categoryForm.slug}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                        placeholder="category-url-slug"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Textarea
                        id="categoryDescription"
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Category description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            sortOrder: parseInt(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Category Image & SEO */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Category Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="categoryImage">Upload Image</Label>
                        <Input
                          id="categoryImage"
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryImageUpload}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload category image (JPG, PNG, WebP)
                        </p>
                      </div>
                      {/* Display existing image from database */}
                      {editingCategory && editingCategory.image && !categoryForm.image && (
                        <div className="space-y-2">
                          <Label>Current Image</Label>
                          <div className="relative">
                            <img
                              src={editingCategory.image}
                              alt="Current category image"
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0"
                              onClick={() => {
                                // This will remove the image when updating
                                setEditingCategory(prev => prev ? {...prev, image: null} : null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Display new image preview */}
                      {categoryForm.image && (
                        <div className="space-y-2">
                          <Label>New Image Preview</Label>
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(categoryForm.image)}
                              alt="Category preview"
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0"
                              onClick={() =>
                                setCategoryForm((prev) => ({
                                  ...prev,
                                  image: null,
                                }))
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">SEO & Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          value={categoryForm.metaTitle}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              metaTitle: e.target.value,
                            }))
                          }
                          placeholder="SEO title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="metaDescription">
                          Meta Description
                        </Label>
                        <Textarea
                          id="metaDescription"
                          value={categoryForm.metaDescription}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              metaDescription: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="SEO description"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={categoryForm.isActive}
                          onCheckedChange={(checked) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              isActive: checked,
                            }))
                          }
                        />
                        <Label htmlFor="isActive">Active Status</Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCategoryDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Create"} Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <CategoriesTableEnhanced
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddCategory={handleAddCategory}
          categories={allCategories}
          total={categoriesTotal}
          loading={false}
        />
      </div>
    );
  };

  const renderCoupons = () => {
    const handleAddCoupon = () => {
      setEditingCoupon(null);
      setCouponForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        description: "",
        minimumAmount: "",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
      });
      setShowCouponDialog(true);
    };

    const handleResetFilters = () => {
      setCouponsSearchTerm("");
      setCouponsFilters({
        status: "all",
        discountType: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setCouponsCurrentPage(1);
    };

    const handleSelectCoupon = (couponId: number) => {
      setSelectedCoupons((prev) =>
        prev.includes(couponId)
          ? prev.filter((id) => id !== couponId)
          : [...prev, couponId],
      );
    };

    const handleSelectAllCoupons = () => {
      if (selectAllCoupons) {
        setSelectedCoupons([]);
      } else {
        setSelectedCoupons(allCoupons.map((c) => c.id));
      }
      setSelectAllCoupons(!selectAllCoupons);
    };

    const handleCouponBulkAction = (
      action: "delete" | "activate" | "deactivate",
    ) => {
      setCouponBulkAction(action);
      setCouponBulkActionDialog(true);
    };

    const executeCouponBulkAction = () => {
      switch (couponBulkAction) {
        case "delete":
          bulkDeleteCouponsMutation.mutate(selectedCoupons);
          break;
        case "activate":
          bulkUpdateCouponsMutation.mutate({
            ids: selectedCoupons,
            updates: { isActive: true },
          });
          break;
        case "deactivate":
          bulkUpdateCouponsMutation.mutate({
            ids: selectedCoupons,
            updates: { isActive: false },
          });
          break;
      }
      setCouponBulkActionDialog(false);
    };

    return (
      <div className="space-y-6">
        <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="couponCode">Code</Label>
                <Input
                  id="couponCode"
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., SAVE20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={couponForm.discountType}
                    onValueChange={(value) =>
                      setCouponForm({
                        ...couponForm,
                        discountType: value as "percentage" | "fixed",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">
                    {couponForm.discountType === "percentage"
                      ? "Percentage (%)"
                      : "Amount ($)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discountValue: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={couponForm.description}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimumAmount">Minimum Amount ($)</Label>
                  <Input
                    id="minimumAmount"
                    type="number"
                    value={couponForm.minimumAmount}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        minimumAmount: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={couponForm.usageLimit}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        usageLimit: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={couponForm.expiresAt}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, expiresAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="applyToShipping"
                    checked={couponForm.applyToShipping}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, applyToShipping: e.target.checked })
                    }
                  />
                  <Label htmlFor="applyToShipping">Apply discount to shipping cost</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="applyToTax"
                    checked={couponForm.applyToTax}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, applyToTax: e.target.checked })
                    }
                  />
                  <Label htmlFor="applyToTax">Apply discount to tax amount</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={couponForm.isActive}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, isActive: e.target.checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCouponDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const data = {
                    ...couponForm,
                    minimumAmount: couponForm.minimumAmount || undefined,
                    usageLimit: couponForm.usageLimit
                      ? parseInt(couponForm.usageLimit)
                      : undefined,
                    expiresAt: couponForm.expiresAt || undefined,
                  };
                  if (editingCoupon) {
                    updateCouponMutation.mutate({ id: editingCoupon.id, data });
                  } else {
                    createCouponMutation.mutate(data);
                  }
                }}
              >
                {editingCoupon ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Coupons
                </CardTitle>
                <CardDescription>
                  Manage discount coupons and promotional codes
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleAddCoupon}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coupon
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search coupons by code or description..."
                      value={couponsSearchTerm}
                      onChange={(e) => setCouponsSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setCouponsSearchTerm("");
                    setCouponsFilters({
                      status: "all",
                      discountType: "all",
                      sortBy: "createdAt",
                      sortOrder: "desc",
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="sm:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={couponsFilters.status}
                  onValueChange={(value) =>
                    setCouponsFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={`${couponsFilters.sortBy}-${couponsFilters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split("-");
                    setCouponsFilters((prev) => ({
                      ...prev,
                      sortBy,
                      sortOrder: sortOrder as "asc" | "desc",
                    }));
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code-asc">Code A-Z</SelectItem>
                    <SelectItem value="code-desc">Code Z-A</SelectItem>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="discountValue-desc">
                      Highest Value
                    </SelectItem>
                    <SelectItem value="discountValue-asc">
                      Lowest Value
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setCouponsSearchTerm("");
                    setCouponsFilters({
                      status: "all",
                      discountType: "all",
                      sortBy: "createdAt",
                      sortOrder: "desc",
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCoupons.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                <span className="text-sm font-medium">
                  {selectedCoupons.length} coupon
                  {selectedCoupons.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCouponBulkAction("activate")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCouponBulkAction("deactivate")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCouponBulkAction("delete")}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={showCouponCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                      {showCouponCheckboxes && (
                        <Checkbox
                          checked={selectAllCoupons}
                          onCheckedChange={handleSelectAllCoupons}
                        />
                      )}
                    </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Used/Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCoupons?.map((coupon: Coupon) => (
                  <TableRow 
                    key={coupon.id}
                    className="hover:bg-muted/50 hover:shadow-md cursor-pointer transition-all duration-200"
                    onClick={() => {
                      setShowCouponCheckboxes(true);
                      handleSelectCoupon(coupon.id);
                    }}
                  >
                    <TableCell className={showCouponCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                      {showCouponCheckboxes && (
                        <Checkbox
                          checked={selectedCoupons.includes(coupon.id)}
                          onCheckedChange={() => handleSelectCoupon(coupon.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.discountType === "percentage" ? "%" : "$"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : `$${coupon.discountValue}`}
                    </TableCell>
                    <TableCell>
                      {coupon.usedCount || 0}/{coupon.usageLimit || "∞"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={coupon.isActive ? "default" : "destructive"}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString()
                        : "No expiry"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCoupon(coupon);
                            setCouponForm({
                              code: coupon.code,
                              discountType: coupon.discountType as
                                | "percentage"
                                | "fixed",
                              discountValue: coupon.discountValue,
                              description: coupon.description || "",
                              minimumAmount: coupon.minimumAmount || "",
                              usageLimit: coupon.usageLimit?.toString() || "",
                              expiresAt: coupon.expiresAt
                                ? new Date(coupon.expiresAt)
                                    .toISOString()
                                    .slice(0, 16)
                                : "",
                              isActive: coupon.isActive,
                              applyToShipping: coupon.applyToShipping === true,
                              applyToTax: coupon.applyToTax === true,
                            });
                            setShowCouponDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCouponMutation.mutate(coupon.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {couponsTotal > 0 && (
              <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing {(couponsCurrentPage - 1) * couponsItemsPerPage + 1}{" "}
                  to{" "}
                  {Math.min(
                    couponsCurrentPage * couponsItemsPerPage,
                    couponsTotal,
                  )}{" "}
                  of {couponsTotal} coupons
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={couponsItemsPerPage.toString()}
                      onValueChange={(value) => {
                        setCouponsItemsPerPage(Number(value));
                        setCouponsCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={couponsItemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem
                            key={pageSize}
                            value={pageSize.toString()}
                          >
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {couponsCurrentPage} of{" "}
                    {Math.ceil(couponsTotal / couponsItemsPerPage)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => setCouponsCurrentPage(1)}
                      disabled={couponsCurrentPage === 1}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        setCouponsCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={couponsCurrentPage === 1}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        setCouponsCurrentPage((prev) =>
                          Math.min(
                            prev + 1,
                            Math.ceil(couponsTotal / couponsItemsPerPage),
                          ),
                        )
                      }
                      disabled={
                        couponsCurrentPage ===
                        Math.ceil(couponsTotal / couponsItemsPerPage)
                      }
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() =>
                        setCouponsCurrentPage(
                          Math.ceil(couponsTotal / couponsItemsPerPage),
                        )
                      }
                      disabled={
                        couponsCurrentPage ===
                        Math.ceil(couponsTotal / couponsItemsPerPage)
                      }
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Action Confirmation Dialog */}
            <AlertDialog
              open={couponBulkActionDialog}
              onOpenChange={setCouponBulkActionDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to {couponBulkAction}{" "}
                    {selectedCoupons.length} selected coupon
                    {selectedCoupons.length > 1 ? "s" : ""}?
                    {couponBulkAction === "delete" &&
                      " This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={executeCouponBulkAction}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Settings</h2>
          <p className="text-muted-foreground">
            Manage payment methods and account information
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPayment({
              id: 0,
              provider: "",
              name: "",
              accountNumber: "",
              accountName: "",
              instructions: "",
              isActive: true,
            });
            setPaymentDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods Configuration
          </CardTitle>
          <CardDescription>
            Configure payment methods available to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentSettings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment methods configured. Add one to get started.
              </div>
            ) : (
              paymentSettings.map((setting: PaymentSetting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{setting.name}</h3>
                      {setting.provider === "cod" && (
                        <Banknote className="h-4 w-4" />
                      )}
                      {(setting.provider === "easypaisa" ||
                        setting.provider === "jazzcash") && (
                        <Phone className="h-4 w-4" />
                      )}
                      <Badge
                        variant={setting.isActive ? "default" : "secondary"}
                      >
                        {setting.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {setting.accountNumber && (
                      <p className="text-sm text-muted-foreground">
                        Account: {setting.accountNumber}
                      </p>
                    )}
                    {setting.accountName && (
                      <p className="text-sm text-muted-foreground">
                        Name: {setting.accountName}
                      </p>
                    )}
                    {setting.instructions && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {setting.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={setting.isActive}
                      onCheckedChange={(checked) => {
                        updatePaymentSetting.mutate({
                          ...setting,
                          isActive: checked,
                        });
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPayment(setting);
                        setPaymentDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this payment method?",
                          )
                        ) {
                          deletePaymentSetting.mutate(setting.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Review bulk operation states
  const [selectedReviews, setSelectedReviews] = useState<number[]>([]);
  const [showReviewCheckboxes, setShowReviewCheckboxes] = useState(false);
  const [selectAllReviews, setSelectAllReviews] = useState(false);
  const [reviewBulkAction, setReviewBulkAction] = useState<
    "delete" | "approve" | "reject" | null
  >(null);
  const [reviewBulkActionDialog, setReviewBulkActionDialog] = useState(false);

  // Hide review checkboxes when no items are selected
  React.useEffect(() => {
    if (selectedReviews.length === 0 && showReviewCheckboxes) {
      setShowReviewCheckboxes(false);
    }
  }, [selectedReviews.length, showReviewCheckboxes]);

  // Review selection handlers
  const handleSelectReview = (reviewId: number) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId],
    );
  };

  const handleSelectAllReviews = () => {
    if (selectAllReviews) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(allReviews.map((r) => r.id));
    }
    setSelectAllReviews(!selectAllReviews);
  };

  const handleReviewBulkAction = (
    action: "delete" | "approve" | "reject",
  ) => {
    setReviewBulkAction(action);
    setReviewBulkActionDialog(true);
  };

  // Bulk review mutations
  const bulkDeleteReviewsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(
        ids.map((id) =>
          apiRequest(`/api/admin/reviews/${id}`, { method: "DELETE" }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      setSelectedReviews([]);
      setSelectAllReviews(false);
      toast({
        title: `${selectedReviews.length} reviews deleted successfully`,
      });
      loadReviews(reviewsCurrentPage, true);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting reviews",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUpdateReviewsMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: string }) => {
      await Promise.all(
        ids.map((id) =>
          apiRequest(`/api/admin/reviews/${id}/${action}`, {
            method: "PUT",
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      setSelectedReviews([]);
      setSelectAllReviews(false);
      toast({
        title: `${selectedReviews.length} reviews updated successfully`,
      });
      loadReviews(reviewsCurrentPage, true);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating reviews",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeReviewBulkAction = () => {
    switch (reviewBulkAction) {
      case "delete":
        bulkDeleteReviewsMutation.mutate(selectedReviews);
        break;
      case "approve":
        bulkUpdateReviewsMutation.mutate({
          ids: selectedReviews,
          action: "approve",
        });
        break;
      case "reject":
        bulkUpdateReviewsMutation.mutate({
          ids: selectedReviews,
          action: "reject",
        });
        break;
    }
    setReviewBulkActionDialog(false);
  };

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Management</h2>
          <p className="text-muted-foreground">Manage and moderate customer reviews</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Customer Reviews
          </CardTitle>
          <CardDescription>
            Moderate customer product reviews and ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search reviews by product name, customer, or comment..."
                value={reviewsSearchTerm}
                onChange={(e) => setReviewsSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={reviewsFilters.status}
              onValueChange={(value) =>
                setReviewsFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={reviewsFilters.rating}
              onValueChange={(value) =>
                setReviewsFilters((prev) => ({ ...prev, rating: value }))
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${reviewsFilters.sortBy}-${reviewsFilters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split("-");
                setReviewsFilters((prev) => ({
                  ...prev,
                  sortBy,
                  sortOrder: sortOrder as "asc" | "desc",
                }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="rating-desc">Highest Rating</SelectItem>
                <SelectItem value="rating-asc">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedReviews.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-800">
                    {selectedReviews.length} review
                    {selectedReviews.length > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewBulkAction("approve")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewBulkAction("reject")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject All
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReviewBulkAction("delete")}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReviews([]);
                        setSelectAllReviews(false);
                      }}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={showReviewCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                  {showReviewCheckboxes && (
                    <Checkbox
                      checked={selectAllReviews}
                      onCheckedChange={handleSelectAllReviews}
                    />
                  )}
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {reviewsSearchTerm || Object.values(reviewsFilters).some((f) => f && f !== "all")
                      ? "No reviews found matching your filters."
                      : "No reviews available."}
                  </TableCell>
                </TableRow>
              ) : (
                allReviews.map((review: any) => (
                  <TableRow 
                    key={review.id}
                    className="hover:bg-muted/50 hover:shadow-md cursor-pointer transition-all duration-200"
                    onClick={() => {
                      setShowReviewCheckboxes(true);
                      handleSelectReview(review.id);
                    }}
                  >
                    <TableCell className={showReviewCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                      {showReviewCheckboxes && (
                        <Checkbox
                          checked={selectedReviews.includes(review.id)}
                          onCheckedChange={() => handleSelectReview(review.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{review.product?.name || "Product Deleted"}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.user?.firstName} {review.user?.lastName}</div>
                        <div className="text-sm text-muted-foreground">{review.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm">({review.rating})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {review.title && (
                          <div className="font-medium mb-1">{review.title}</div>
                        )}
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {review.comment}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          review.isApproved === true
                            ? "default"
                            : review.isApproved === false
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {review.isApproved === true
                          ? "Approved"
                          : review.isApproved === false
                          ? "Rejected"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {review.isApproved !== true ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveReviewMutation.mutate(review.id);
                            }}
                            disabled={approveReviewMutation.isPending}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectReviewMutation.mutate(review.id);
                            }}
                            disabled={rejectReviewMutation.isPending}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReviewMutation.mutate(review.id);
                          }}
                          disabled={deleteReviewMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {reviewsTotal > 0 && (
            <div className="flex items-center justify-between px-2 mt-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Showing {(reviewsCurrentPage - 1) * reviewsItemsPerPage + 1} to{" "}
                {Math.min(reviewsCurrentPage * reviewsItemsPerPage, reviewsTotal)} of{" "}
                {reviewsTotal} reviews
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={reviewsItemsPerPage.toString()}
                    onValueChange={(value) => {
                      setReviewsItemsPerPage(Number(value));
                      setReviewsCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={reviewsItemsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={pageSize.toString()}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {reviewsCurrentPage} of{" "}
                  {Math.ceil(reviewsTotal / reviewsItemsPerPage)}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => setReviewsCurrentPage(1)}
                    disabled={reviewsCurrentPage === 1}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setReviewsCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={reviewsCurrentPage === 1}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setReviewsCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(reviewsTotal / reviewsItemsPerPage),
                        ),
                      )
                    }
                    disabled={
                      reviewsCurrentPage ===
                      Math.ceil(reviewsTotal / reviewsItemsPerPage)
                    }
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() =>
                      setReviewsCurrentPage(
                        Math.ceil(reviewsTotal / reviewsItemsPerPage),
                      )
                    }
                    disabled={
                      reviewsCurrentPage ===
                      Math.ceil(reviewsTotal / reviewsItemsPerPage)
                    }
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog
        open={reviewBulkActionDialog}
        onOpenChange={setReviewBulkActionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {reviewBulkAction}{" "}
              {selectedReviews.length} selected review
              {selectedReviews.length > 1 ? "s" : ""}?
              {reviewBulkAction === "delete" &&
                " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeReviewBulkAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const renderEditor = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Website Editor</h2>
            <p className="text-muted-foreground">
              Manage hero section and footer content
            </p>
          </div>
        </div>

        {/* Site Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site Branding
            </CardTitle>
            <CardDescription>
              Manage your site logo and favicon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Site Name */}
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  id="site-name"
                  defaultValue={editorSettings?.siteName || "EcomStore"}
                  placeholder="Enter your site name"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      updateEditorSettings.mutate({
                        siteName: target.value,
                      });
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                    if (input) {
                      updateEditorSettings.mutate({
                        siteName: input.value,
                      });
                    }
                  }}
                  disabled={updateEditorSettings.isPending}
                >
                  {updateEditorSettings.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This name will appear in the header and throughout your site
              </p>
            </div>

            {/* Site Logo */}
            <div className="space-y-2">
              <Label htmlFor="site-logo">Site Logo</Label>
              {editorSettings?.siteLogo && (
                <div className="mb-4 relative">
                  <img
                    src={editorSettings.siteLogo}
                    alt="Current site logo"
                    className="max-w-xs h-20 object-contain rounded-lg border bg-white p-2"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => {
                      updateEditorSettings.mutate({
                        siteLogo: "",
                      });
                    }}
                    title="Delete site logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current site logo
                  </p>
                </div>
              )}
              <input
                id="site-logo"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("files", file);
                    
                    try {
                      const response = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const result = await response.json();
                      if (result.files && result.files.length > 0) {
                        updateEditorSettings.mutate({
                          siteLogo: result.files[0],
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Upload Failed",
                        description: "Failed to upload site logo",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full"
              />
              <p className="text-sm text-muted-foreground">
                Upload your site logo (PNG recommended for transparency)
              </p>
            </div>

            {/* Favicon */}
            <div className="space-y-2">
              <Label htmlFor="favicon">Favicon</Label>
              {editorSettings?.favicon && (
                <div className="mb-4 relative">
                  <img
                    src={editorSettings.favicon}
                    alt="Current favicon"
                    className="w-8 h-8 object-contain rounded border bg-white p-1"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 left-10 h-8 w-8 p-0"
                    onClick={() => {
                      updateEditorSettings.mutate({
                        favicon: "",
                      });
                    }}
                    title="Delete favicon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current favicon
                  </p>
                </div>
              )}
              <input
                id="favicon"
                type="file"
                accept="image/*,.ico"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("files", file);
                    
                    try {
                      const response = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const result = await response.json();
                      if (result.files && result.files.length > 0) {
                        updateEditorSettings.mutate({
                          favicon: result.files[0],
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Upload Failed",
                        description: "Failed to upload favicon",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full"
              />
              <p className="text-sm text-muted-foreground">
                Upload a favicon (16x16 or 32x32 pixels, .ico or .png)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Hero Section
            </CardTitle>
            <CardDescription>
              Manage the main hero image displayed on the homepage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-image">Hero Image</Label>
              {editorSettings?.heroImage && (
                <div className="mb-4 relative">
                  <img
                    src={editorSettings.heroImage}
                    alt="Current hero image"
                    className="max-w-md h-40 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => {
                      updateEditorSettings.mutate({
                        heroImage: "",
                      });
                    }}
                    title="Delete hero image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current hero image
                  </p>
                </div>
              )}
              <input
                id="hero-image"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("files", file);
                    
                    try {
                      const response = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const result = await response.json();
                      if (result.files && result.files.length > 0) {
                        updateEditorSettings.mutate({
                          heroImage: result.files[0],
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Upload Failed",
                        description: "Failed to upload hero image",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full"
              />
              <p className="text-sm text-muted-foreground">
                Upload a new hero image for your homepage banner
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Footer Settings
            </CardTitle>
            <CardDescription>
              Manage footer contact information and social links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <Button
                  onClick={() => {
                    updateEditorSettings.mutate({
                      footerEmail: editorFormData.footerEmail,
                      footerPhone: editorFormData.footerPhone,
                      footerAddress: editorFormData.footerAddress,
                    });
                  }}
                  disabled={updateEditorSettings.isPending}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateEditorSettings.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer-email">Email Address</Label>
                  <Input
                    id="footer-email"
                    type="email"
                    placeholder="contact@yourstore.com"
                    value={editorFormData.footerEmail}
                    onChange={(e) => {
                      setEditorFormData(prev => ({
                        ...prev,
                        footerEmail: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-phone">Phone Number</Label>
                  <Input
                    id="footer-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={editorFormData.footerPhone}
                    onChange={(e) => {
                      setEditorFormData(prev => ({
                        ...prev,
                        footerPhone: e.target.value,
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-address">Address</Label>
                <Textarea
                  id="footer-address"
                  placeholder="123 Main Street, City, State 12345"
                  value={editorFormData.footerAddress}
                  onChange={(e) => {
                    setEditorFormData(prev => ({
                      ...prev,
                      footerAddress: e.target.value,
                    }));
                  }}
                  rows={3}
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Social Media Links</h3>
                <Button
                  onClick={() => {
                    updateEditorSettings.mutate({
                      facebookLink: editorFormData.facebookLink,
                      twitterLink: editorFormData.twitterLink,
                      instagramLink: editorFormData.instagramLink,
                      linkedinLink: editorFormData.linkedinLink,
                    });
                  }}
                  disabled={updateEditorSettings.isPending}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateEditorSettings.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook-link">Facebook URL</Label>
                  <Input
                    id="facebook-link"
                    type="url"
                    placeholder="https://facebook.com/yourstore"
                    value={editorFormData.facebookLink}
                    onChange={(e) => {
                      setEditorFormData(prev => ({
                        ...prev,
                        facebookLink: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter-link">Twitter URL</Label>
                  <Input
                    id="twitter-link"
                    type="url"
                    placeholder="https://twitter.com/yourstore"
                    value={editorFormData.twitterLink}
                    onChange={(e) => {
                      setEditorFormData(prev => ({
                        ...prev,
                        twitterLink: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram-link">Instagram URL</Label>
                  <Input
                    id="instagram-link"
                    type="url"
                    placeholder="https://instagram.com/yourstore"
                    value={editorFormData.instagramLink}
                    onChange={(e) => {
                      setEditorFormData(prev => ({
                        ...prev,
                        instagramLink: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin-link">LinkedIn URL</Label>
                  <Input
                    id="linkedin-link"
                    type="url"
                    placeholder="https://linkedin.com/company/yourstore"
                    value={editorFormData.linkedinLink}
                    onChange={(e) => {
                      setEditorFormData(prev => ({
                        ...prev,
                        linkedinLink: e.target.value,
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Current Settings Preview */}
            {editorSettings && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Current Settings Preview</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {editorSettings.footerEmail || "Not set"}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {editorSettings.footerPhone || "Not set"}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Address:</span>{" "}
                      {editorSettings.footerAddress || "Not set"}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    {editorSettings.facebookLink && (
                      <a
                        href={editorSettings.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Facebook
                      </a>
                    )}
                    {editorSettings.twitterLink && (
                      <a
                        href={editorSettings.twitterLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm"
                      >
                        Twitter
                      </a>
                    )}
                    {editorSettings.instagramLink && (
                      <a
                        href={editorSettings.instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline text-sm"
                      >
                        Instagram
                      </a>
                    )}
                    {editorSettings.linkedinLink && (
                      <a
                        href={editorSettings.linkedinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline text-sm"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-muted-foreground">
              Configure tax rates, shipping costs, and other pricing settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetchSystemSettings()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditingSetting({
                  id: 0,
                  key: "",
                  value: "",
                  type: "string",
                  label: "",
                  description: "",
                  isActive: true,
                  createdAt: "",
                  updatedAt: "",
                });
                setSettingDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Setting
            </Button>
          </div>
        </div>

        {systemSettingsError && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-800">Error loading settings: {systemSettingsError.message}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pricing & Configuration Settings
            </CardTitle>
            <CardDescription>
              Manage tax rates, shipping costs, and other system-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemSettings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No system settings configured.</p>
                  <Button
                    className="mt-4"
                    onClick={() => refetchSystemSettings()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Settings
                  </Button>
                </div>
              ) : (
                systemSettings
                  .filter((setting: SystemSetting) => 
                    !setting.key.startsWith('search_include_') && 
                    !setting.key.startsWith('encryption_')
                  )
                  .map((setting: SystemSetting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{setting.label}</h3>
                        <Badge variant="outline" className="text-xs">
                          {setting.key}
                        </Badge>
                        <Badge
                          variant={setting.isActive ? "default" : "secondary"}
                        >
                          {setting.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                          Value: <span className="font-mono">{setting.value}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Type: {setting.type}
                        </p>
                      </div>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.isActive}
                        onCheckedChange={(checked) => {
                          updateSystemSetting.mutate({
                            ...setting,
                            isActive: checked,
                          });
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSetting(setting);
                          setSettingDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this system setting?",
                            )
                          ) {
                            deleteSystemSetting.mutate(setting.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Settings for Common Values */}
        {systemSettings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Configuration</CardTitle>
              <CardDescription>
                Common settings for currency, tax rates and shipping costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={systemSettings.find(s => s.key === 'currency')?.value || 'USD'}
                    onValueChange={(value) => {
                      const currencySetting = systemSettings.find(s => s.key === 'currency');
                      if (currencySetting) {
                        updateSystemSetting.mutate({
                          ...currencySetting,
                          value: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="PKR">PKR (₨)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="5"
                      min="0"
                      max="100"
                      step="0.1"
                      value={
                        systemSettings.find(s => s.key === 'tax_rate')?.value || ''
                      }
                      onChange={(e) => {
                        const taxSetting = systemSettings.find(s => s.key === 'tax_rate');
                        if (taxSetting) {
                          updateSystemSetting.mutate({
                            ...taxSetting,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Shipping Cost (PKR)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="150"
                      min="0"
                      step="1"
                      value={
                        systemSettings.find(s => s.key === 'shipping_cost')?.value || ''
                      }
                      onChange={(e) => {
                        const shippingSetting = systemSettings.find(s => s.key === 'shipping_cost');
                        if (shippingSetting) {
                          updateSystemSetting.mutate({
                            ...shippingSetting,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">PKR</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Free Shipping Threshold (PKR)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="2000"
                      min="0"
                      step="1"
                      value={
                        systemSettings.find(s => s.key === 'free_shipping_threshold')?.value || ''
                      }
                      onChange={(e) => {
                        const thresholdSetting = systemSettings.find(s => s.key === 'free_shipping_threshold');
                        if (thresholdSetting) {
                          updateSystemSetting.mutate({
                            ...thresholdSetting,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">PKR</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Management
            </CardTitle>
            <CardDescription>
              Control which product types appear in search results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="search_simple"
                    checked={searchSettings?.search_include_simple !== false}
                    onCheckedChange={(checked) => handleSearchSettingChange('search_include_simple', checked)}
                  />
                  <label htmlFor="search_simple" className="text-sm font-medium">
                    Include Simple Products
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="search_featured"
                    checked={searchSettings?.search_include_featured !== false}
                    onCheckedChange={(checked) => handleSearchSettingChange('search_include_featured', checked)}
                  />
                  <label htmlFor="search_featured" className="text-sm font-medium">
                    Include Featured Products
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="search_new_arrivals"
                    checked={searchSettings?.search_include_new_arrivals !== false}
                    onCheckedChange={(checked) => handleSearchSettingChange('search_include_new_arrivals', checked)}
                  />
                  <label htmlFor="search_new_arrivals" className="text-sm font-medium">
                    Include New Arrivals
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="search_flash_sale"
                    checked={searchSettings?.search_include_flash_sale !== false}
                    onCheckedChange={(checked) => handleSearchSettingChange('search_include_flash_sale', checked)}
                  />
                  <label htmlFor="search_flash_sale" className="text-sm font-medium">
                    Include Flash Sale Products
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button 
                  onClick={saveSearchSettings}
                  disabled={searchSettingsUpdating}
                  className="w-full"
                >
                  {searchSettingsUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Search Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Application Version</Label>
                <p className="text-sm text-muted-foreground">v1.0.0</p>
              </div>
              <div>
                <Label>Database Status</Label>
                <Badge variant="default">Connected</Badge>
              </div>
              <div>
                <Label>Cache Status</Label>
                <Badge variant={showUpdateNotification && updateMessage.includes("Clearing") ? "destructive" : "default"}>
                  {showUpdateNotification && updateMessage.includes("Clearing") ? "Clearing..." : "Active"}
                </Badge>
              </div>
              <div>
                <Label>Last Cache Clear</Label>
                <p className="text-sm text-muted-foreground">
                  {lastUpdateTime.cache ? new Date(lastUpdateTime.cache).toLocaleTimeString() : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              System maintenance and data management tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cache Status Info */}
            {showUpdateNotification && updateMessage.includes("Clearing") && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Clearing React Query cache, browser storage, service worker cache, and refreshing all data...
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={handleExportDatabase}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearCache}
                disabled={showUpdateNotification && updateMessage.includes("Clearing")}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${showUpdateNotification && updateMessage.includes("Clearing") ? 'animate-spin' : ''}`} />
                {showUpdateNotification && updateMessage.includes("Clearing") ? "Clearing..." : "Clear All Caches"}
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('database-import-input')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Database
              </Button>
              <Button variant="destructive" onClick={handleDeleteDatabase}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Database
              </Button>
              <input
                id="database-import-input"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleDatabaseImport}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Mobile sidebar component
  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Admin Panel</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.id === "orders" && awaitingOrders.length > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {awaitingOrders.length}
                </Badge>
              )}
            </Button>
          ))}
          <div className="border-t pt-2 mt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                window.open("/", "_blank");
                setSidebarOpen(false);
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Store
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600"
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "products":
        return renderProducts();
      case "orders":
        return renderOrders();
      case "users":
        return renderUsers();
      case "categories":
        return renderCategories();
      case "coupons":
        return renderCoupons();
      case "reviews":
        return renderReviews();
      case "payments":
        return renderPayments();
      case "encryption":
        return <EncryptionSettings />;
      case "editor":
        return renderEditor();
      case "settings":
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Real-time Update Notification Banner */}
      {showUpdateNotification && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 flex items-center justify-center shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            <span className="font-medium">{updateMessage}</span>
          </div>
        </div>
      )}
      
      {/* Auto-refresh Status Indicator */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-gray-600">Auto-refresh active</span>
        {lastUpdateTime[activeSection] && (
          <span className="text-xs text-gray-500">
            Last: {new Date(lastUpdateTime[activeSection]).toLocaleTimeString()}
          </span>
        )}
      </div>
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white shadow-sm border-r">
          {/* Logo/Header */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">eCommerce Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveSection(item.id);
                        setSearchTerm("");
                        setFilterStatus("all");
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                      {item.id === "orders" && awaitingOrders.length > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto text-xs"
                        >
                          {awaitingOrders.length}
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open("/", "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Store
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b md:hidden bg-white">
          <MobileSidebar />
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 capitalize">
                {sidebarItems.find((item) => item.id === activeSection)
                  ?.label || "Dashboard"}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>

      {/* Bulk Actions Dialog */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "delete" && "Delete Orders"}
              {bulkAction === "status" && "Update Order Status"}
              {bulkAction === "payment" && "Update Payment Status"}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === "delete" &&
                `Are you sure you want to delete ${selectedOrders.length} order(s)? This action cannot be undone.`}
              {bulkAction === "status" &&
                `Update the order status for ${selectedOrders.length} selected order(s).`}
              {bulkAction === "payment" &&
                `Update the payment status for ${selectedOrders.length} selected order(s).`}
            </DialogDescription>
          </DialogHeader>

          {bulkAction === "status" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulkStatus">New Order Status</Label>
                <Select
                  value={bulkStatusValue}
                  onValueChange={setBulkStatusValue}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {bulkAction === "payment" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulkPayment">New Payment Status</Label>
                <Select
                  value={bulkPaymentValue}
                  onValueChange={setBulkPaymentValue}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="awaiting_confirmation">
                      Awaiting Confirmation
                    </SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === "delete" ? "destructive" : "default"}
              onClick={executeBulkAction}
              disabled={
                (bulkAction === "status" && !bulkStatusValue) ||
                (bulkAction === "payment" && !bulkPaymentValue) ||
                bulkDeleteMutation.isPending ||
                bulkStatusUpdateMutation.isPending ||
                bulkPaymentUpdateMutation.isPending
              }
            >
              {bulkAction === "delete" && "Delete Orders"}
              {bulkAction === "status" && "Update Status"}
              {bulkAction === "payment" && "Update Payment Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={viewOrderDialog} onOpenChange={setViewOrderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Review order information and payment proof
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="font-medium">
                        {selectedOrder.user
                          ? `${selectedOrder.user.firstName || ""} ${selectedOrder.user.lastName || ""}`.trim()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Username</Label>
                      <p className="font-mono">
                        {selectedOrder.user?.username || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Email Address
                      </Label>
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedOrder.user?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">User ID</Label>
                      <p className="font-mono">
                        #{selectedOrder.userId || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="pt-2 border-t">
                    <Label className="text-sm font-medium">
                      Account Status
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          selectedOrder.user?.isActive
                            ? "default"
                            : "destructive"
                        }
                      >
                        {selectedOrder.user?.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Member since{" "}
                        {selectedOrder.user?.createdAt
                          ? new Date(
                              selectedOrder.user.createdAt,
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Order Status
                      </Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Payment Status
                      </Label>
                      <div className="mt-1">
                        {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Payment Method
                      </Label>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {selectedOrder.paymentMethod}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Total Amount
                      </Label>
                      <p className="text-lg font-semibold">
                        ${selectedOrder.totalAmount}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Order Date</Label>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{formatAddress(selectedOrder.shippingAddress)}</p>
                </CardContent>
              </Card>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {item.product.images &&
                              item.product.images.length > 0 && (
                                <img
                                  src={
                                    typeof item.product.images[0] === "string"
                                      ? item.product.images[0]
                                      : JSON.parse(
                                          item.product.images[0] || "[]",
                                        )[0]
                                  }
                                  alt={item.product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.price}</p>
                            <p className="text-sm text-muted-foreground">
                              Total: $
                              {(parseFloat(item.price) * item.quantity).toFixed(
                                2,
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Proof */}
              {selectedOrder.paymentProof && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Payment Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <img
                        src={selectedOrder.paymentProof}
                        alt="Payment Proof"
                        className="max-w-full h-auto border rounded-lg"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selectedOrder.paymentProof, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Management Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderStatus">Order Status</Label>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) =>
                          updateOrderStatusMutation.mutate({
                            id: selectedOrder.id,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentStatus">Payment Status</Label>
                      <Select
                        value={selectedOrder.paymentStatus}
                        onValueChange={(value) =>
                          updatePaymentStatusMutation.mutate({
                            id: selectedOrder.id,
                            paymentStatus: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="awaiting_confirmation">
                            Awaiting Confirmation
                          </SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quick Actions for Payment Confirmation */}
                  {selectedOrder.paymentStatus === "awaiting_confirmation" && (
                    <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-amber-800">
                        Payment Verification Required
                      </h4>
                      <div>
                        <Label htmlFor="adminNotes">
                          Admin Notes (Optional)
                        </Label>
                        <Textarea
                          id="adminNotes"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add any notes about this payment verification..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleApprovePayment}
                          disabled={approvePayment.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve Payment
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setRejectDialog(true)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject Payment
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Coupon Information */}
              {selectedOrder.couponCode && (
                <Card>
                  <CardHeader>
                    <CardTitle>Applied Coupon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Coupon Code</Label>
                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {selectedOrder.couponCode}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Discount Applied
                      </Label>
                      <p className="text-sm text-green-600">
                        ${selectedOrder.discountAmount || "0.00"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Previous Admin Actions */}
              {(selectedOrder.adminNotes || selectedOrder.rejectionReason) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Admin History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedOrder.adminNotes && (
                      <div>
                        <Label className="text-sm font-medium">
                          Admin Notes
                        </Label>
                        <p className="text-sm">{selectedOrder.adminNotes}</p>
                      </div>
                    )}
                    {selectedOrder.rejectionReason && (
                      <div>
                        <Label className="text-sm font-medium">
                          Rejection Reason
                        </Label>
                        <p className="text-sm text-red-600">
                          {selectedOrder.rejectionReason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this payment is being rejected..."
                required
              />
            </div>
            <div>
              <Label htmlFor="adminNotesReject">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotesReject"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPayment}
              disabled={!rejectionReason.trim() || rejectPayment.isPending}
            >
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Settings Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPayment?.id === 0 ? "Add Payment Method" : "Edit Payment Settings"}
            </DialogTitle>
            <DialogDescription>
              {editingPayment?.id === 0 
                ? "Configure a new payment method for customers"
                : "Update payment method configuration"
              }
            </DialogDescription>
          </DialogHeader>
          {editingPayment && (
            <div className="space-y-4">
              {/* Provider Selection - Only for new payments */}
              {editingPayment.id === 0 && (
                <div>
                  <Label htmlFor="provider">Payment Provider *</Label>
                  <Select
                    value={editingPayment.provider}
                    onValueChange={(value) =>
                      setEditingPayment({
                        ...editingPayment,
                        provider: value,
                        name: value === "cod" 
                          ? "Cash on Delivery" 
                          : value === "easypaisa" 
                          ? "EasyPaisa" 
                          : value === "jazzcash" 
                          ? "JazzCash" 
                          : value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                      <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                      <SelectItem value="jazzcash">JazzCash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Display current provider for existing payments */}
              {editingPayment.id !== 0 && (
                <div>
                  <Label>Payment Provider</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    {editingPayment.provider === "cod" && <Banknote className="h-4 w-4" />}
                    {(editingPayment.provider === "easypaisa" || editingPayment.provider === "jazzcash") && (
                      <Phone className="h-4 w-4" />
                    )}
                    <span className="font-medium capitalize">{editingPayment.provider}</span>
                  </div>
                </div>
              )}

              {/* Account Number - Only for digital payment methods */}
              {editingPayment.provider !== "cod" && (
                <div>
                  <Label htmlFor="accountNumber">
                    {editingPayment.provider === "easypaisa" || editingPayment.provider === "jazzcash" 
                      ? "Mobile Number *" 
                      : "Account Number *"
                    }
                  </Label>
                  <Input
                    id="accountNumber"
                    value={editingPayment.accountNumber || ""}
                    onChange={(e) =>
                      setEditingPayment({
                        ...editingPayment,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder={
                      editingPayment.provider === "easypaisa" || editingPayment.provider === "jazzcash"
                        ? "03XXXXXXXXX"
                        : "Enter account number"
                    }
                  />
                </div>
              )}

              {/* Account Name - Only for digital payment methods */}
              {editingPayment.provider !== "cod" && (
                <div>
                  <Label htmlFor="accountName">Account Holder Name *</Label>
                  <Input
                    id="accountName"
                    value={editingPayment.accountName || ""}
                    onChange={(e) =>
                      setEditingPayment({
                        ...editingPayment,
                        accountName: e.target.value,
                      })
                    }
                    placeholder="Enter account holder name"
                  />
                </div>
              )}

              {/* Instructions */}
              <div>
                <Label htmlFor="instructions">Payment Instructions</Label>
                <Textarea
                  id="instructions"
                  value={editingPayment.instructions || ""}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      instructions: e.target.value,
                    })
                  }
                  placeholder={
                    editingPayment.provider === "cod"
                      ? "Special instructions for cash on delivery (e.g., exact change requirements)"
                      : editingPayment.provider === "easypaisa"
                      ? "Instructions for EasyPaisa payment (e.g., send payment to this number and share screenshot)"
                      : editingPayment.provider === "jazzcash"
                      ? "Instructions for JazzCash payment (e.g., send payment to this number and share screenshot)"
                      : "Payment instructions for customers"
                  }
                  rows={3}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={editingPayment.isActive}
                  onCheckedChange={(checked) =>
                    setEditingPayment({
                      ...editingPayment,
                      isActive: checked,
                    })
                  }
                />
                <Label htmlFor="isActive">Enable this payment method</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingPayment) {
                  if (editingPayment.id === 0) {
                    // Create new payment setting
                    const { id, name, ...paymentData } = editingPayment;
                    createPaymentSetting.mutate(paymentData);
                  } else {
                    // Update existing payment setting
                    updatePaymentSetting.mutate(editingPayment);
                  }
                }
              }}
              disabled={createPaymentSetting.isPending || updatePaymentSetting.isPending}
            >
              {createPaymentSetting.isPending || updatePaymentSetting.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : editingPayment?.id === 0 ? (
                "Add Payment Method"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Filters Dialog */}
      <Dialog open={showProductFilters} onOpenChange={setShowProductFilters}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Filters</DialogTitle>
            <DialogDescription>
              Apply filters to find specific products in your catalog
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Category</Label>
                <Select
                  value={productFilters.category}
                  onValueChange={(value) =>
                    setProductFilters((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Array.isArray(allCategories) &&
                      (allCategories as Category[]).map((category: Category) => (
                        <SelectItem
                          key={category.id}
                          value={
                            category.id?.toString() || `cat-${category.id}`
                          }
                        >
                          {category.name || "Unnamed Category"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={productFilters.status}
                  onValueChange={(value) =>
                    setProductFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                    <SelectItem value="archived">Archived Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <Label>Price Range</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Min price"
                  type="number"
                  value={productFilters.priceMin}
                  onChange={(e) =>
                    setProductFilters((prev) => ({
                      ...prev,
                      priceMin: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Max price"
                  type="number"
                  value={productFilters.priceMax}
                  onChange={(e) =>
                    setProductFilters((prev) => ({
                      ...prev,
                      priceMax: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Stock and Featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Stock Status</Label>
                <Select
                  value={productFilters.stock}
                  onValueChange={(value) =>
                    setProductFilters((prev) => ({ ...prev, stock: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Product Type</Label>
                <Select
                  value={productFilters.featured}
                  onValueChange={(value) =>
                    setProductFilters((prev) => ({ ...prev, featured: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="flash-sale">Flash Sale</SelectItem>
                    <SelectItem value="new-arrivals">New Arrivals</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Color</Label>
                <Input
                  placeholder="Filter by color..."
                  value={productFilters.color}
                  onChange={(e) =>
                    setProductFilters((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Brand</Label>
                <Input
                  placeholder="Filter by brand..."
                  value={productFilters.brand}
                  onChange={(e) =>
                    setProductFilters((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setProductFilters({
                  category: "",
                  status: "all",
                  priceMin: "",
                  priceMax: "",
                  stock: "all",
                  featured: "all",
                  color: "",
                  brand: "",
                });
              }}
            >
              Clear All
            </Button>
            <Button onClick={() => setShowProductFilters(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Bulk Action Dialog */}
      <Dialog
        open={productBulkActionDialog}
        onOpenChange={setProductBulkActionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action Confirmation</DialogTitle>
            <DialogDescription>
              {productBulkAction === "delete"
                ? `Are you sure you want to delete ${selectedProducts.length} selected products? This action cannot be undone.`
                : productBulkAction === "featured"
                  ? `Mark ${selectedProducts.length} selected products as featured?`
                  : `Mark ${selectedProducts.length} selected products as active?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductBulkActionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={
                productBulkAction === "delete" ? "destructive" : "default"
              }
              onClick={executeProductBulkAction}
              disabled={
                bulkDeleteProductsMutation.isPending ||
                bulkUpdateProductsMutation.isPending
              }
            >
              {bulkDeleteProductsMutation.isPending ||
              bulkUpdateProductsMutation.isPending
                ? "Processing..."
                : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders Filters Dialog */}
      <Dialog open={showOrdersFilters} onOpenChange={setShowOrdersFilters}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Filters</DialogTitle>
            <DialogDescription>
              Apply filters to find specific orders in your system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Order Status</Label>
                <Select
                  value={ordersFilters.status}
                  onValueChange={(value) =>
                    setOrdersFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All order status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Order Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Status</Label>
                <Select
                  value={ordersFilters.paymentStatus}
                  onValueChange={(value) =>
                    setOrdersFilters((prev) => ({
                      ...prev,
                      paymentStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Status</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="awaiting_confirmation">
                      Awaiting Confirmation
                    </SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Method and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={ordersFilters.paymentMethod}
                  onValueChange={(value) =>
                    setOrdersFilters((prev) => ({
                      ...prev,
                      paymentMethod: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All payment methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Methods</SelectItem>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Range</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="From date"
                    type="date"
                    value={ordersFilters.dateFrom}
                    onChange={(e) =>
                      setOrdersFilters((prev) => ({
                        ...prev,
                        dateFrom: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="To date"
                    type="date"
                    value={ordersFilters.dateTo}
                    onChange={(e) =>
                      setOrdersFilters((prev) => ({
                        ...prev,
                        dateTo: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOrdersFilters({
                  status: "all",
                  paymentStatus: "all",
                  paymentMethod: "all",
                  dateFrom: "",
                  dateTo: "",
                });
              }}
            >
              Clear All
            </Button>
            <Button onClick={() => setShowOrdersFilters(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Settings Dialog */}
      <Dialog open={settingDialog} onOpenChange={setSettingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSetting?.id === 0 ? "Add System Setting" : "Edit System Setting"}
            </DialogTitle>
            <DialogDescription>
              Configure system-wide settings for pricing and functionality
            </DialogDescription>
          </DialogHeader>
          {editingSetting && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="settingKey">Setting Key</Label>
                <Input
                  id="settingKey"
                  value={editingSetting.key}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      key: e.target.value,
                    })
                  }
                  placeholder="e.g., tax_rate, shipping_cost"
                />
              </div>
              <div>
                <Label htmlFor="settingLabel">Display Label</Label>
                <Input
                  id="settingLabel"
                  value={editingSetting.label}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      label: e.target.value,
                    })
                  }
                  placeholder="e.g., Tax Rate (%)"
                />
              </div>
              <div>
                <Label htmlFor="settingValue">Value</Label>
                <Input
                  id="settingValue"
                  value={editingSetting.value}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      value: e.target.value,
                    })
                  }
                  placeholder="Enter setting value"
                />
              </div>
              <div>
                <Label htmlFor="settingType">Type</Label>
                <Select
                  value={editingSetting.type}
                  onValueChange={(value) =>
                    setEditingSetting({
                      ...editingSetting,
                      type: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="settingDescription">Description (Optional)</Label>
                <Textarea
                  id="settingDescription"
                  value={editingSetting.description || ""}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this setting's purpose"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSetting.isActive}
                  onCheckedChange={(checked) =>
                    setEditingSetting({
                      ...editingSetting,
                      isActive: checked,
                    })
                  }
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingSetting) {
                  if (editingSetting.id === 0) {
                    createSystemSetting.mutate(editingSetting);
                  } else {
                    updateSystemSetting.mutate(editingSetting);
                  }
                }
              }}
            >
              {editingSetting?.id === 0 ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}