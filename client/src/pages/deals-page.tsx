import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Percent, 
  Clock, 
  Star, 
  ShoppingCart, 
  Heart, 
  Timer,
  Tag,
  TrendingUp,
  Zap,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  salePrice?: string;
  images: string[];
  category?: {
    id: number;
    name: string;
  };
  rating?: number;
  reviewCount?: number;
  stock: number;
  isFeatured: boolean;
}

interface Coupon {
  id: number;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minimumAmount?: string;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export default function DealsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get featured products (deals)
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/products", { featured: true }],
    queryFn: () => fetch("/api/products?featured=true&limit=20", { credentials: "include" }).then(res => res.json()),
  });

  // Get products on sale
  const { data: saleData, isLoading: saleLoading } = useQuery({
    queryKey: ["/api/products", { onSale: true }],
    queryFn: () => fetch("/api/products?limit=50", { credentials: "include" }).then(res => res.json()),
  });

  // Get active flash sales
  const { data: flashSales = [], isLoading: flashLoading } = useQuery({
    queryKey: ["/api/flash-sales/active"],
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: "Product has been added to your wishlist.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (productId: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    addToCartMutation.mutate(productId);
  };

  const addToWishlist = (productId: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to wishlist.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    addToWishlistMutation.mutate(productId);
  };

  const calculateDiscount = (originalPrice: string, salePrice: string) => {
    const original = parseFloat(originalPrice);
    const sale = parseFloat(salePrice);
    return Math.round(((original - sale) / original) * 100);
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const hasDiscount = product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
    const discountPercent = hasDiscount ? calculateDiscount(product.price, product.salePrice!) : 0;

    return (
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images?.[0] || "/api/placeholder/300/300"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              -{discountPercent}%
            </Badge>
          )}
          {product.isFeatured && !hasDiscount && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge className="absolute top-2 right-2 bg-muted text-muted-foreground">
              Out of Stock
            </Badge>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-background/90 backdrop-blur-sm"
                onClick={() => addToWishlist(product.id)}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 
              className="font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/products/${product.slug}`)}
            >
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {hasDiscount ? (
                  <>
                    <span className="text-lg font-bold text-destructive">
                      ${product.salePrice}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-primary">
                    ${product.price}
                  </span>
                )}
              </div>
              <Button 
                size="sm" 
                onClick={() => addToCart(product.id)}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isLoading = featuredLoading || saleLoading || flashLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-destructive/20 via-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <Percent className="h-12 w-12 text-destructive mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Amazing Deals
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover incredible savings on our best products. Limited time offers, flash sales, and exclusive discounts!
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Limited time offers • Updated daily • Best prices guaranteed</span>
          </div>
        </div>
      </section>

      {/* Deals Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="featured" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 mb-8">
              <TabsTrigger value="featured" className="flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Featured
              </TabsTrigger>
              <TabsTrigger value="flash" className="flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Flash Sales
              </TabsTrigger>
              <TabsTrigger value="clearance" className="flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Clearance
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </TabsTrigger>
            </TabsList>

            {/* Featured Deals */}
            <TabsContent value="featured" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Featured Deals</h2>
                <p className="text-muted-foreground">
                  Hand-picked products with the best value for money
                </p>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-square bg-muted animate-pulse" />
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-8 bg-muted animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : featuredData?.products?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredData.products.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Featured Deals Available</h3>
                  <p className="text-muted-foreground">Check back soon for amazing featured deals!</p>
                </div>
              )}
            </TabsContent>

            {/* Flash Sales */}
            <TabsContent value="flash" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Flash Sales</h2>
                <p className="text-muted-foreground">
                  Limited time offers with incredible discounts
                </p>
              </div>
              
              {flashSales.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {flashSales.map((sale: any) => (
                    <Card key={sale.id} className="border-destructive/50">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive">
                            <Timer className="h-3 w-3 mr-1" />
                            Flash Sale
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {sale.expiresAt && formatTimeRemaining(sale.expiresAt)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ProductCard product={sale.product} />
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Sold: {sale.soldCount || 0}</span>
                            <span>Stock: {sale.product.stock}</span>
                          </div>
                          <Progress 
                            value={((sale.soldCount || 0) / (sale.product.stock + (sale.soldCount || 0))) * 100} 
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Flash Sales Active</h3>
                  <p className="text-muted-foreground">Flash sales appear here for limited time periods!</p>
                </div>
              )}
            </TabsContent>

            {/* Clearance */}
            <TabsContent value="clearance" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Clearance Sale</h2>
                <p className="text-muted-foreground">
                  Massive discounts on selected items - while stocks last!
                </p>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-square bg-muted animate-pulse" />
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-8 bg-muted animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : saleData?.products?.filter((p: Product) => p.salePrice).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {saleData.products
                    .filter((product: Product) => product.salePrice)
                    .map((product: Product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Clearance Items</h3>
                  <p className="text-muted-foreground">Clearance items will appear here when available!</p>
                </div>
              )}
            </TabsContent>

            {/* Trending */}
            <TabsContent value="trending" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Trending Now</h2>
                <p className="text-muted-foreground">
                  Most popular products that everyone's talking about
                </p>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-square bg-muted animate-pulse" />
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-8 bg-muted animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : saleData?.products?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {saleData.products
                    .sort((a: Product, b: Product) => (b.reviewCount || 0) - (a.reviewCount || 0))
                    .slice(0, 12)
                    .map((product: Product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Trending Products</h3>
                  <p className="text-muted-foreground">Trending products will appear here!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Never Miss a Deal!</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about flash sales, exclusive offers, and new arrivals.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/newsletter")}
          >
            Subscribe Now
          </Button>
        </div>
      </section>
    </div>
  );
}