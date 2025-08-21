import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  Sun,
  Moon,
  LogOut,
  Settings,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarInitials,
} from "@/components/ui/avatar";
import { SearchOverlay } from "@/components/search-overlay";

export function Header() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Get cart items count
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Get wishlist items count
  const { data: wishlistItems = [] } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  // Get editor settings for site logo
  const { data: editorSettings } = useQuery({
    queryKey: ["/api/editor-settings"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const cartItemsCount = Array.isArray(cartItems) ? cartItems.length : 0;
  const wishlistItemsCount = Array.isArray(wishlistItems)
    ? wishlistItems.length
    : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            {editorSettings?.siteLogo ? (
              <img
                src={editorSettings.siteLogo}
                alt="Site Logo"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <>
                <ShoppingCart className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">ShopHub</span>
              </>
            )}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
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
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Icon */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Wishlist */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => navigate("/wishlist")}
              >
                <Heart className="h-5 w-5" />
                {wishlistItemsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                  >
                    {wishlistItemsCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Avatar>
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.firstName} />
                      ) : (
                        <AvatarFallback>
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/wishlist")}>
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                {/* Mobile Navigation */}
                <nav className="mt-6 space-y-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => navigate("/")}
                  >
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => navigate("/products")}
                  >
                    Products
                  </Button>
                  {user ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => navigate("/dashboard")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => navigate("/wishlist")}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Wishlist ({wishlistItemsCount})
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => navigate("/cart")}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Cart ({cartItemsCount})
                      </Button>
                      {user.role === "admin" && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => navigate("/admin")}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => navigate("/auth")}
                    >
                      Sign In
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search Overlays */}
      <SearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        variant="mobile"
      />

      <SearchOverlay
        isOpen={isDesktopSearchOpen}
        onClose={() => setIsDesktopSearchOpen(false)}
        variant="desktop"
      />
    </header>
  );
}
