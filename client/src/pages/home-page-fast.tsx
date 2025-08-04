import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Star, ShoppingCart, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useState, useMemo, Suspense, lazy } from "react";

// Lazy load non-critical components
const DarazStyleCategories = lazy(() => import("@/components/DarazStyleCategories"));
const DarazStyleFlashSale = lazy(() => import("@/components/DarazStyleFlashSale"));

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

// Minimal ProductCard for fast loading
const FastProductCard = ({ product }: { product: Product }) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={() => navigate(`/products/${product.slug}`)}
    >
      <CardContent className="p-4">
        <div className="aspect-square relative mb-3 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300"}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {(product.isFeatured || product.featured) && (
            <Badge className="absolute top-2 left-2 bg-red-500">Featured</Badge>
          )}
        </div>
        
        <h3 className="text-sm font-medium line-clamp-2 mb-2">{product.name}</h3>
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-primary">
            ${String(product.price || '0')}
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ${String(product.originalPrice)}
              </span>
            )}
          </div>
          
          {product.rating && Number(product.rating) > 0 ? (
            <div className="flex items-center text-yellow-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(Number(product.rating) || 0)
                        ? "fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs ml-1">
                ({product.reviewCount || 0})
              </span>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <span className="text-xs">No reviews</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Minimal loading skeleton
const ProductSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <Skeleton className="aspect-square mb-3 rounded-lg" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <div className="flex justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-12" />
      </div>
    </CardContent>
  </Card>
);

export default function FastHomePage() {
  usePerformanceMonitor('Fast Home Page');
  const [, navigate] = useLocation();

  // Single API call for all data
  const { data, isLoading } = useQuery({
    queryKey: ["/api/products", { limit: 12 }],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  // Client-side filtering for performance
  const products = useMemo(() => {
    if (!data || !Array.isArray(data.products)) return [];
    return data.products;
  }, [data]);
  
  const featuredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => p.isFeatured || p.featured).slice(0, 6);
  }, [products]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero skeleton */}
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full rounded-lg mb-8" />
          
          {/* Products skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Shop Fast & Easy
            </h1>
            <p className="text-xl mb-8">
              Discover amazing products at unbeatable prices
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/products')}
              className="text-lg px-8 py-3"
            >
              Shop Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products - Above the fold */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Button 
            variant="outline" 
            onClick={() => navigate('/products')}
          >
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <FastProductCard key={product.id} product={product} />
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))
          )}
        </div>
      </section>

      {/* Lazy loaded components */}
      <Suspense fallback={<div className="h-32" />}>
        <DarazStyleCategories />
      </Suspense>

      <Suspense fallback={<div className="h-40" />}>
        <DarazStyleFlashSale />
      </Suspense>

      {/* All Products */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">All Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.length > 0 ? (
            products.slice(0, 8).map((product) => (
              <FastProductCard key={product.id} product={product} />
            ))
          ) : (
            Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))
          )}
        </div>
        
        <div className="text-center mt-8">
          <Button 
            onClick={() => navigate('/products')}
            size="lg"
            className="px-8"
          >
            Load More Products <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}