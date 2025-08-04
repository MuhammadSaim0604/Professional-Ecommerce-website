import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FlashSaleProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  originalPrice?: string;
  salePrice?: string;
  flashSaleDiscount?: string;
  imageUrl: string;
  images: string[];
  stock: number;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  rating?: number;
  reviewCount?: number;
  isFlashSale: boolean;
}

export function FlashSaleSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: flashSaleProducts, isLoading } = useQuery({
    queryKey: ['/api/products/flash-sale'],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest(`/api/cart`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to add items to cart",
        variant: "destructive",
      });
      return;
    }
    addToCartMutation.mutate(productId);
  };

  const calculateDiscountedPrice = (product: FlashSaleProduct) => {
    const originalPrice = parseFloat(product.price);
    const discount = parseFloat(product.flashSaleDiscount || '0');
    return (originalPrice * (1 - discount / 100)).toFixed(0);
  };

  const getDiscountPercentage = (product: FlashSaleProduct) => {
    if (product.flashSaleDiscount) {
      return Math.round(parseFloat(product.flashSaleDiscount));
    }
    if (product.originalPrice && product.salePrice) {
      const original = parseFloat(product.originalPrice);
      const sale = parseFloat(product.salePrice);
      return Math.round(((original - sale) / original) * 100);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Flash Sale</h2>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Shop More →
            </Button>
          </div>
          
          {/* Loading Skeletons - Smaller */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-2">
                <Skeleton className="w-full h-20 md:h-24 rounded-md mb-2" />
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!flashSaleProducts || (Array.isArray(flashSaleProducts) && flashSaleProducts.length === 0)) {
    return (
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Flash Sale</h2>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Shop More →
            </Button>
          </div>
          
          <div className="text-center py-6">
            <p className="text-gray-500">No flash sales available at the moment</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header - Exactly matching design */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Flash Sale</h2>
          <Button 
            variant="ghost" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            onClick={() => setLocation('/deals')}
          >
            Shop More →
          </Button>
        </div>

        {/* Flash Sale Products Grid - Smaller cards */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.isArray(flashSaleProducts) && flashSaleProducts.slice(0, 6).map((product: FlashSaleProduct) => {
            const discountPercentage = getDiscountPercentage(product);
            const discountedPrice = calculateDiscountedPrice(product);
            const originalPrice = parseFloat(product.price).toFixed(0);
            
            return (
              <div 
                key={product.id} 
                className="bg-white rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => setLocation(`/products/${product.slug}`)}
              >
                {/* Product Image with SAVE badge */}
                <div className="relative mb-2">
                  <img
                    src={product.imageUrl || '/api/placeholder/300/300'}
                    alt={product.name}
                    className="w-full h-20 md:h-24 object-cover rounded-md"
                  />
                  
                  {/* SAVE X% Badge - Top Left Corner - Smaller */}
                  {discountPercentage > 0 && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded text-xs">
                      SAVE {discountPercentage}%
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <h3 className="text-xs font-medium text-gray-900 mb-1 line-clamp-2 leading-tight">
                  {product.name}
                </h3>

                {/* Price Section - Smaller */}
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-bold text-gray-900">
                      Rs. {discountedPrice}
                    </span>
                    {discountPercentage > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        Rs.{originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Red Stock Button - Smaller */}
                <Button
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 rounded-md h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product.id);
                  }}
                  disabled={addToCartMutation.isPending}
                >
                  1 Stock left
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}