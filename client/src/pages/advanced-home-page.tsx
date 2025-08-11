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
  Timer,
  Tag,
  Search,
  ShoppingBag,
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
import { usePriceFormatter } from "@/lib/currency";
import { DarazStyleFlashSale } from "@/components/DarazStyleFlashSale";
import { useState, useEffect, useRef } from "react";
import { useSiteName } from "@/hooks/use-site-name";
import { useDocumentTitle } from "@/hooks/use-document-title";

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
  featured: boolean;
}

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
  const queryClient = useQueryClient();
  const { formatPrice } = usePriceFormatter();
  const siteName = useSiteName();
  
  // Set document title
  useDocumentTitle();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const categoriesPerPage = 6;
  const autoSlideInterval = useRef<NodeJS.Timeout | null>(null);
  const [carouselApi, setCarouselApi] = useState<any>(); // Carousel API state

  // Fetch banners
  const { data: banners = [], isLoading: bannersLoading } = useQuery<Banner[]>({
    queryKey: ["/api/banners/active"],
  });

  // Fetch flash sales
  const { data: flashSales = [], isLoading: flashSalesLoading } = useQuery<
    FlashSale[]
  >({
    queryKey: ["/api/flash-sales/active"],
  });

  // Fetch featured products with proper typing
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      const response = await fetch("/api/products/featured?limit=10");
      const data = await response.json();
      return data;
    },
  });

  // Fetch new arrivals products with proper typing
  const { data: latestData, isLoading: latestLoading } = useQuery({
    queryKey: ["/api/products/new-arrivals"],
    queryFn: async () => {
      const response = await fetch("/api/products/new-arrivals?limit=10");
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

  // Fetch all products with proper typing
  const { data: allProductsData, isLoading: allProductsLoading } = useQuery({
    queryKey: ["/api/products", "all"],
    queryFn: async () => {
      const response = await fetch("/api/products?limit=12");
      return response.json();
    },
  });

  // Fetch editor settings for hero image
  const { data: editorSettings } = useQuery({
    queryKey: ["/api/editor-settings"],
    queryFn: async () => {
      const response = await fetch("/api/editor-settings");
      return response.json();
    },
  });

  // Extract products from API responses
  const featuredProducts = featuredData?.products || [];
  const latestProducts = latestData?.products || [];
  const trendingProducts = trendingData?.products || [];
  const allProducts = allProductsData?.products || [];

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Auto-slide functionality - move one category at a time
  useEffect(() => {
    if (!categories || (categories as Category[]).length <= categoriesPerPage)
      return;

    const startAutoSlide = () => {
      autoSlideInterval.current = setInterval(() => {
        setCurrentCategoryIndex((prev) => {
          const maxIndex = Math.max(
            0,
            (categories as Category[]).length - categoriesPerPage,
          );
          return prev >= maxIndex ? 0 : prev + 1;
        });
      }, 4000);
    };

    startAutoSlide();

    return () => {
      if (autoSlideInterval.current) {
        clearInterval(autoSlideInterval.current);
      }
    };
  }, [categories, categoriesPerPage]);

  const nextCategories = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Clear auto-slide when user manually navigates
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
    }

    const maxIndex = Math.max(
      0,
      (categories as Category[]).length - categoriesPerPage,
    );
    setCurrentCategoryIndex((prev) => {
      const next = prev >= maxIndex ? 0 : prev + 1;
      return next;
    });

    setTimeout(() => setIsTransitioning(false), 600);
  };

  const prevCategories = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Clear auto-slide when user manually navigates
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
    }

    const maxIndex = Math.max(
      0,
      (categories as Category[]).length - categoriesPerPage,
    );
    setCurrentCategoryIndex((prev) => {
      const next = prev <= 0 ? maxIndex : prev - 1;
      return next;
    });

    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
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
      toast({
        title: "Added to wishlist",
        description: "Product has been added to your wishlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: number) => {
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

  const handleAddToWishlist = (productId: number) => {
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
        {isFlashSale && discount && (
          <Badge className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-500 text-white text-xs">
            -{discount}% OFF
          </Badge>
        )}
        {product.featured && !isFlashSale && (
          <Badge className="absolute top-2 right-2 md:top-3 md:right-3 bg-yellow-500 text-black text-xs">
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-3 md:p-4">
        <div className="space-y-1 md:space-y-1.5">
          <h3 className="font-semibold text-base truncate w-full overflow-hidden whitespace-nowrap text-ellipsis">
            {product.name}
          </h3>

          {/* Hide description on mobile, show on desktop */}
          <p className="hidden md:block text-xs text-muted-foreground line-clamp-2">
            {product.description || "No description available"}
          </p>

          {/* Price */}
          <div className="flex items-center space-x-1">
            <span className="text-sm md:text-lg font-bold">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
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
              handleAddToCart(product.id);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const FlashSaleCard = ({
    product,
    discount,
  }: {
    product: Product;
    discount?: string;
  }) => {
    const originalPrice = parseFloat(product.price);
    const discountPercent = discount ? parseFloat(discount) : 20;
    const salePrice = Math.round(originalPrice * (1 - discountPercent / 100));

    return (
      <Card
        className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        onClick={() => navigate(`/products/${product.slug}`)}
      >
        <div className="relative overflow-hidden">
          <img
            src={product.imageUrl || "/api/placeholder/300/300"}
            alt={product.name}
            className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount && (
            <div className="absolute top-3 left-3">
              <div className="bg-red-500 text-white rounded-full w-14 h-14 md:w-16 md:h-16 flex flex-col items-center justify-center text-xs md:text-sm font-bold shadow-lg">
                <span>{discount}%</span>
                <span>OFF</span>
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-1.5">
          <h3 className="font-semibold text-sm md:text-base truncate w-full overflow-hidden whitespace-nowrap text-ellipsis">
            {product.name}
          </h3>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <span className="text-lg md:text-xl font-bold text-red-500">
                {formatPrice(salePrice)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground line-through">
              Rs.{originalPrice}
            </span>
          </div>

          {/* Stock button */}
          <Button
            className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product.id);
            }}
          >
            1 Stock left
          </Button>
        </CardContent>
      </Card>
    );
  };

  const CategoryCard = ({ category }: { category: Category }) => (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300"
      onClick={() => navigate(`/category/${category.id}`)}
    >
      <CardContent className="p-6 text-center">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-16 h-16 mx-auto mb-4 object-cover rounded-full"
          />
        ) : (
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Tag className="h-8 w-8 text-primary" />
          </div>
        )}
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {category.description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-full hidden md:block" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const handleUserInteraction = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
      // Optionally restart the auto-slide after a delay
      setTimeout(() => {
        startAutoSlide();
      }, 5000);
    }
  };

  const handlePrevious = () => {
    if (carouselApi) {
      carouselApi.scrollPrev();
      handleUserInteraction();
    }
  };

  const handleNext = () => {
    if (carouselApi) {
      carouselApi.scrollNext();
      handleUserInteraction();
    }
  };

  const startAutoSlide = () => {
    if (!carouselApi) return;

    autoSlideInterval.current = setInterval(() => {
      carouselApi.scrollNext();
    }, 4000);
  };

  // Auto-start desktop carousel
  useEffect(() => {
    if (categoriesLoading || !carouselApi) return;

    startAutoSlide();

    return () => {
      if (autoSlideInterval.current) {
        clearInterval(autoSlideInterval.current);
      }
    };
  }, [categoriesLoading, carouselApi]);

  return (
    <div className="min-h-screen">
      {/* Hero Banner Section */}
      {bannersLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : banners.length > 0 ? (
        <div className="relative h-96 overflow-hidden">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-transform duration-500 ${
                index === currentBannerIndex
                  ? "translate-x-0"
                  : index < currentBannerIndex
                    ? "-translate-x-full"
                    : "translate-x-full"
              }`}
              style={{
                backgroundImage: `url(${banner.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative container mx-auto px-4 h-full flex items-center">
                <div className="max-w-lg text-white">
                  <h1 className="text-4xl font-bold mb-4">{banner.title}</h1>
                  {banner.subtitle && (
                    <p className="text-xl mb-2 text-yellow-300">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.description && (
                    <p className="text-lg mb-6">{banner.description}</p>
                  )}
                  {banner.link_url && (
                    <Button
                      size="lg"
                      onClick={() => navigate(banner.link_url!)}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      {banner.link_text || "Learn More"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Banner Navigation */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentBannerIndex((prev) =>
                    prev === 0 ? banners.length - 1 : prev - 1,
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() =>
                  setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentBannerIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        // Default hero section with dynamic hero image from editor settings
        <div 
          className="h-64 sm:h-80 md:h-96 flex items-center justify-center text-white relative"
          style={{
            backgroundImage: editorSettings?.heroImage 
              ? `url(${editorSettings.heroImage})` 
              : "linear-gradient(to right, #2563eb, #9333ea)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {editorSettings?.heroImage && (
            <div className="absolute inset-0 bg-black/40" />
          )}
          <div className="text-center px-4 max-w-4xl mx-auto relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Welcome to {siteName}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 max-w-2xl mx-auto opacity-90">
              Discover amazing products at great prices
            </p>
            <Button
              size="default"
              onClick={() => navigate("/products")}
              className="bg-white text-black hover:bg-gray-100 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 h-auto"
            >
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Categories Section */}
        <section className="relative">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Categories</h2>
              <p className="text-muted-foreground">
                Explore our product categories
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/categories")}>
              See All Categories <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Categories</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/categories")}
            >
              See All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 text-center">
                    <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
                    <Skeleton className="h-5 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Categories with Auto-Scroll Carousel */}
              <div className="hidden md:block relative px-16 lg:px-20">
                <Carousel
                  className="w-full"
                  opts={{
                    align: "start",
                    loop: true,
                    skipSnaps: false,
                    dragFree: true,
                  }}
                  setApi={setCarouselApi}
                >
                  <CarouselContent className="flex items-center">
                    {(categories as Category[]).map(
                      (category: Category, index: number) => {
                        return (
                          <CarouselItem
                            key={category.id}
                            className="basis-1/5 flex justify-center"
                          >
                            <div className="w-full max-w-[200px] transition-all duration-500 ease-out transform hover:scale-110">
                              <Card
                                className="group cursor-pointer hover:shadow-xl transition-all duration-300 h-full border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 carousel-card"
                                onClick={() =>
                                  navigate(`/category/${category.id}`)
                                }
                              >
                                <CardContent className="p-4 md:p-6 text-center h-full flex flex-col">
                                  {/* Larger Category Image with Enhanced Ring */}
                                  <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-3 md:mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 ring-4 ring-white dark:ring-gray-700 shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0">
                                    {category.image ? (
                                      <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-2xl">
                                        <Tag className="h-10 w-10 lg:h-12 lg:w-12 text-primary" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Category Name */}
                                  <h3 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors flex-1 flex items-center justify-center text-gray-800 dark:text-gray-200">
                                    {category.name}
                                  </h3>

                                  {/* Category Description */}
                                  {category.description && (
                                    <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 mt-2 line-clamp-2 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                                      {category.description}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </CarouselItem>
                        );
                      },
                    )}
                  </CarouselContent>

                  {/* Navigation Arrows with User Interaction Handlers */}
                  <CarouselPrevious
                    className="hidden md:flex -left-12 lg:-left-16 h-12 w-12 border-2 border-gray-300 bg-white/90 backdrop-blur-sm hover:bg-white hover:border-primary hover:scale-110 transition-all duration-300 shadow-xl z-10"
                    onClick={handlePrevious}
                  />
                  <CarouselNext
                    className="hidden md:flex -right-12 lg:-right-16 h-12 w-12 border-2 border-gray-300 bg-white/90 backdrop-blur-sm hover:bg-white hover:border-primary hover:scale-110 transition-all duration-300 shadow-xl z-10"
                    onClick={handleNext}
                  />
                </Carousel>

                {/* Custom CSS for realistic carousel effect */}
                <style>{`
                  .carousel-card {
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                  }

                  /* Side cards effect - smaller and low opacity */
                  [data-embla-carousel]
                    .embla__slide:first-child
                    .carousel-card,
                  [data-embla-carousel]
                    .embla__slide:last-child
                    .carousel-card {
                    transform: scale(0.85);
                    opacity: 0.4;
                  }

                  [data-embla-carousel]
                    .embla__slide:nth-child(2)
                    .carousel-card,
                  [data-embla-carousel]
                    .embla__slide:nth-last-child(2)
                    .carousel-card {
                    transform: scale(0.92);
                    opacity: 0.7;
                  }

                  /* Center cards - full size and opacity */
                  [data-embla-carousel]
                    .embla__slide:nth-child(3)
                    .carousel-card {
                    transform: scale(1);
                    opacity: 1;
                    z-index: 2;
                  }

                  /* Hover effects */
                  .carousel-card:hover {
                    transform: scale(1.05) !important;
                    opacity: 1 !important;
                    z-index: 10 !important;
                  }
                `}</style>
              </div>

              {/* Enhanced Mobile Categories Grid (2 rows with single scroll) */}
              <div className="md:hidden">
                <div
                  className="overflow-x-auto category-scroll"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#cbd5e1 #f1f5f9",
                  }}
                >
                  <div className="flex flex-col gap-2 min-w-max relative">
                    {/* First Row */}
                    <div className="flex gap-3 px-1">
                      {(categories as Category[])
                        .slice(
                          0,
                          Math.ceil((categories as Category[]).length / 2),
                        )
                        .map((category: Category) => (
                          <div
                            key={category.id}
                            className="min-w-[105px] max-w-[105px] cursor-pointer group flex-shrink-0"
                            onClick={() => navigate(`/category/${category.id}`)}
                          >
                            <div className="h-36 text-center p-2 transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              {/* Category Image */}
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl mb-2 overflow-hidden mx-auto group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                                {category.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">
                                    <Tag className="h-6 w-6 text-primary" />
                                  </div>
                                )}
                              </div>

                              {/* Category Name with Proper Spacing */}
                              <div className="flex-1 flex items-center justify-center min-h-[40px] px-1">
                                <h3 className="text-xs font-medium text-center text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-normal">
                                  {category.name}
                                </h3>
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Empty space for first row to align with second row */}
                      <div className="min-w-[105px] max-w-[105px] flex-shrink-0 mr-5"></div>
                    </div>

                    {/* Second Row */}
                    <div className="flex gap-3 px-1">
                      {(categories as Category[])
                        .slice(Math.ceil((categories as Category[]).length / 2))
                        .map((category: Category) => (
                          <div
                            key={category.id}
                            className="min-w-[105px] max-w-[105px] cursor-pointer group flex-shrink-0"
                            onClick={() => navigate(`/category/${category.id}`)}
                          >
                            <div className="h-36 text-center p-2 transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              {/* Category Image */}
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl mb-2 overflow-hidden mx-auto group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                                {category.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">
                                    <Tag className="h-6 w-6 text-primary" />
                                  </div>
                                )}
                              </div>

                              {/* Category Name with Proper Spacing */}
                              <div className="flex-1 flex items-center justify-center min-h-[40px] px-1">
                                <h3 className="text-xs font-medium text-center text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-normal">
                                  {category.name}
                                </h3>
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Empty space for second row to align with first row */}
                      <div className="min-w-[105px] max-w-[105px] flex-shrink-0 mr-5"></div>
                    </div>

                    {/* See More Button positioned at the end between both rows */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/categories")}
                        className="h-20 w-20 rounded-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all duration-300 bg-white dark:bg-gray-800 shadow-lg"
                      >
                        <Search className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium text-primary">
                          See More
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Flash Sale Section */}
        <DarazStyleFlashSale />

        {/* Featured Products Section */}
        <section style={{ marginTop: "15px" }} className="mt-4 sm:mt-6 md:mt-8 md:px-[70px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 p-2 rounded">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 md-h-6 md-w-6 text-white" />
              </div>
              <div>
                <h2 className="sm:text-xl md:text-2xl text-base font-bold">
                  Featured Products
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Hand-picked favorites
                </p>
              </div>
            </div>
            <Button
              variant="link"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium p-0"
              onClick={() => navigate("/deals")}
            >
              Shop More →
            </Button>
          </div>

          {featuredLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="relative">
              {/* Desktop Navigation Arrows */}
              <button
                onClick={() => {
                  const container = document.getElementById("featured-scroll");
                  if (container)
                    container.scrollBy({ left: -300, behavior: "smooth" });
                }}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => {
                  const container = document.getElementById("featured-scroll");
                  if (container)
                    container.scrollBy({ left: 300, behavior: "smooth" });
                }}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>

              <div
                id="featured-scroll"
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide pr-8 md:pl-6 md:pr-12"
              >
                {featuredProducts.map((product: Product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-32 sm:w-36 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/products/${product.slug}`)}
                  >
                    {/* Product Image with Featured Badge */}
                    <div className="relative">
                      <img
                        src={product.imageUrl || "/api/placeholder/144/120"}
                        alt={product.name}
                        className="w-full h-24 sm:h-28 object-cover"
                      />
                      {/* FEATURED Badge - Top Left Corner */}
                      <div className="absolute top-1 left-1">
                        <div className="relative">
                          {/* Badge Background with gradient */}
                          <svg
                            width="50"
                            height="20"
                            viewBox="0 0 50 20"
                            className="drop-shadow-md"
                          >
                            <defs>
                              <linearGradient
                                id={`featuredBadge-${product.id}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#f59e0b" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0 2 C0 1 1 0 2 0 L42 0 C43 0 44 1 44 2 L48 10 L44 18 C44 19 43 20 42 20 L2 20 C1 20 0 19 0 18 Z"
                              fill={`url(#featuredBadge-${product.id})`}
                              stroke="#fff"
                              strokeWidth="1"
                            />
                          </svg>
                          {/* Badge Text */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold leading-none">
                              FEATURED
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-1.5 sm:p-2">
                      {/* Price */}
                      <div className="mb-1 sm:mb-1.5">
                        <div className="text-blue-600 font-bold text-xs sm:text-sm leading-tight">
                          Rs. {product.price}
                        </div>
                        {product.originalPrice && (
                          <div className="text-gray-400 text-xs line-through leading-tight">
                            Rs. {product.originalPrice}
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="text-gray-800 dark:text-gray-200 font-medium text-xs leading-tight truncate mb-0.5">
                        {product.name}
                      </h3>

                      {/* Category */}
                      <p className="text-gray-500 dark:text-gray-400 text-xs hidden sm:block">
                        {product.category?.name || "General"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* See More Button */}
                <div className="flex-shrink-0 w-32 sm:w-36 flex items-center justify-center">
                  <div
                    className="h-32 sm:h-40 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 border-2 border-dashed border-yellow-400 dark:border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/30 dark:hover:to-yellow-700/30 rounded-lg cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                    onClick={() => navigate("/products?featured=true")}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-yellow-700 dark:text-yellow-300 group-hover:text-yellow-800 dark:group-hover:text-yellow-200 transition-colors duration-300">
                      See More
                    </span>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 hidden sm:block">
                      Featured
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* New Arrivals Section */}
        <section style={{ marginTop: "30px" }} className="mt-4 sm:mt-6 md:mt-8 md:px-[70px]">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-green-500 p-1.5 sm:p-2 rounded">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                  New Arrivals
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Fresh products just for you
                </p>
              </div>
            </div>
            <Button
              variant="link"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium p-0"
              onClick={() => navigate("/deals")}
            >
              Shop More →
            </Button>
          </div>

          {latestLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="relative">
              {/* Desktop Navigation Arrows */}
              <button
                onClick={() => {
                  const container =
                    document.getElementById("newarrivals-scroll");
                  if (container)
                    container.scrollBy({ left: -300, behavior: "smooth" });
                }}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => {
                  const container =
                    document.getElementById("newarrivals-scroll");
                  if (container)
                    container.scrollBy({ left: 300, behavior: "smooth" });
                }}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>

              <div
                id="newarrivals-scroll"
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide pr-8 md:pl-6 md:pr-12"
              >
                {latestProducts.map((product: Product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-32 sm:w-36 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/products/${product.slug}`)}
                  >
                    {/* Product Image with New Badge */}
                    <div className="relative">
                      <img
                        src={product.imageUrl || "/api/placeholder/144/120"}
                        alt={product.name}
                        className="w-full h-24 sm:h-28 object-cover"
                      />
                      {/* NEW Badge - Top Left Corner */}
                      <div className="absolute top-1 left-1">
                        <div className="relative">
                          {/* Badge Background with gradient */}
                          <svg
                            width="35"
                            height="20"
                            viewBox="0 0 35 20"
                            className="drop-shadow-md"
                          >
                            <defs>
                              <linearGradient
                                id={`newBadge-${product.id}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0 2 C0 1 1 0 2 0 L27 0 C28 0 29 1 29 2 L33 10 L29 18 C29 19 28 20 27 20 L2 20 C1 20 0 19 0 18 Z"
                              fill={`url(#newBadge-${product.id})`}
                              stroke="#fff"
                              strokeWidth="1"
                            />
                          </svg>
                          {/* Badge Text */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold leading-none">
                              NEW
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-1.5 sm:p-2">
                      {/* Price */}
                      <div className="mb-1 sm:mb-1.5">
                        <div className="text-green-600 font-bold text-xs sm:text-sm leading-tight">
                          Rs. {product.price}
                        </div>
                        {product.originalPrice && (
                          <div className="text-gray-400 text-xs line-through leading-tight">
                            Rs. {product.originalPrice}
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="text-gray-800 dark:text-gray-200 font-medium text-xs leading-tight truncate mb-0.5">
                        {product.name}
                      </h3>

                      {/* Category */}
                      <p className="text-gray-500 dark:text-gray-400 text-xs hidden sm:block">
                        {product.category?.name || "General"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* See More Button */}
                <div className="flex-shrink-0 w-32 sm:w-36 flex items-center justify-center">
                  <div
                    className="h-32 sm:h-40 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 border-2 border-dashed border-green-400 dark:border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 rounded-lg cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                    onClick={() =>
                      navigate("/products?productType=new_arrivals")
                    }
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors duration-300">
                      See More
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 hidden sm:block">
                      New Arrivals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* All Products Section */}
        <section className="mt-4 sm:mt-6 md:mt-8 md:px-[70px]">
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-500 p-1.5 sm:p-2 rounded">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                  All Products
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Explore our complete collection
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/products")}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {allProductsLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-1">
              {allProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
