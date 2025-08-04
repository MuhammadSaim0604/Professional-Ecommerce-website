import { Home, ShoppingCart, Grid3X3, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Get cart items count
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const cartItemsCount = Array.isArray(cartItems) ? cartItems.length : 0;

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
    },
    {
      icon: ShoppingCart,
      label: "Cart",
      path: "/cart",
      badge: cartItemsCount > 0 ? cartItemsCount : null,
    },
    {
      icon: Grid3X3,
      label: "Categories",
      path: "/categories",
    },
    {
      icon: User,
      label: "Account",
      path: user ? "/dashboard" : "/auth",
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link key={item.path} href={item.path}>
              <div className="flex flex-col items-center py-2 px-3 min-w-[60px]">
                <div className="relative">
                  <Icon 
                    className={`h-6 w-6 ${
                      active 
                        ? "text-primary" 
                        : "text-gray-500 dark:text-gray-400"
                    }`} 
                  />
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span 
                  className={`text-xs mt-1 ${
                    active 
                      ? "text-primary font-medium" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}