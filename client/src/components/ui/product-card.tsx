import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePriceFormatter } from "@/lib/currency";

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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatPrice } = usePriceFormatter();

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please log in to add items to cart");
      }
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const handleProductClick = () => {
    navigate(`/products/${product.slug}`);
  };

  const currentPrice = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : product.originalPrice;

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer w-full"
      onClick={handleProductClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={product.imageUrl || (product.images as string[])?.[0] || "/api/placeholder/300/300"}
          alt={product.name}
          className="w-full h-24 sm:h-32 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
          ) : (product.discountPercentage && parseFloat(product.discountPercentage) > 0) ? (
            <Badge className="bg-orange-500 text-white text-xs font-bold">
              -{product.discountPercentage}% OFF
            </Badge>
          ) : null}
        </div>
      </div>
      <CardContent className="p-2 sm:p-3 md:p-4 w-full">
        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 w-full">
          <h3 className="font-semibold text-xs sm:text-sm md:text-base truncate w-full overflow-hidden whitespace-nowrap text-ellipsis">{product.name}</h3>

          {/* Hide description on mobile, show on desktop */}
          <p className="hidden md:block text-sm text-muted-foreground line-clamp-2">
            {product.shortDescription || product.description || "No description available"}
          </p>

          {/* Price */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-sm sm:text-base md:text-xl font-bold">
              {formatPrice(currentPrice)}
            </span>
            {originalPrice && (
              <span className="text-xs sm:text-xs md:text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Rating - Multiple stars based on rating value */}
          {product.rating && (
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 sm:h-3 md:h-4 w-2.5 sm:w-3 md:w-4 ${
                    i < Math.floor(product.rating!) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
              {product.reviewCount && (
                <span className="text-xs sm:text-xs md:text-sm text-muted-foreground ml-0.5 sm:ml-1">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Add to cart button - hidden on mobile, visible on desktop */}
          <Button
            className="hidden md:flex w-full"
            onClick={handleAddToCart}
            disabled={(product.stock !== undefined && product.stock === 0) || addToCartMutation.isPending}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {(product.stock !== undefined && product.stock === 0) ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}