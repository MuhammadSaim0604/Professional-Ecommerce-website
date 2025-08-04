import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useFavicon } from "@/hooks/use-favicon";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import FloatingThemeToggle from "@/components/floating-theme-toggle";
import { ScrollRestoration } from "@/components/scroll-restoration";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Critical pages - loaded immediately
import NotFound from "@/pages/not-found";

// Alternative home pages for comparison
const HomePage = lazy(() => import("@/pages/advanced-home-page"));

// Lazy load non-critical pages for better performance
const AuthPage = lazy(() => import("@/pages/auth-page"));
const LoginPage = lazy(() => import("@/pages/login-page"));
const ProductsPage = lazy(() => import("@/pages/products-page"));
const SearchPage = lazy(() => import("@/pages/search-page"));
const ProductDetailPage = lazy(() => import("@/pages/product-detail-enhanced"));
const CartPage = lazy(() => import("@/pages/cart-page"));
const CheckoutPage = lazy(() => import("@/pages/checkout-enhanced-multi"));
const UserDashboard = lazy(() => import("@/pages/user-dashboard"));
const AdminCompleteEnhanced = lazy(() => import("@/pages/admin-complete-enhanced"));
const AdminProductsFixed = lazy(() => import("@/pages/admin-products-fixed"));
const WishlistPage = lazy(() => import("@/pages/wishlist-page"));
const CategoriesPage = lazy(() => import("@/pages/categories-page"));
const CategoryDetail = lazy(() => import("@/pages/category-detail"));
const DealsPage = lazy(() => import("@/pages/deals-page"));
const ProfileSettingsPage = lazy(() => import("@/pages/profile-settings-page"));
const OrderTrackingPage = lazy(() => import("@/pages/order-tracking-page"));
const HelpPage = lazy(() => import("@/pages/help"));
const ContactPage = lazy(() => import("@/pages/contact"));
const ShippingPage = lazy(() => import("@/pages/shipping"));
const ReturnsPage = lazy(() => import("@/pages/returns"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

function Router() {
  // Load favicon from editor settings
  useFavicon();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScrollRestoration />
      <Switch>
        {/* Admin routes - no footer */}
        <Route path="/admin">
          <Header />
          <main className="flex-1">
            <ProtectedRoute adminOnly>
              <Suspense fallback={<PageLoader />}>
                <AdminCompleteEnhanced />
              </Suspense>
            </ProtectedRoute>
          </main>
        </Route>

        <Route path="/admin/products">
          <main className="flex-1">
            <ProtectedRoute adminOnly>
              <Suspense fallback={<PageLoader />}>
                <AdminProductsFixed />
              </Suspense>
            </ProtectedRoute>
          </main>
        </Route>

        {/* All other routes - with footer */}
        <Route>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">
            <Switch>
              <Route path="/">
                <Suspense fallback={<PageLoader />}>
                  <HomePage />
                </Suspense>
              </Route>
              <Route path="/products">
                <Suspense fallback={<PageLoader />}>
                  <ProductsPage />
                </Suspense>
              </Route>
              <Route path="/search">
                <Suspense fallback={<PageLoader />}>
                  <SearchPage />
                </Suspense>
              </Route>
              <Route path="/products/:slug">
                <Suspense fallback={<PageLoader />}>
                  <ProductDetailPage />
                </Suspense>
              </Route>
              <Route path="/cart">
                <Suspense fallback={<PageLoader />}>
                  <CartPage />
                </Suspense>
              </Route>
              <Route path="/checkout">
                <Suspense fallback={<PageLoader />}>
                  <CheckoutPage />
                </Suspense>
              </Route>
              <Route path="/wishlist">
                <Suspense fallback={<PageLoader />}>
                  <WishlistPage />
                </Suspense>
              </Route>
              <Route path="/categories">
                <Suspense fallback={<PageLoader />}>
                  <CategoriesPage />
                </Suspense>
              </Route>
              <Route path="/category/:categoryId">
                <Suspense fallback={<PageLoader />}>
                  <CategoryDetail />
                </Suspense>
              </Route>
              <Route path="/deals">
                <Suspense fallback={<PageLoader />}>
                  <DealsPage />
                </Suspense>
              </Route>
              <ProtectedRoute path="/dashboard">
                <Suspense fallback={<PageLoader />}>
                  <UserDashboard />
                </Suspense>
              </ProtectedRoute>
              <ProtectedRoute path="/profile">
                <Suspense fallback={<PageLoader />}>
                  <ProfileSettingsPage />
                </Suspense>
              </ProtectedRoute>
              <Route path="/auth">
                <Suspense fallback={<PageLoader />}>
                  <AuthPage />
                </Suspense>
              </Route>
              <Route path="/login">
                <Suspense fallback={<PageLoader />}>
                  <LoginPage />
                </Suspense>
              </Route>
              <Route path="/track/:orderNumber">
                <Suspense fallback={<PageLoader />}>
                  <OrderTrackingPage />
                </Suspense>
              </Route>
              <Route path="/help">
                <Suspense fallback={<PageLoader />}>
                  <HelpPage />
                </Suspense>
              </Route>
              <Route path="/contact">
                <Suspense fallback={<PageLoader />}>
                  <ContactPage />
                </Suspense>
              </Route>
              <Route path="/shipping">
                <Suspense fallback={<PageLoader />}>
                  <ShippingPage />
                </Suspense>
              </Route>
              <Route path="/returns">
                <Suspense fallback={<PageLoader />}>
                  <ReturnsPage />
                </Suspense>
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <MobileBottomNav />
          <FloatingThemeToggle />
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
