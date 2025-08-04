import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface OrderSummaryProps {
  cartItems: any[];
  appliedCoupon?: any;
  showButtons?: boolean;
  className?: string;
  onCouponChange?: (coupon: any) => void;
  enableCouponInput?: boolean;
  serverCalculation?: any; // For checkout pages to override calculations
}

export default function OrderSummary({ 
  cartItems, 
  appliedCoupon, 
  showButtons = true,
  className = "",
  onCouponChange,
  enableCouponInput = false,
  serverCalculation
}: OrderSummaryProps) {
  const [location, navigate] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  // Fetch system settings (the single request that loads threshold, shipping, tax)
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/system-settings"],
  });

  // Validate coupon using the new calculate endpoint
  const validateCouponMutation = useMutation({
    mutationFn: async (couponCode: string) => {
      return apiRequest("/api/order/calculate", {
        method: "POST",
        body: JSON.stringify({ couponCode }),
      });
    },
    onSuccess: (data: any) => {
      if (data.coupon && onCouponChange) {
        onCouponChange(data.coupon);
        setCouponError("");
      }
    },
    onError: (error: any) => {
      setCouponError(error.message || "Invalid coupon code");
      if (onCouponChange) {
        onCouponChange(null);
      }
    },
  });

  // Apply coupon
  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    validateCouponMutation.mutate(couponCode.trim());
  };

  // Remove coupon
  const removeCoupon = () => {
    setCouponCode("");
    setCouponError("");
    if (onCouponChange) {
      onCouponChange(null);
    }
  };

  // Process settings data
  const settingsMap = settings?.reduce((acc: any, setting: any) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {}) || {};

  const taxRate = parseFloat(settingsMap.tax_rate || "5") / 100;
  const shippingCost = parseFloat(settingsMap.shipping_cost || "120");
  const freeShippingThreshold = parseFloat(settingsMap.free_shipping_threshold || "5000");

  // Calculate order totals (original cart logic)
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.salePrice ? parseFloat(item.product.salePrice) : parseFloat(item.product.price);
    return sum + (price * item.quantity);
  }, 0);

  // Use server calculation if available (for checkout), otherwise use client-side logic (for cart)
  let finalCalculation;
  if (serverCalculation) {
    // Use server values exactly as returned (including 0 values) - only for checkout pages
    finalCalculation = {
      subtotal: typeof serverCalculation.subtotal === 'number' ? serverCalculation.subtotal : subtotal,
      discount: typeof serverCalculation.discount === 'number' ? serverCalculation.discount : 0,
      shipping: typeof serverCalculation.shipping === 'number' ? serverCalculation.shipping : (subtotal >= freeShippingThreshold ? 0 : shippingCost),
      tax: typeof serverCalculation.tax === 'number' ? serverCalculation.tax : (subtotal * taxRate),
      total: typeof serverCalculation.total === 'number' ? serverCalculation.total : (subtotal + shippingCost + (subtotal * taxRate)),
      freeShippingEligible: typeof serverCalculation.freeShippingEligible === 'boolean' ? serverCalculation.freeShippingEligible : (subtotal >= freeShippingThreshold),
      remainingForFreeShipping: typeof serverCalculation.remainingForFreeShipping === 'number' ? serverCalculation.remainingForFreeShipping : Math.max(0, freeShippingThreshold - subtotal)
    };
  } else {
    // Client-side calculation logic (for cart page using system settings)
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discount = subtotal * (parseFloat(appliedCoupon.discountValue) / 100);
      } else if (appliedCoupon.discountType === 'fixed') {
        discount = Math.min(parseFloat(appliedCoupon.discountValue), subtotal);
      }
    }

    const discountedSubtotal = subtotal - discount;
    const freeShippingEligible = discountedSubtotal >= freeShippingThreshold;
    const shipping = freeShippingEligible ? 0 : shippingCost;
    const tax = discountedSubtotal * taxRate;
    const total = discountedSubtotal + shipping + tax;
    const remainingForFreeShipping = freeShippingEligible ? 0 : Math.max(0, freeShippingThreshold - discountedSubtotal);

    finalCalculation = {
      subtotal,
      discount,
      shipping,
      tax,
      total,
      freeShippingEligible,
      remainingForFreeShipping
    };
  }

  if (settingsLoading) {
    return (
      <Card className={`sticky top-4 ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`sticky top-4 ${className}`}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal ({cartItems.length} items)</span>
            <span>PKR {finalCalculation.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              Shipping
              {finalCalculation.shipping === 0 && (
                <Badge variant="secondary" className="text-xs">FREE</Badge>
              )}
            </span>
            <span>PKR {finalCalculation.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({serverCalculation?.settings ? (serverCalculation.settings.taxRate * 100).toFixed(0) : (taxRate * 100).toFixed(0)}%)</span>
            <span>PKR {finalCalculation.tax.toFixed(2)}</span>
          </div>
          {finalCalculation.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
              <span>-PKR {finalCalculation.discount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>PKR {finalCalculation.total.toFixed(2)}</span>
          </div>
        </div>

        {!finalCalculation.freeShippingEligible && finalCalculation.remainingForFreeShipping > 0 && (
          <Alert>
            <AlertDescription>
              Add PKR {finalCalculation.remainingForFreeShipping.toFixed(2)} more for free shipping!
            </AlertDescription>
          </Alert>
        )}



        {showButtons && (
          <div className="space-y-2 border-t pt-4">
            {location !== "/cart" && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/cart")}
              >
                View Cart
              </Button>
            )}
            <Button 
              className="w-full" 
              onClick={() => navigate("/checkout")}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}