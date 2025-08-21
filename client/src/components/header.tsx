import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Package,
  Settings,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarInitials,
} from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchOverlay } from "@/components/search-overlay";
import { gsap } from "gsap";

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] =
    useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State to track URL search params
  const [urlSearchQuery, setUrlSearchQuery] = useState("");

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Update search query when location or URL parameters change
  useEffect(() => {
    const updateSearchQuery = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get("search") || "";
      setUrlSearchQuery(searchParam);
    };

    updateSearchQuery();

    // Listen for popstate events (back/forward navigation) and manual URL changes
    const handleLocationChange = () => {
      setTimeout(updateSearchQuery, 10); // Small delay to ensure URL is updated
    };

    window.addEventListener("popstate", handleLocationChange);

    // Also listen for pushstate/replacestate events (for programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      handleLocationChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [location]); // Re-run when wouter location changes

  const isOnSearchPage = Boolean(urlSearchQuery);

  // Update search query state when URL changes
  useEffect(() => {
    if (urlSearchQuery) {
      setSearchQuery(decodeURIComponent(urlSearchQuery));
    } else {
      setSearchQuery("");
    }
  }, [urlSearchQuery]);

  // Get cart items count
  const { data: cartItems } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Get wishlist items count
  const { data: wishlistItems } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  // Get editor settings for site logo and name
  const { data: editorSettings } = useQuery<{
    id: number;
    siteLogo?: string;
    siteName?: string;
    favicon?: string;
    heroImage?: string;
  }>({
    queryKey: ["/api/editor-settings"],
  });

  // Get notifications count
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  // Get categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const cartCount = Array.isArray(cartItems) ? cartItems.length : 0;
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;
  const unreadNotifications = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.isRead).length
    : 0;

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    const searchTerm = query.trim();
    const encodedSearch = encodeURIComponent(searchTerm);

    // Smart search logic based on current page
    if (location === "/products") {
      // On products page: search within products on same page
      navigate(`/products?search=${encodedSearch}`);
    } else if (location.startsWith("/category/")) {
      // On category page: search within that category on same page
      const categoryId = location.split("/")[2];
      navigate(`/category/${categoryId}?search=${encodedSearch}`);
    } else {
      // On home or other pages: navigate to search page
      navigate(`/search?search=${encodedSearch}`);
    }

    setSearchQuery("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Categories dropdown handlers
  const handleCategoriesMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setIsCategoriesDropdownOpen(true);
  };

  const handleCategoriesMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsCategoriesDropdownOpen(false);
    }, 150);
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - Hidden on mobile when searching */}
          <Link href="/" className={isOnSearchPage ? "hidden md:block" : ""}>
            <div className="flex items-center space-x-2">
              {editorSettings?.siteLogo ? (
                <img
                  src={editorSettings.siteLogo}
                  alt={editorSettings.siteName || "Site Logo"}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                  E
                </div>
              )}
              <span className="hidden font-bold text-xl sm:inline-block">
                {editorSettings?.siteName || "EcomStore"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on mobile when searching */}
          <nav
            className={`hidden md:flex items-center space-x-6 ${isOnSearchPage ? "" : ""}`}
          >
            {/* Home */}
            <Link href="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium"
              >
                Home
              </Button>
            </Link>

            {/* Products */}
            <Link href="/products">
              <Button
                variant={isActive("/products") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium"
              >
                Products
              </Button>
            </Link>

            {/* Categories Dropdown */}
            <div className="relative ">
              <Button
                variant={isActive("/categories") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium flex items-center space-x-1 cursor-pointer"
                onMouseEnter={handleCategoriesMouseEnter}
                onMouseLeave={handleCategoriesMouseLeave}
                onClick={() => navigate("/categories")}
              >
                <span>Categories</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${isCategoriesDropdownOpen ? "rotate-180" : ""}`}
                />
              </Button>

              {/* Categories Dropdown Content */}
              {isCategoriesDropdownOpen && (
                <div
                  className="absolute top-full left-0 w-80 bg-background border border-border rounded-xl shadow-xl z-[9999] py-4 max-h-96 overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                  onMouseEnter={handleCategoriesMouseEnter}
                  onMouseLeave={handleCategoriesMouseLeave}
                >
                  {/* Header */}
                  <div className="px-6 pb-4 border-b border-border/30">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Shop by Category
                    </h3>
                  </div>

                  {/* Categories List */}
                  <div className="py-2">
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map((category: any) => (
                        <div
                          key={category.id}
                          onClick={() => navigate(`/category/${category.slug}`)}
                          className="mx-3 px-3 py-3 hover:bg-accent/50 cursor-pointer transition-all duration-200 flex items-center justify-between group rounded-lg hover:bg-green-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full group-hover:bg-green-500 transition-colors duration-200"></div>
                            <div>
                              <span className="text-sm font-medium text-foreground group-hover:text-green-600 transition-colors duration-200">
                                {category.name}
                              </span>
                              {category.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronDown className="h-3 w-3 -rotate-90 text-muted-foreground/40 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all duration-200" />
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/30 flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        No categories available
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-border/30 mt-2 pt-4">
                    <div
                      onClick={() => navigate("/categories")}
                      className="mx-3 px-3 py-2.5 group-hover:bg-green-50 cursor-pointer transition-all duration-200 rounded-lg group"
                    >
                      <span className="text-sm font-medium text-black group-hover:text-green-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        View All Categories
                        <ChevronDown className="h-3 w-3 -rotate-90 group-hover:translate-x-1 transition-transform duration-200" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deals */}
            <Link href="/deals">
              <Button
                variant={isActive("/deals") ? "default" : "ghost"}
                size="sm"
                className="text-sm font-medium"
              >
                Deals
              </Button>
            </Link>
          </nav>

          {/* Mobile Search Bar - 95% width when on search page */}
          {isOnSearchPage && (
            <div className="md:hidden flex items-center w-[95%] mx-auto space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/products")}
                className="p-1.5 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <div
                className="relative flex-1 cursor-pointer"
                onClick={() => setIsMobileSearchOpen(true)}
              >
                <div className="flex items-center w-full px-3 py-2 border border-input rounded-full bg-background hover:bg-accent/50 transition-colors">
                  <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1">
                    {urlSearchQuery
                      ? decodeURIComponent(urlSearchQuery)
                      : "Search products..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            {isOnSearchPage ? (
              // Clickable search bar on desktop (with current search term)
              <div
                className="flex w-full cursor-pointer"
                onClick={() => setIsDesktopSearchOpen(true)}
              >
                <div className="flex-1 px-4 py-2 border border-input rounded-l-md bg-background hover:bg-accent/50 transition-colors flex items-center">
                  <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {urlSearchQuery
                      ? decodeURIComponent(urlSearchQuery)
                      : "Search products..."}
                  </span>
                </div>
                <Button className="rounded-l-none border-l-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Clickable search bar on desktop
              <div
                className="flex w-full cursor-pointer"
                onClick={() => setIsDesktopSearchOpen(true)}
              >
                <div className="flex-1 px-4 py-2 border border-input rounded-l-md bg-background hover:bg-accent/50 transition-colors flex items-center">
                  <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Search products...
                  </span>
                </div>
                <Button className="rounded-l-none border-l-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right Side Actions - Hidden on mobile when searching */}
          <div
            className={`flex items-center space-x-2 ${isOnSearchPage ? "hidden md:flex" : "flex"}`}
          >
            {/* Mobile Search Icon - Hidden when on search page */}
            {!isOnSearchPage && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Theme Toggle - Desktop Only */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Wishlist - Desktop Only */}
            <Link href="/wishlist">
              <Button
                variant="ghost"
                size="sm"
                className="relative hidden md:flex"
              >
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart - Desktop Only */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="sm"
                className="relative hidden md:flex"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    {user.avatar ? (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} alt={user.firstName} />
                        <AvatarFallback>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {unreadNotifications > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user.firstName} {user.lastName}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Desktop: Dashboard at top */}
                  <DropdownMenuItem asChild className="hidden md:flex">
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  {/* Mobile: Profile Settings at top (first position) */}
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>

                  {/* Always show: My Orders */}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard?tab=orders"
                      className="cursor-pointer"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>

                  {/* Always show: Notifications */}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard?tab=notifications"
                      className="cursor-pointer"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                      {unreadNotifications > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {unreadNotifications}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>

                  {/* Desktop only: Profile Settings after notifications */}
                  <DropdownMenuItem asChild className="hidden md:flex">
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>

                  {/* Mobile only: Wishlist */}
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                      {wishlistCount > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {wishlistCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search Overlays - Only render when needed */}
      {isMobileSearchOpen && (
        <SearchOverlay
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          variant="mobile"
          initialQuery={
            urlSearchQuery ? decodeURIComponent(urlSearchQuery) : ""
          }
        />
      )}

      {isDesktopSearchOpen && (
        <SearchOverlay
          isOpen={isDesktopSearchOpen}
          onClose={() => setIsDesktopSearchOpen(false)}
          variant="desktop"
          initialQuery={
            urlSearchQuery ? decodeURIComponent(urlSearchQuery) : ""
          }
        />
      )}
    </header>
  );
}
