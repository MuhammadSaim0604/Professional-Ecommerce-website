import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Star,
  ShoppingCart,
  Heart,
  Eye,
  ArrowRight,
  TrendingUp,
  Award,
  Truck,
  Shield,
  RefreshCw,
  Clock,
  Users,
  Zap,
  Gift,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { DarazStyleFlashSale } from "@/components/DarazStyleFlashSale";
import { DarazStyleCategories } from "@/components/DarazStyleCategories";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: string;
  originalPrice?: string;
  salePrice?: string;
  imageUrl: string;
  images?: string[];
  category: {
    id: number;
    name: string;
    slug: string;
  };
  rating?: number;
  reviewCount?: number;
  featured: boolean;
  stock?: number;
  isFeatured?: boolean;
  
  // Comprehensive product fields from admin panel
  productType?: 'simple' | 'featured' | 'new_arrivals' | 'flash_sale';
  brand?: string;
  color?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  material?: string;
  countryOfOrigin?: string;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  tags?: string[];
  discountPercentage?: string;
  isFlashSale?: boolean;
  flashSaleStartDate?: string;
  flashSaleEndDate?: string;
  flashSaleDiscount?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Refs for horizontal scrolling
  const featuredRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);


  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ["/api/banners/active"],
  });

  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      console.log('Fetching featured products...');
      const response = await fetch("/api/products/featured?limit=8", {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      console.log('Featured products data:', data);
      console.log('Featured products array:', data?.products);
      console.log('Featured products length:', data?.products?.length);
      return data;
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: newProducts, isLoading: newLoading } = useQuery({
    queryKey: ["/api/products/new-arrivals"],
    queryFn: () => apiRequest("/api/products/new-arrivals"),
  });


  // Horizontal scroll functions
  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const addToCart = async (productId: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      await apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ProductCard = ({
    product,
    isFlashSale = false,
    discount,
  }: {
    product: Product;
    isFlashSale?: boolean;
    discount?: string;
  }) => (
    <Card
      className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/products/${product.slug}`)}
    >
      <div className="relative overflow-hidden">
        <img
          src={product.imageUrl || "/api/placeholder/300/300"}
          alt={product.name}
          className="w-full h-32 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Single Product Type Badge - Only ONE badge at a time */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3">
          {/* Priority Order: Out of Stock > Flash Sale > Featured > New Arrivals > Discount */}
          {(product.stock !== undefined && product.stock === 0) ? (
            <Badge className="bg-gray-500 text-white text-xs">
              Out of Stock
            </Badge>
          ) : product.productType === 'flash_sale' ? (
            <Badge className="bg-red-500 text-white text-xs font-bold animate-pulse">
              🔥 Flash Sale
            </Badge>
          ) : product.productType === 'featured' ? (
            <Badge className="bg-yellow-500 text-black text-xs font-semibold">
              ⭐ Featured
            </Badge>
          ) : product.productType === 'new_arrivals' ? (
            <Badge className="bg-green-500 text-white text-xs font-semibold">
              🆕 New
            </Badge>
          ) : (discount || (product.discountPercentage && parseFloat(product.discountPercentage) > 0)) ? (
            <Badge className="bg-orange-500 text-white text-xs font-bold">
              -{discount || product.discountPercentage}% OFF
            </Badge>
          ) : null}
        </div>
      </div>
      <CardContent className="p-3 md:p-4">
        <div className="space-y-2 md:space-y-3">
          <h3 className="font-semibold text-base line-clamp-2">
            {product.name}
          </h3>

          {/* Hide description on mobile, show on desktop */}
          <p className="hidden md:block text-sm text-muted-foreground line-clamp-2">
            {product.description || "No description available"}
          </p>

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="text-lg md:text-xl font-bold">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Rating - Multiple stars based on rating value */}
          {product.rating && (
            <div className="flex items-center">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 md:h-4 w-3 md:w-4 ${
                      i < Math.floor(Number(product.rating) || 0)
                        ? "fill-current"
                        : ""
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs md:text-sm text-muted-foreground ml-2">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>
          )}

          {/* Add to cart button - hidden on mobile, visible on desktop */}
          <Button
            className="hidden md:flex w-full"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.id);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ProductCardSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-background to-secondary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Welcome to <span className="text-primary">ShopHub</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover amazing products at unbeatable prices. Quality
              guaranteed, fast shipping, and exceptional customer service.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                size="lg"
                className="btn-primary"
                onClick={() => navigate("/products")}
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/categories")}
              >
                Browse Categories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Free Shipping</h3>
              <p className="text-muted-foreground">
                Free shipping on orders over $50
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure Payment</h3>
              <p className="text-muted-foreground">
                100% secure payment processing
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Easy Returns</h3>
              <p className="text-muted-foreground">30-day return policy</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Quality Guarantee</h3>
              <p className="text-muted-foreground">Premium quality products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Daraz Style Flash Sales Section */}
      <DarazStyleFlashSale />

      {/* Daraz Style Categories Section */}
      <DarazStyleCategories />

      {/* Featured Products Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Featured Products
              </h2>
              <p className="text-muted-foreground mt-2">
                Hand-picked products just for you
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Desktop Right Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollRight(featuredRef)}
                className="hidden md:flex h-10 w-10 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/products?featured=true")}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (featuredProducts as any)?.products && (featuredProducts as any)?.products.length > 0 ? (
            <>
              {/* Mobile Grid */}
              <div className="grid grid-cols-2 gap-2 md:hidden">
                {(featuredProducts as any).products
                  .slice(0, 4)
                  .map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>

              {/* Desktop Horizontal Scroll */}
              <div
                ref={featuredRef}
                className="hidden md:flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {(featuredProducts as any).products.map((product: Product) => (
                  <div key={product.id} className="flex-shrink-0 w-80">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No featured products available
              </p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                New Arrivals
              </h2>
              <p className="text-muted-foreground mt-2">
                Latest products in our store
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Desktop Right Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollRight(newArrivalsRef)}
                className="hidden md:flex h-10 w-10 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate("/products?sortBy=createdAt&sortOrder=desc")
                }
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {newLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (newProducts as any)?.products ? (
            <>
              {/* Mobile Grid */}
              <div className="grid grid-cols-2 gap-2 md:hidden">
                {(newProducts as any).products
                  .slice(0, 4)
                  .map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>

              {/* Desktop Horizontal Scroll */}
              <div
                ref={newArrivalsRef}
                className="hidden md:flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {(newProducts as any).products.map((product: Product) => (
                  <div key={product.id} className="flex-shrink-0 w-80">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No new products available</p>
            </div>
          )}
        </div>
      </section>


      {/* Newsletter Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">Stay Updated</h2>
            <p className="text-muted-foreground">
              Subscribe to our newsletter and get the latest deals and updates
              delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
              />
              <Button className="btn-primary">Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
