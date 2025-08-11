import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

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
  stock?: number;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  rating?: number;
  reviewCount?: number;
  isFlashSale: boolean;
}

export function DarazStyleFlashSale() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Clear cache on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/products/flash-sale"] });
  }, [queryClient]);

  const {
    data: flashSaleData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/products/flash-sale"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/products/flash-sale?limit=10", {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Error fetching flash sale data:", err);
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 0,
  });

  const flashSaleProducts = flashSaleData?.products || [];

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest(`/api/cart`, {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive",
      });
    },
  });

  const getDiscountPercentage = (product: FlashSaleProduct) => {
    if (product.flashSaleDiscount) {
      return Math.round(parseFloat(product.flashSaleDiscount));
    }
    if (product.originalPrice && product.salePrice) {
      const original = parseFloat(product.originalPrice);
      const sale = parseFloat(product.salePrice);
      return Math.round(((original - sale) / original) * 100);
    }
    // Calculate discount from current price vs original price if available
    if (product.originalPrice) {
      const original = parseFloat(product.originalPrice);
      const current = parseFloat(product.price);
      if (original > current) {
        return Math.round(((original - current) / original) * 100);
      }
    }
    return 0; // No discount if no data available
  };

  const calculateDiscountedPrice = (product: FlashSaleProduct) => {
    // Use salePrice if available, otherwise calculate from discount
    if (product.salePrice) {
      return Math.round(parseFloat(product.salePrice));
    }

    const originalPrice = parseFloat(product.price);
    const discount = getDiscountPercentage(product);

    if (discount > 0) {
      return Math.round(originalPrice * (1 - discount / 100));
    }

    // If no discount, return the original price
    return Math.round(originalPrice);
  };

  const getStockLeft = (product: FlashSaleProduct) => {
    // Use actual stock data from the product
    return product.stock ?? 0;
  };

  if (isLoading) {
    return (
      <section className="py-4 bg-white dark:bg-gray-900 mt-4 sm:mt-6 md:mt-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-32 bg-white dark:bg-gray-800 rounded-lg p-3"
              >
                <Skeleton className="w-full h-24 mb-2 rounded" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (
    !flashSaleProducts ||
    (Array.isArray(flashSaleProducts) && flashSaleProducts.length === 0)
  ) {
    return (
      <section className="py-4 bg-white dark:bg-gray-900 mt-4 sm:mt-6 md:mt-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Flash Sale
            </h2>
            <Button
              variant="link"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium p-0"
            >
              Shop More →
            </Button>
          </div>
          <div className="text-center py-6">
            <p className="text-gray-500">
              No flash sales available at the moment
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{ marginTop: "20px" }}
      className="py-4 bg-white dark:bg-gray-900 mt-4 sm:mt-6 md:mt-8"
    >
      <div className="container mx-auto md:px-[70px]">
        {/* Header - Exactly matching Daraz design */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Flash Sale
          </h2>
          <Button
            variant="link"
            className="text-orange-500 hover:text-orange-600 text-sm font-medium p-0"
            onClick={() => setLocation("/deals")}
          >
            Shop More →
          </Button>
        </div>

        {/* Flash Sale Products - Horizontal scroll like Daraz */}
        <div className="relative">
          {/* Desktop Navigation Arrows */}
          <button
            onClick={() => {
              const container = document.getElementById("flashsale-scroll");
              if (container)
                container.scrollBy({ left: -300, behavior: "smooth" });
            }}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
          >
            <svg
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              const container = document.getElementById("flashsale-scroll");
              if (container)
                container.scrollBy({ left: 300, behavior: "smooth" });
            }}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
          >
            <svg
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div
            id="flashsale-scroll"
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide pr-8 md:pl-6 md:pr-12"
          >
            {(Array.isArray(flashSaleProducts) ? flashSaleProducts : []).map(
              (product: FlashSaleProduct) => {
                const discount = getDiscountPercentage(product);
                const discountedPrice = calculateDiscountedPrice(product);
                const stockLeft = getStockLeft(product);

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-32 md:w-44 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setLocation(`/products/${product.slug}`)}
                  >
                    {/* Product Image with Discount Badge */}
                    <div className="relative">
                      <img
                        src={product.imageUrl || "/api/placeholder/176/160"}
                        alt={product.name}
                        className="w-full h-24 md:h-40 object-cover"
                      />
                      {/* SAVE Badge - Top Left Corner */}
                      <div className="absolute top-2 left-2">
                        <div className="relative">
                          {/* Badge Background with gradient */}
                          <svg
                            width="50"
                            height="30"
                            viewBox="0 0 50 30"
                            className="drop-shadow-md"
                          >
                            <defs>
                              <linearGradient
                                id={`badgeGradient-${product.id}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#ff6b6b" />
                                <stop offset="100%" stopColor="#ff4757" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0 3 C0 1.3 1.3 0 3 0 L42 0 C43.7 0 45 1.3 45 3 L50 15 L45 27 C45 28.7 43.7 30 42 30 L3 30 C1.3 30 0 28.7 0 27 Z"
                              fill={`url(#badgeGradient-${product.id})`}
                              stroke="#fff"
                              strokeWidth="1"
                            />
                          </svg>
                          {/* Badge Text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-white text-[10px] font-bold leading-none">
                              SAVE
                            </span>
                            <span className="text-white text-[12px] font-black leading-none mt-0.5">
                              {discount}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      {/* Price */}
                      <div className="mb-3">
                        <div className="text-red-500 font-bold text-lg leading-tight">
                          Rs. {discountedPrice}
                        </div>
                        {discount > 0 && (
                          <div className="text-gray-400 text-sm line-through leading-tight">
                            Rs. {product.originalPrice || product.price}
                          </div>
                        )}
                      </div>

                      {/* Stock Left Badge */}
                      {stockLeft > 0 && (
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full inline-block font-medium">
                          {stockLeft} Stock left
                        </div>
                      )}
                      {stockLeft === 0 && (
                        <div className="bg-gray-500 text-white text-xs px-3 py-1.5 rounded-full inline-block font-medium">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
