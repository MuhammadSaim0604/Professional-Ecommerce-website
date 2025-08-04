import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import OrderSummary from "@/components/order-summary";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function CartPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set document title
  useDocumentTitle("Shopping Cart");

  // Get cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });



  // Update cart item mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest(`/api/cart/${id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    },
  });

  // Remove cart item mutation
  const removeCartMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cart/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/cart/clear", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cart",
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
        description: "Item has been added to your wishlist",
      });
    },
  });

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartMutation.mutate({ id, quantity: newQuantity });
  };

  const removeItem = (id: number) => {
    removeCartMutation.mutate(id);
  };

  const moveToWishlist = (item: any) => {
    addToWishlistMutation.mutate(item.product.id);
    removeCartMutation.mutate(item.id);
  };

  // No need for calculations here - handled by OrderSummary component

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view your cart</h2>
              <p className="text-muted-foreground mb-4">
                You need to be signed in to access your shopping cart.
              </p>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <Card className="text-center py-8 sm:py-12">
              <CardContent className="px-4">
                <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <Button onClick={() => navigate("/products")} className="w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 lg:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Cart Items ({cartItems.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCartMutation.mutate()}
                    disabled={clearCartMutation.isPending}
                    className="self-start sm:self-auto"
                  >
                    Clear Cart
                  </Button>
                </div>

                {cartItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      {/* Mobile Layout */}
                      <div className="block sm:hidden">
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={item.product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop"}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded cursor-pointer flex-shrink-0"
                            onClick={() => navigate(`/product/${item.product.slug}`)}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-semibold text-sm leading-tight cursor-pointer hover:text-primary line-clamp-2"
                              onClick={() => navigate(`/product/${item.product.slug}`)}
                            >
                              {item.product.name}
                            </h3>
                            
                            <div className="flex items-center gap-2 mt-1">
                              {item.product.salePrice ? (
                                <>
                                  <span className="text-sm font-semibold text-primary">
                                    PKR {parseFloat(item.product.salePrice).toFixed(2)}
                                  </span>
                                  <span className="text-xs text-muted-foreground line-through">
                                    PKR {parseFloat(item.product.price).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-semibold text-primary">
                                  PKR {parseFloat(item.product.price).toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            {item.product.stock < 5 && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                Only {item.product.stock} left
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Mobile Controls Row */}
                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updateCartMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-2 py-1 min-w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock || updateCartMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Item Total */}
                          <div className="text-sm font-semibold">
                            PKR {((item.product.salePrice ? parseFloat(item.product.salePrice) : parseFloat(item.product.price)) * item.quantity).toFixed(2)}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveToWishlist(item)}
                              disabled={addToWishlistMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Heart className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              disabled={removeCartMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop/Tablet Layout */}
                      <div className="hidden sm:flex items-start space-x-4">
                        <img
                          src={item.product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop"}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded cursor-pointer"
                          onClick={() => navigate(`/product/${item.product.slug}`)}
                        />
                        
                        <div className="flex-1">
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/product/${item.product.slug}`)}
                          >
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 hidden lg:block">
                            {item.product.description?.substring(0, 100)}...
                          </p>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {item.product.salePrice ? (
                                <>
                                  <span className="text-lg font-semibold text-primary">
                                    PKR {parseFloat(item.product.salePrice).toFixed(2)}
                                  </span>
                                  <span className="text-sm text-muted-foreground line-through">
                                    PKR {parseFloat(item.product.price).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-semibold text-primary">
                                  PKR {parseFloat(item.product.price).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {item.product.stock < 5 && (
                              <Badge variant="destructive">
                                Only {item.product.stock} left
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updateCartMutation.isPending}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 min-w-12 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock || updateCartMutation.isPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Item Total */}
                          <div className="text-lg font-semibold">
                            PKR {((item.product.salePrice ? parseFloat(item.product.salePrice) : parseFloat(item.product.price)) * item.quantity).toFixed(2)}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveToWishlist(item)}
                              disabled={addToWishlistMutation.isPending}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              disabled={removeCartMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary - Sticky on Mobile */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-4">
                  <OrderSummary 
                    cartItems={cartItems} 
                    showButtons={true} 
                    enableCouponInput={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}