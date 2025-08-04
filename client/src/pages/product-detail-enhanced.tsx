import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Minus, 
  Plus,
  ArrowLeft,
  Shield,
  Truck,
  RotateCcw,
  MessageSquare,
  ThumbsUp,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  Copy,
  Facebook,
  Twitter,
  Instagram,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FlashSaleTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isActive: boolean;
  progress: number;
}

export default function ProductDetailEnhanced() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [flashSaleTimer, setFlashSaleTimer] = useState<FlashSaleTimer | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: ""
  });
  const [visibleReviews, setVisibleReviews] = useState(10);
  const [showStickyButton, setShowStickyButton] = useState(false);

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", slug],
    queryFn: () => fetch(`/api/products/${slug}`, { credentials: "include" }).then(res => res.json()),
    enabled: !!slug,
  });

  // Fetch flash sale data for this product
  const { data: flashSaleData } = useQuery({
    queryKey: ["/api/flash-sales", "product", product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const response = await fetch(`/api/flash-sales/active`, { credentials: "include" });
      const flashSales = await response.json();
      return flashSales.find((sale: any) => sale.productId === product.id || sale.product?.id === product.id) || null;
    },
    enabled: !!product?.id,
    refetchInterval: 1000, // Refetch every second for real-time updates
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ["/api/products", "related", product?.categoryId],
    queryFn: () => fetch(`/api/products?categoryId=${product.categoryId}&limit=4&excludeId=${product.id}`, { credentials: "include" }).then(res => res.json()),
    enabled: !!product?.categoryId,
  });

  // Fetch reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/products", product?.id, "reviews"],
    queryFn: () => fetch(`/api/products/${product.id}/reviews`, { credentials: "include" }).then(res => res.json()),
    enabled: !!product?.id,
  });

  const reviews = reviewsData?.data || [];

  // Flash Sale Timer Logic
  const calculateFlashSaleTimer = useCallback(() => {
    // First try to use flash sales table data, then fallback to product table data
    let endTime, startTime;
    
    if (flashSaleData?.endTime && flashSaleData?.startTime) {
      // Use flash sales table timestamps
      endTime = new Date(flashSaleData.endTime).getTime();
      startTime = new Date(flashSaleData.startTime).getTime();
    } else if (product?.flashSaleEndDate && product?.flashSaleStartDate) {
      // Fallback to product table timestamps
      endTime = new Date(product.flashSaleEndDate).getTime();
      startTime = new Date(product.flashSaleStartDate).getTime();
    } else {
      setFlashSaleTimer(null);
      return;
    }

    const now = new Date().getTime();
    
    // Check if sale hasn't started yet
    if (now < startTime) {
      setFlashSaleTimer(null);
      return;
    }
    
    // Check if sale has ended
    const timeDiff = endTime - now;
    if (timeDiff <= 0) {
      setFlashSaleTimer(null);
      return;
    }

    // Calculate remaining time from current time to end date
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    // Calculate progress based on database timestamps
    const totalDuration = endTime - startTime;
    const elapsedTime = now - startTime;
    const progress = totalDuration > 0 ? (elapsedTime / totalDuration) * 100 : 0;

    setFlashSaleTimer({
      days,
      hours,
      minutes,
      seconds,
      isActive: true,
      progress: Math.min(100, Math.max(0, progress))
    });
  }, [flashSaleData, product]);

  // Sticky Button Logic
  useEffect(() => {
    const buyButton = document.getElementById('buy-now-button');
    if (!buyButton) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowStickyButton(!entry.isIntersecting);
        });
      },
      { 
        threshold: 0,
        rootMargin: '0px 0px -10px 0px' // Trigger slightly before element is fully out of view
      }
    );
    
    observer.observe(buyButton);
    
    // Additional scroll listener for mobile to ensure sticky button shows
    const handleScroll = () => {
      const buyButtonRect = buyButton.getBoundingClientRect();
      const isVisible = buyButtonRect.top < window.innerHeight && buyButtonRect.bottom > 0;
      setShowStickyButton(!isVisible);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [product]);

  // Update timer every second
  useEffect(() => {
    calculateFlashSaleTimer();
    const interval = setInterval(calculateFlashSaleTimer, 1000);
    return () => clearInterval(interval);
  }, [calculateFlashSaleTimer]);

  // Check if product is in wishlist
  const { data: wishlistData } = useQuery({
    queryKey: ["/api/wishlist"],
    queryFn: () => fetch("/api/wishlist", { credentials: "include" }).then(res => res.json()),
    enabled: !!user,
  });

  useEffect(() => {
    if (wishlistData && product) {
      setIsInWishlist(wishlistData.some((item: any) => item.productId === product.id));
    }
  }, [wishlistData, product]);

  // Mutations
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart!",
        description: "Product has been added to your cart.",
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

  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (isInWishlist) {
        return apiRequest(`/api/wishlist/${productId}`, { method: "DELETE" });
      } else {
        return apiRequest("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId }),
        });
      }
    },
    onSuccess: () => {
      setIsInWishlist(!isInWishlist);
      toast({
        title: isInWishlist ? "Removed from wishlist" : "Added to wishlist",
        description: isInWishlist 
          ? "Product removed from your wishlist." 
          : "Product added to your wishlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update wishlist",
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return apiRequest(`/api/products/${product.id}/reviews`, {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for your review.",
      });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", comment: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "reviews"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const addToCart = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate({ productId: product.id, quantity });
  };

  const toggleWishlist = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to manage your wishlist.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    toggleWishlistMutation.mutate(product.id);
  };

  const shareProduct = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(product.name);
    const description = encodeURIComponent(product.description || '');

    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Product link has been copied to clipboard.",
        });
        setShowShareMenu(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      setShowShareMenu(false);
    }
  };

  const submitReview = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to write a review.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast({
        title: "Please fill all fields",
        description: "Title and comment are required.",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate(reviewForm);
  };

  const nextImage = () => {
    if (images.length > 1) {
      setSelectedImage((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 cursor-pointer transition-colors ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={() => interactive && onRatingChange && onRatingChange(i + 1)}
          />
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-muted animate-pulse rounded-xl" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  // Prepare images
  const images = product.images && Array.isArray(product.images) 
    ? product.images 
    : [product.imageUrl || '/api/placeholder/600/600'];

  // Calculate pricing
  const hasDiscount = product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
  
  // Calculate flash sale price from either flash sales table or product table
  const flashSalePrice = (() => {
    if (flashSaleData?.discount) {
      return parseFloat(product.price) * (1 - flashSaleData.discount / 100);
    } else if (product?.flashSaleDiscount && parseFloat(product.flashSaleDiscount) > 0) {
      return parseFloat(product.price) * (1 - parseFloat(product.flashSaleDiscount) / 100);
    }
    return null;
  })();
  
  const currentPrice = flashSalePrice || (hasDiscount ? parseFloat(product.salePrice) : parseFloat(product.price));
  const originalPrice = parseFloat(product.price);
  const savings = originalPrice - currentPrice;
  const discountPercentage = savings > 0 ? Math.round((savings / originalPrice) * 100) : 0;
  
  // Get flash sale discount percentage
  const flashSaleDiscountPercent = flashSaleData?.discount || 
    (product?.flashSaleDiscount ? parseFloat(product.flashSaleDiscount) : 0);

  const isFlashSale = flashSaleTimer?.isActive && (flashSaleData || (product?.flashSaleStartDate && product?.flashSaleEndDate));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")} className="h-8 px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span>/</span>
          <span>{product.category?.name || 'Products'}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images Gallery */}
          <div className="space-y-4">

            {/* Main Product Image */}
            <div className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted relative border shadow-lg">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Image Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {isFlashSale && (
                    <Badge className="bg-red-500 text-white shadow-lg animate-pulse">
                      <Zap className="h-3 w-3 mr-1" />
                      Flash Sale
                    </Badge>
                  )}
                  {discountPercentage > 0 && (
                    <Badge className="bg-green-500 text-white shadow-lg">
                      -{discountPercentage}% OFF
                    </Badge>
                  )}
                  {product.featured && (
                    <Badge className="bg-blue-500 text-white shadow-lg">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Quick View Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImage === index 
                          ? 'bg-white scale-125 shadow-lg' 
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedImage === index 
                        ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flash Sale Banner - After Product Images - Sticky on Mobile */}
          {isFlashSale && (
            <div className="lg:hidden sticky top-0 z-[9998] mb-2">
              <Card className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 animate-pulse" />
                      <span className="font-bold text-lg">⚡ Flash Sale!</span>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                        -{flashSaleDiscountPercent}% OFF
                      </Badge>
                    </div>
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  
                  {flashSaleTimer && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-xl font-bold">{flashSaleTimer.days.toString().padStart(2, '0')}</div>
                          <div className="text-xs opacity-90">Days</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-xl font-bold">{flashSaleTimer.hours.toString().padStart(2, '0')}</div>
                          <div className="text-xs opacity-90">Hours</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-xl font-bold">{flashSaleTimer.minutes.toString().padStart(2, '0')}</div>
                          <div className="text-xs opacity-90">Min</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-xl font-bold animate-pulse">{flashSaleTimer.seconds.toString().padStart(2, '0')}</div>
                          <div className="text-xs opacity-90">Sec</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sale Progress</span>
                          <span>{Math.round(flashSaleTimer.progress)}%</span>
                        </div>
                        <Progress value={flashSaleTimer.progress} className="h-2 bg-white/20" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Product Information */}
          <div className="space-y-6">
            {/* Flash Sale Banner - Desktop View */}
            {isFlashSale && (
              <div className="hidden lg:block">
                <Card className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-xl mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 animate-pulse" />
                        <span className="font-bold text-xl">⚡ Flash Sale!</span>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-sm">
                          -{flashSaleDiscountPercent}% OFF
                        </Badge>
                      </div>
                      <Sparkles className="h-6 w-6 animate-pulse" />
                    </div>
                    
                    {flashSaleTimer && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="text-2xl font-bold">{flashSaleTimer.days.toString().padStart(2, '0')}</div>
                            <div className="text-xs opacity-90">Days</div>
                          </div>
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="text-2xl font-bold">{flashSaleTimer.hours.toString().padStart(2, '0')}</div>
                            <div className="text-xs opacity-90">Hours</div>
                          </div>
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="text-2xl font-bold">{flashSaleTimer.minutes.toString().padStart(2, '0')}</div>
                            <div className="text-xs opacity-90">Min</div>
                          </div>
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="text-2xl font-bold animate-pulse">{flashSaleTimer.seconds.toString().padStart(2, '0')}</div>
                            <div className="text-xs opacity-90">Sec</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Sale Progress</span>
                            <span>{Math.round(flashSaleTimer.progress)}%</span>
                          </div>
                          <Progress value={flashSaleTimer.progress} className="h-2 bg-white/20" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Product Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="text-xs">
                  {product.category?.name || 'Uncategorized'}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleWishlist}
                    disabled={toggleWishlistMutation.isPending}
                    className={isInWishlist ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                  </Button>
                  
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                    
                    {showShareMenu && (
                      <Card className="absolute right-0 top-full mt-1 z-50 p-2 shadow-lg">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <Button variant="ghost" size="sm" onClick={() => shareProduct('facebook')} className="justify-start">
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => shareProduct('twitter')} className="justify-start">
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => shareProduct('copy')} className="justify-start">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 flex-wrap">
                {product.rating > 0 && (
                  <div className="flex items-center gap-2">
                    {renderStars(Math.floor(product.rating))}
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  SKU: {product.sku}
                </span>
              </div>
            </div>

            {/* Pricing Section */}
            <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl lg:text-4xl font-bold text-green-600">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {savings > 0 && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                  {isFlashSale && (
                    <Badge className="bg-red-500 text-white animate-pulse">
                      Flash Price
                    </Badge>
                  )}
                </div>
                
                {savings > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-500 text-white">
                      Save ${savings.toFixed(2)} ({discountPercentage}% OFF)
                    </Badge>
                    {isFlashSale && (
                      <span className="text-sm text-red-600 font-medium">
                        Limited time offer!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-600">
                    {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left in stock!`}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium text-red-600">Out of Stock</span>
                </>
              )}
            </div>

            {/* Product Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Purchase Section */}
            <Card className="p-4 space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 px-3 rounded-none border-r"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="h-10 px-4 flex items-center justify-center min-w-[60px] bg-muted/30">
                    {quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-10 px-3 rounded-none border-l"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={addToCart}
                  disabled={product.stock === 0 || addToCartMutation.isPending}
                  size="lg"
                  className="w-full h-12 text-lg font-semibold"
                >
                  {addToCartMutation.isPending ? (
                    "Adding..."
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-lg font-semibold"
                  onClick={() => {
                    addToCart();
                    // Add logic to navigate to checkout
                    setTimeout(() => navigate("/cart"), 500);
                  }}
                  disabled={product.stock === 0}
                  id="buy-now-button"
                >
                  Buy Now
                </Button>
              </div>
            </Card>

            {/* Product Features */}
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Secure Payment</div>
                    <div className="text-xs text-muted-foreground">SSL Encrypted</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Fast Shipping</div>
                    <div className="text-xs text-muted-foreground">2-3 Business Days</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Easy Returns</div>
                    <div className="text-xs text-muted-foreground">30 Day Policy</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || 'No detailed description available for this product.'}
                  </p>
                  
                  {product.shortDescription && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Key Features:</h4>
                      <p className="text-muted-foreground">{product.shortDescription}</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Customer Reviews</h3>
                  {user && (
                    <Button onClick={() => setShowReviewForm(true)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                  )}
                </div>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.slice(0, visibleReviews).map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                              {review.user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-medium">{review.user?.username || 'Anonymous'}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        
                        {review.title && (
                          <h4 className="font-medium mb-2">{review.title}</h4>
                        )}
                        
                        <p className="text-muted-foreground">{review.comment}</p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Helpful
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {reviews.length > visibleReviews && (
                      <Button 
                        variant="outline" 
                        onClick={() => setVisibleReviews(prev => prev + 10)}
                        className="w-full"
                      >
                        Load More Reviews
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU:</span>
                      <span className="font-medium">{product.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{product.category?.name || 'N/A'}</span>
                    </div>
                    {product.brand && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brand:</span>
                        <span className="font-medium">{product.brand}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="font-medium">{product.weight}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {product.dimensions && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span className="font-medium">{product.dimensions}</span>
                      </div>
                    )}
                    {product.material && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Material:</span>
                        <span className="font-medium">{product.material}</span>
                      </div>
                    )}
                    {product.color && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Color:</span>
                        <span className="font-medium">{product.color}</span>
                      </div>
                    )}
                    {product.size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{product.size}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products - Enhanced Mobile Grid */}
        {relatedProducts?.products && relatedProducts.products.length > 0 && (
          <div className="mt-12 mb-20">
            <h2 className="text-xl md:text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
              {relatedProducts.products.slice(0, 8).map((relatedProduct: any) => (
                <Card key={relatedProduct.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <img
                      src={relatedProduct.images?.[0] || relatedProduct.imageUrl || '/api/placeholder/300/300'}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {relatedProduct.salePrice && parseFloat(relatedProduct.salePrice) < parseFloat(relatedProduct.price) && (
                      <Badge className="absolute top-1 md:top-2 left-1 md:left-2 bg-red-500 text-white text-xs">
                        SALE
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-2 md:p-3 lg:p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2 text-xs md:text-sm lg:text-base leading-tight">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      <span className="font-bold text-primary text-sm md:text-base">
                        ${relatedProduct.salePrice || relatedProduct.price}
                      </span>
                      {relatedProduct.salePrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          ${relatedProduct.price}
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs md:text-sm h-7 md:h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${relatedProduct.slug}`);
                      }}
                    >
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Product Image Gallery</DialogTitle>
          </DialogHeader>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Form Modal */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(reviewForm.rating, true, (rating) => 
                  setReviewForm(prev => ({ ...prev, rating }))
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="review-title">Title</Label>
              <Input
                id="review-title"
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief title for your review"
              />
            </div>
            <div>
              <Label htmlFor="review-comment">Comment</Label>
              <Textarea
                id="review-comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Tell others about your experience with this product"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
              <Button onClick={submitReview} disabled={submitReviewMutation.isPending}>
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Buy Now Button - Enhanced for all screen sizes */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t shadow-2xl p-3 sm:p-4 z-[9999] transition-all duration-300 ease-in-out ${
          showStickyButton ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ 
          transform: showStickyButton ? 'translateY(0)' : 'translateY(100%)',
          visibility: showStickyButton ? 'visible' : 'hidden',
          pointerEvents: showStickyButton ? 'auto' : 'none'
        }}
      >
        <div className="container mx-auto max-w-screen-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base sm:text-lg font-bold text-green-600 truncate">
                  ${currentPrice.toFixed(2)}
                </span>
                {savings > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
                {isFlashSale && (
                  <Badge className="bg-red-500 text-white text-xs animate-pulse">
                    Flash Sale
                  </Badge>
                )}
              </div>
              {isFlashSale && (
                <div className="text-xs text-red-600 font-medium">
                  ⏰ Limited time offer!
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart();
                }}
                disabled={product.stock === 0 || addToCartMutation.isPending}
                className="p-2"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  addToCart();
                  setTimeout(() => navigate("/cart"), 500);
                }}
                disabled={product.stock === 0 || addToCartMutation.isPending}
                className="px-3 sm:px-4 font-semibold text-sm"
                size="sm"
              >
                {addToCartMutation.isPending ? "Adding..." : "Buy Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}