import { memo, useCallback } from "react";
import { useLocation } from "wouter";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: string;
  salePrice?: string;
  originalPrice?: string;
  imageUrl: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  rating?: number;
  reviewCount?: number;
  stock?: number;
  discountPercentage?: string;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  showAddToCart?: boolean;
  priority?: boolean; // For image loading priority
}

const ProductCardOptimized = memo(({ 
  product, 
  className = "", 
  showAddToCart = true,
  priority = false 
}: ProductCardProps) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Memoized click handler
  const handleProductClick = useCallback(() => {
    setLocation(`/products/${product.slug}`);
  }, [product.slug, setLocation]);

  // Optimized add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      // Optimistically update cart count
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  // Optimized wishlist mutation
  const wishlistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId: product.id }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlist",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
        setLocation("/login");
        return;
      }
      addToCartMutation.mutate();
    },
    [user, addToCartMutation, setLocation]
  );

  const handleAddToWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
        setLocation("/login");
        return;
      }
      wishlistMutation.mutate();
    },
    [user, wishlistMutation, setLocation]
  );

  // Calculate price display
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice !== product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice!)) / parseFloat(product.price)) * 100)
    : null;

  // Render stars efficiently
  const renderStars = useCallback(() => {
    if (!product.rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 md:h-4 md:w-4 ${
              i < Math.floor(product.rating!) 
                ? "text-yellow-400 fill-current" 
                : "text-gray-300"
            }`}
          />
        ))}
        {product.reviewCount && (
          <span className="text-xs text-muted-foreground ml-1">
            ({product.reviewCount})
          </span>
        )}
      </div>
    );
  }, [product.rating, product.reviewCount]);

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 ${className}`}
      onClick={handleProductClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          {/* Optimized image with loading priority */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-32 md:h-48 object-cover rounded-t-lg"
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
          />
          
          {/* Category badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 text-xs bg-white/90 text-gray-700"
          >
            {product.category.name}
          </Badge>

          {/* Discount badge */}
          {discountPercent && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 right-2 text-xs"
            >
              {discountPercent}% OFF
            </Badge>
          )}

          {/* Wishlist button - hidden on mobile */}
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 bg-white/90 hover:bg-white hidden md:flex"
            onClick={handleAddToWishlist}
            disabled={wishlistMutation.isPending}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 md:p-4 space-y-2">
          {/* Product title with proper truncation */}
          <h3 className="font-medium text-base line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Description - hidden on mobile */}
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 hidden md:block">
              {product.shortDescription}
            </p>
          )}

          {/* Price section */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  PKR {displayPrice}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    PKR {product.price}
                  </span>
                )}
              </div>
              {renderStars()}
            </div>

            {/* Add to cart button - hidden on mobile */}
            {showAddToCart && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending || !product.stock}
                className="hidden md:flex"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {addToCartMutation.isPending ? "Adding..." : "Add"}
              </Button>
            )}
          </div>

          {/* Stock indicator */}
          {product.stock !== undefined && (
            <div className="text-xs text-muted-foreground">
              {product.stock > 0 ? (
                product.stock < 10 && <span className="text-orange-500">Only {product.stock} left!</span>
              ) : (
                <span className="text-red-500">Out of stock</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ProductCardOptimized.displayName = "ProductCardOptimized";

export default ProductCardOptimized;