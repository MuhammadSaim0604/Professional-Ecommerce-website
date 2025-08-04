import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Star, ShoppingCart, Heart, Eye, Zap, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ui/product-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";

interface FlashSale {
  id: number;
  discount: string;
  startDate: string;
  endDate: string;
  product: Product;
}

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link_text?: string;
  link_url?: string;
  position: number;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export default function AdvancedHomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Fetch banners
  const { data: banners = [], isLoading: bannersLoading } = useQuery<Banner[]>({
    queryKey: ["/api/banners/active"],
  });

  // Fetch flash sales
  const { data: flashSales = [], isLoading: flashSalesLoading } = useQuery<FlashSale[]>({
    queryKey: ["/api/flash-sales/active"],
  });

  // Fetch featured products with proper typing
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/products", "featured"],
    queryFn: async () => {
      const response = await fetch("/api/products?featured=true&limit=8");
      return response.json();
    },
  });

  // Fetch latest products with proper typing
  const { data: latestData, isLoading: latestLoading } = useQuery({
    queryKey: ["/api/products", "latest"],
    queryFn: async () => {
      const response = await fetch("/api/products?sortBy=createdAt&sortOrder=desc&limit=8");
      return response.json();
    },
  });

  // Fetch trending products with proper typing
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/products", "trending"],
    queryFn: async () => {
      const response = await fetch("/api/products?limit=6");
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Extract products from API responses
  const featuredProducts = featuredData?.products || [];
  const latestProducts = latestData?.products || [];
  const trendingProducts = trendingData?.products || [];

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-square bg-muted animate-pulse" />
          <CardContent className="p-4">
            <div className="h-4 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section with Banners */}
        {banners.length > 0 && (
          <section className="relative h-[500px] overflow-hidden">
            <div className="absolute inset-0 transition-transform duration-1000 ease-in-out">
              <div 
                className="flex h-full transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
              >
                {banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="flex-shrink-0 w-full h-full bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${banner.image})` }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
                      <div className="max-w-2xl text-white">
                        <h1 className="text-5xl font-bold mb-4">{banner.title}</h1>
                        {banner.subtitle && (
                          <h2 className="text-2xl font-semibold mb-4">{banner.subtitle}</h2>
                        )}
                        {banner.description && (
                          <p className="text-lg mb-8 opacity-90">{banner.description}</p>
                        )}
                        {banner.link_url && banner.link_text && (
                          <Button size="lg" onClick={() => navigate(banner.link_url)}>
                            {banner.link_text}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Banner indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentBannerIndex ? "bg-white" : "bg-white/50"
                    }`}
                    onClick={() => setCurrentBannerIndex(index)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <div className="container mx-auto px-4 py-8 space-y-16">
          {/* Flash Sales Section */}
          {flashSales.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-orange-500" />
                  <h2 className="text-3xl font-bold">Flash Sale</h2>
                  <Badge variant="destructive" className="animate-pulse">
                    Limited Time
                  </Badge>
                </div>
                <Button variant="outline" onClick={() => navigate("/products")}>
                  View All Flash Sales <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashSales.slice(0, 3).map((sale) => (
                  <Card key={sale.id} className="overflow-hidden border-orange-200 dark:border-orange-800">
                    <div className="relative">
                      <img
                        src={sale.product.images?.[0] || "/placeholder.jpg"}
                        alt={sale.product.name}
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-orange-500">
                        -{sale.discount}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{sale.product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-orange-600">
                            ${sale.product.salePrice || sale.product.price}
                          </span>
                          {sale.product.salePrice && (
                            <span className="text-sm line-through text-muted-foreground">
                              ${sale.product.price}
                            </span>
                          )}
                        </div>
                        <Button size="sm" onClick={() => navigate(`/product/${sale.product.slug}`)}>
                          View Deal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Categories Grid */}
          {categories.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Shop by Category</h2>
                <Button variant="outline" onClick={() => navigate("/categories")}>
                  View All Categories <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.slice(0, 6).map((category) => (
                  <Card 
                    key={category.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow group max-w-[200px] mx-auto"
                    onClick={() => navigate(`/category/${category.slug}`)}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                        <span className="text-xl">📱</span>
                      </div>
                      <h3 className="font-medium text-xs leading-tight">{category.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Featured Products Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-500" />
                <h2 className="text-3xl font-bold">Featured Products</h2>
              </div>
              <Button variant="outline" onClick={() => navigate("/products?featured=true")}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {featuredLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>

          {/* Latest Products Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Latest Products</h2>
              <Button variant="outline" onClick={() => navigate("/products?sortBy=createdAt&sortOrder=desc")}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {latestLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>

          {/* Features Section */}
          <section className="py-16 bg-muted/30 rounded-lg">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Experience the best online shopping with our premium features and exceptional service
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
                <p className="text-muted-foreground">
                  Free shipping on orders over $50. Fast and reliable delivery to your doorstep.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
                <p className="text-muted-foreground">
                  Your payment information is secure with our encrypted checkout process.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-muted-foreground">
                  All products are carefully selected and quality tested before shipping.
                </p>
              </div>
            </div>
          </section>

          {/* Newsletter Section */}
          <section className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-8">
                Subscribe to our newsletter for the latest products, deals, and exclusive offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button className="px-8">
                  Subscribe
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}