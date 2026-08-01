import { useState } from "react";
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
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", slug],
    queryFn: () => fetch(`/api/products/${slug}`, { credentials: "include" }).then(res => res.json()),
    enabled: !!slug,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["/api/products", "related", product?.category?.id],
    queryFn: () => fetch(`/api/products?categoryId=${product.category.id}&limit=4`, { credentials: "include" }).then(res => res.json()),
    enabled: !!product?.category?.id,
  });

  // Reviews query
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/products", product?.id, "reviews"],
    queryFn: () => fetch(`/api/products/${product.id}/reviews`, { credentials: "include" }).then(res => res.json()),
    enabled: !!product?.id,
  });

  const reviews = reviewsData?.data || [];

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: ""
  });
  const [visibleReviews, setVisibleReviews] = useState(10);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${quantity} ${product.name} added to your cart.`,
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

    addToCartMutation.mutate({ productId: product.id, quantity });
  };

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
        description: `${product.name} added to your wishlist.`,
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

  const addToWishlist = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to wishlist.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    addToWishlistMutation.mutate(product.id);
  };

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; title: string; comment: string }) => {
      return apiRequest(`/api/products/${product.id}/reviews`, {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", slug] });
      toast({
        title: "Review submitted",
        description: "Your review has been submitted and is pending approval.",
      });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", comment: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 cursor-pointer transition-colors ${i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
              }`}
            onClick={() => interactive && onRatingChange && onRatingChange(i + 1)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-muted animate-pulse rounded-lg" />
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

  const images = product.images && Array.isArray(product.images)
    ? product.images
    : [product.imageUrl || '/api/placeholder/600/600'];

  const hasDiscount = product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
  const discountPercentage = hasDiscount
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice)) / parseFloat(product.price)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <span>/</span>
          <span>{product.category?.name || 'Products'}</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {hasDiscount && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  -{discountPercentage}%
                </Badge>
              )}
              {product.featured && (
                <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                  Featured
                </Badge>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden bg-muted border-2 transition-colors ${selectedImage === index ? 'border-primary' : 'border-transparent'
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

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category?.name || 'Uncategorized'}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4">
                {product.rating > 0 && (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                          }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  SKU: {product.sku}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary">
                  ${hasDiscount ? product.salePrice : product.price}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.price}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600">
                  You save ${(parseFloat(product.price) - parseFloat(product.salePrice)).toFixed(2)}
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {product.stock > 0 ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                  <span className="text-sm">
                    {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-destructive">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span className="text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={addToCart}
                  disabled={product.stock === 0}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={addToWishlist}>
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">100% secure</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day return</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p>{product.description}</p>
                    {product.shortDescription && (
                      <p className="mt-4">{product.shortDescription}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">SKU:</span>
                      <span className="ml-2">{product.sku}</span>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <span className="ml-2">{product.category?.name || 'Uncategorized'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Stock:</span>
                      <span className="ml-2">{product.stock} units</span>
                    </div>
                    <div>
                      <span className="font-medium">Weight:</span>
                      <span className="ml-2">N/A</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <div className="space-y-6">
                {/* Review Summary */}
                <Card>
                  <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-0 mb-4 md:mb-6">
                      <h3 className="text-base md:text-lg font-semibold">Customer Reviews</h3>
                      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                        <DialogTrigger asChild>
                          <Button className="text-sm md:text-base px-3 py-2 md:px-4 md:py-2 w-full sm:w-auto">
                            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Write a Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Write a Review for {product.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Rating</Label>
                              {renderStars(reviewForm.rating, true, (rating) =>
                                setReviewForm({ ...reviewForm, rating })
                              )}
                            </div>
                            <div>
                              <Label htmlFor="review-title">Review Title</Label>
                              <Input
                                id="review-title"
                                placeholder="Summarize your review in a few words"
                                value={reviewForm.title}
                                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="review-comment">Your Review</Label>
                              <Textarea
                                id="review-comment"
                                placeholder="Share your experience with this product"
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                rows={4}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setShowReviewForm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={submitReview}
                                disabled={submitReviewMutation.isPending}
                              >
                                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Review Stats */}
                    {product.reviewCount > 0 && product.rating && (
                      <div className="flex items-center space-x-3 md:space-x-6 mb-4 md:mb-6">
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl md:text-3xl font-bold">{Number(product.rating).toFixed(1)}</div>
                          <div>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 md:h-4 md:w-4 ${i < Math.floor(Number(product.rating)) ? "fill-current" : ""
                                    }`}
                                />
                              ))}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              Based on {product.reviewCount} reviews
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <Card className="md:p-2">
                  <CardContent className="p-3 md:p-6">
                    {reviewsLoading ? (
                      <div className="animate-pulse space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="space-y-2 p-3 border rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="h-6 w-6 bg-muted rounded-full"></div>
                              <div className="h-3 w-16 bg-muted rounded"></div>
                              <div className="h-3 w-20 bg-muted rounded"></div>
                            </div>
                            <div className="h-3 w-full bg-muted rounded"></div>
                            <div className="h-3 w-3/4 bg-muted rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : reviews && reviews.length > 0 ? (
                      <>
                        <div className="space-y-2 md:space-y-3">
                          {reviews.slice(0, visibleReviews).map((review: any) => (
                            <div key={review.id} className="border border-border/50 rounded-lg p-3 md:p-4 bg-background/50">
                              <div className="flex items-start space-x-2 md:space-x-3 mb-2 md:mb-3">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {review.user.avatar ? (
                                    <img
                                      src={review.user.avatar}
                                      alt={`${review.user.firstName} ${review.user.lastName}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs md:text-sm font-medium">
                                      {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <div className="font-medium text-sm md:text-base truncate">
                                        {review.user.firstName} {review.user.lastName}
                                      </div>
                                      <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                                        <div className="flex text-yellow-400">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-3 w-3 md:h-4 md:w-4 ${i < review.rating ? "fill-current" : ""
                                                }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs md:text-sm text-muted-foreground">
                                          {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {review.title && (
                                    <h4 className="font-medium text-sm md:text-base mt-2 mb-1">{review.title}</h4>
                                  )}
                                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-none">
                                    {review.comment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* See More Button */}
                        {reviews.length > visibleReviews && (
                          <div className="text-center mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setVisibleReviews(prev => prev + 10)}
                              className="text-orange-500 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 text-sm md:text-base px-4 py-2 md:px-6 md:py-3"
                            >
                              See More Reviews ({reviews.length - visibleReviews} remaining)
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6 md:py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                        <p className="text-base md:text-lg font-medium mb-2">No reviews yet</p>
                        <p className="text-sm md:text-base mb-3">Be the first to review this product and help other customers!</p>
                        <Button
                          className="text-sm md:text-base px-4 py-2 md:px-6 md:py-3"
                          variant="outline"
                          onClick={() => setShowReviewForm(true)}
                        >
                          Write the First Review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts?.products?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.products.slice(0, 4).map((relatedProduct: any) => (
                <Card
                  key={relatedProduct.id}
                  className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/products/${relatedProduct.slug}`)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={relatedProduct.imageUrl || '/api/placeholder/300/300'}
                      alt={relatedProduct.name}
                      className="w-full h-32 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {relatedProduct.featured && (
                      <Badge className="absolute top-2 left-2 md:top-3 md:left-3 bg-yellow-500 text-black text-xs">
                        Featured
                      </Badge>
                    )}
                    {relatedProduct.category && (
                      <Badge className="absolute top-2 right-2 md:top-3 md:right-3 bg-blue-500 text-white text-xs">
                        {relatedProduct.category.name}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="font-semibold text-base line-clamp-2">{relatedProduct.name}</h3>

                      {/* Hide description on mobile, show on desktop */}
                      <p className="hidden md:block text-sm text-muted-foreground line-clamp-2">
                        {relatedProduct.description || "No description available"}
                      </p>

                      {/* Price */}
                      <div className="flex items-center space-x-2">
                        <span className="text-lg md:text-xl font-bold">
                          ${relatedProduct.price}
                        </span>
                        {relatedProduct.salePrice && (
                          <span className="text-xs md:text-sm text-muted-foreground line-through">
                            ${relatedProduct.salePrice}
                          </span>
                        )}
                      </div>

                      {/* Rating - Multiple stars based on rating value */}
                      {relatedProduct.rating && (
                        <div className="flex items-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 md:h-4 w-3 md:w-4 ${i < Math.floor(Number(relatedProduct.rating) || 0)
                                    ? "fill-current"
                                    : ""
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs md:text-sm text-muted-foreground ml-2">
                            ({relatedProduct.reviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}