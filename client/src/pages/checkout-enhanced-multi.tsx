import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  CreditCard,
  Truck,
  MapPin,
  Check,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Percent,
  AlertCircle,
  Upload,
  FileImage,
  Phone,
  Banknote,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import OrderSummary from "@/components/order-summary";

const steps = [
  { id: 1, title: "Cart Review", icon: ShoppingBag },
  { id: 2, title: "Shipping", icon: Truck },
  { id: 3, title: "Payment", icon: CreditCard },
  { id: 4, title: "Confirmation", icon: Check },
];

const shippingSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(10, "Please enter a complete address"),
  city: z.string().min(2, "Please enter a valid city"),
  postalCode: z.string().min(5, "Please enter a valid postal code"),
  country: z.string().default("Pakistan"),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["cod", "easypaisa", "jazzcash"]),
  couponCode: z.string().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentSetting {
  id: number;
  provider: string;
  name: string;
  accountNumber?: string;
  accountName?: string;
  instructions?: string;
  isActive: boolean;
}

export default function CheckoutEnhancedMulti() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [serverCalculation, setServerCalculation] = useState<any>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // Get cart items
  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Get payment settings
  const { data: paymentSettings = [] } = useQuery<PaymentSetting[]>({
    queryKey: ["/api/payment-settings"],
  });

  // Get user addresses
  const { data: savedAddresses = [] } = useQuery<any[]>({
    queryKey: ["/api/addresses"],
    enabled: !!user,
  });

  // Initialize forms
  const shippingForm = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Pakistan",
      notes: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "cod",
      couponCode: "",
    },
  });

  // Auto-fill default address on component mount
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddress && currentStep === 2) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        shippingForm.setValue("firstName", defaultAddress.firstName);
        shippingForm.setValue("lastName", defaultAddress.lastName);
        shippingForm.setValue("phone", defaultAddress.phone);
        shippingForm.setValue("address", defaultAddress.address);
        shippingForm.setValue("city", defaultAddress.city);
        shippingForm.setValue("postalCode", defaultAddress.postalCode);
        shippingForm.setValue("country", defaultAddress.country);
      }
    }
  }, [savedAddresses, selectedAddress, currentStep, shippingForm]);



  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("/api/order/calculate", {
        method: "POST",
        body: JSON.stringify({ couponCode: code }),
      });
      return await response.json();
    },
    onSuccess: (result) => {
      console.log("Coupon apply success:", result);
      if (result && result.coupon) {
        setAppliedCoupon(result.coupon);
        setServerCalculation(result); // Store server calculation for OrderSummary
        toast({
          title: "Coupon applied!",
          description: `${result.coupon.code} - PKR ${result.discount.toFixed(2)} discount applied`,
        });
      } else {
        console.log("No coupon in result:", result);
        toast({
          title: "Invalid coupon",
          description: "This coupon is not valid or has expired.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.log("Coupon apply error:", error);
      toast({
        title: "Invalid coupon",
        description: error.message || "This coupon code is not valid.",
        variant: "destructive",
      });
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
      return response.json();
    },
    onSuccess: (order) => {
      setCompletedOrder(order);
      setOrderPlaced(true);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      // Check if payment proof upload is needed
      if (paymentData?.paymentMethod === 'easypaisa' || paymentData?.paymentMethod === 'jazzcash') {
        setShowPaymentProof(true);
        toast({
          title: "Order placed successfully!",
          description: "Please upload your payment proof to complete the order.",
        });
      } else {
        setCurrentStep(4);
        toast({
          title: "Order placed successfully!",
          description: `Your order #${order.orderNumber} has been placed.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message || "There was an error placing your order.",
        variant: "destructive",
      });
    },
  });

  // Upload payment proof mutation
  const uploadPaymentProof = useMutation({
    mutationFn: (formData: FormData) =>
      fetch(`/api/orders/${completedOrder?.id}/upload-proof`, {
        method: "POST",
        body: formData,
      }),
    onSuccess: () => {
      toast({
        title: "Payment proof uploaded successfully!",
        description: "Your payment is now pending admin approval. You'll be notified once approved.",
      });
      setShowPaymentProof(false);
      setCurrentStep(4);
    },
    onError: () => {
      toast({
        title: "Failed to upload payment proof",
        variant: "destructive",
      });
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && (cartItems as any[]).length === 0 && !orderPlaced) {
      navigate("/cart");
    }
  }, [cartItems, cartLoading, orderPlaced, navigate]);

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setCurrentStep(3);
  };

  const handlePaymentSubmit = (data: PaymentFormData) => {
    setPaymentData(data);
    
    // Prepare order data - server will calculate prices for security
    const orderData = {
      shippingAddress: shippingData,
      paymentMethod: data.paymentMethod,
      couponCode: appliedCoupon?.code,
      notes: shippingData?.notes,
    };

    placeOrderMutation.mutate(orderData);
  };

  const applyCoupon = () => {
    const code = paymentForm.getValues("couponCode");
    if (code) {
      applyCouponMutation.mutate(code);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setServerCalculation(null);
    paymentForm.setValue("couponCode", "");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, JPEG, or PNG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setPaymentProofFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentProofPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentProofUpload = () => {
    if (!paymentProofFile || !completedOrder) return;

    const formData = new FormData();
    formData.append('paymentProof', paymentProofFile);
    
    uploadPaymentProof.mutate(formData);
  };

  const getPaymentMethodDetails = (provider: string) => {
    return paymentSettings.find(setting => setting.provider === provider && setting.isActive);
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            {/* Desktop Version */}
            <div className="hidden md:flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive ? 'border-primary bg-primary text-primary-foreground' :
                      isCompleted ? 'border-green-500 bg-green-500 text-white' :
                      'border-gray-300 bg-white text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-primary' :
                      isCompleted ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Version */}
            <div className="md:hidden">
              <div className="flex items-center justify-center space-x-2 mb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        isActive ? 'border-primary bg-primary text-primary-foreground' :
                        isCompleted ? 'border-green-500 bg-green-500 text-white' :
                        'border-gray-300 bg-white text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-8 h-0.5 mx-1 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Current Step Title on Mobile */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-primary">
                  Step {currentStep}: {steps.find(s => s.id === currentStep)?.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentStep} of {steps.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Cart Review */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="text-lg sm:text-xl">Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 space-y-4">
                    {(cartItems as any[]).map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                        <img
                          src={typeof item.product.images?.[0] === 'string' ? item.product.images[0] : JSON.parse(item.product.images?.[0] || '[]')[0]}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${item.product.salePrice || item.product.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${((parseFloat(item.product.salePrice || item.product.price)) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-center sm:justify-end pt-6">
                      <Button 
                        onClick={() => setCurrentStep(2)}
                        className="w-full sm:w-auto h-11"
                      >
                        Continue to Shipping
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Shipping Information */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="text-lg sm:text-xl">Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-6">
                    {/* Saved Addresses Section */}
                    {savedAddresses.length > 0 && (
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Saved Addresses</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAddress(null);
                              // Clear form
                              shippingForm.setValue("firstName", user?.firstName || "");
                              shippingForm.setValue("lastName", user?.lastName || "");
                              shippingForm.setValue("phone", "");
                              shippingForm.setValue("address", "");
                              shippingForm.setValue("city", "");
                              shippingForm.setValue("postalCode", "");
                              shippingForm.setValue("country", "Pakistan");
                            }}
                          >
                            Enter Manually
                          </Button>
                        </div>
                        
                        <div className="grid gap-3">
                          {savedAddresses.map((address: any) => (
                            <div 
                              key={address.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedAddress?.id === address.id 
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                              onClick={() => {
                                setSelectedAddress(address);
                                shippingForm.setValue("firstName", address.firstName);
                                shippingForm.setValue("lastName", address.lastName);
                                shippingForm.setValue("phone", address.phone);
                                shippingForm.setValue("address", address.address);
                                shippingForm.setValue("city", address.city);
                                shippingForm.setValue("postalCode", address.postalCode);
                                shippingForm.setValue("country", address.country);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{address.firstName} {address.lastName}</p>
                                    {address.isDefault && (
                                      <Badge variant="secondary" className="text-xs">Default</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{address.address}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.city}, {address.postalCode}, {address.country}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                                </div>
                                {selectedAddress?.id === address.id && (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Separator */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              {selectedAddress ? "Edit Selected Address" : "Or Enter Address Manually"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Form {...shippingForm}>
                      <form onSubmit={shippingForm.handleSubmit(handleShippingSubmit)} className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={shippingForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-10 sm:h-11" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-10 sm:h-11" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={shippingForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} className="h-10 sm:h-11" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-10 sm:h-11" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={shippingForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Enter your complete address" 
                                  className="min-h-[80px] sm:min-h-[100px] resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <FormField
                            control={shippingForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-10 sm:h-11" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-10 sm:h-11" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2 md:col-span-1">
                                <FormLabel>Country</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 sm:h-11">
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                                    <SelectItem value="India">India</SelectItem>
                                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={shippingForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Special delivery instructions" 
                                  className="min-h-[60px] sm:min-h-[80px] resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Mobile Buttons - Full Width Stack */}
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-6">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setCurrentStep(1)}
                            className="w-full sm:w-auto order-2 sm:order-1 h-11"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Cart
                          </Button>
                          <Button 
                            type="submit"
                            className="w-full sm:w-auto order-1 sm:order-2 h-11"
                          >
                            Continue to Payment
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="text-lg sm:text-xl">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <Form {...paymentForm}>
                      <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-6">
                        <FormField
                          control={paymentForm.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Payment Method</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="space-y-4"
                                >
                                  {/* Cash on Delivery */}
                                  {getPaymentMethodDetails('cod')?.isActive && (
                                    <div className="flex items-start space-x-3 border rounded-lg p-4">
                                      <RadioGroupItem value="cod" id="cod" className="mt-1" />
                                      <div className="flex-1">
                                        <Label htmlFor="cod" className="flex items-center gap-2 font-medium cursor-pointer">
                                          <Banknote className="h-4 w-4" />
                                          Cash on Delivery
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {getPaymentMethodDetails('cod')?.instructions || "Pay cash when your order is delivered"}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* EasyPaisa */}
                                  {getPaymentMethodDetails('easypaisa')?.isActive && (
                                    <div className="flex items-start space-x-3 border rounded-lg p-4">
                                      <RadioGroupItem value="easypaisa" id="easypaisa" className="mt-1" />
                                      <div className="flex-1">
                                        <Label htmlFor="easypaisa" className="flex items-center gap-2 font-medium cursor-pointer">
                                          <Phone className="h-4 w-4" />
                                          EasyPaisa
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Account: {getPaymentMethodDetails('easypaisa')?.accountNumber}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Name: {getPaymentMethodDetails('easypaisa')?.accountName}
                                        </p>
                                        <p className="text-xs text-amber-600 mt-2">
                                          {getPaymentMethodDetails('easypaisa')?.instructions}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* JazzCash */}
                                  {getPaymentMethodDetails('jazzcash')?.isActive && (
                                    <div className="flex items-start space-x-3 border rounded-lg p-4">
                                      <RadioGroupItem value="jazzcash" id="jazzcash" className="mt-1" />
                                      <div className="flex-1">
                                        <Label htmlFor="jazzcash" className="flex items-center gap-2 font-medium cursor-pointer">
                                          <Phone className="h-4 w-4" />
                                          JazzCash
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Account: {getPaymentMethodDetails('jazzcash')?.accountNumber}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Name: {getPaymentMethodDetails('jazzcash')?.accountName}
                                        </p>
                                        <p className="text-xs text-amber-600 mt-2">
                                          {getPaymentMethodDetails('jazzcash')?.instructions}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Payment Instructions */}
                        {(paymentForm.watch("paymentMethod") === 'easypaisa' || paymentForm.watch("paymentMethod") === 'jazzcash') && (
                          <Alert className="border-amber-200 bg-amber-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-amber-800">
                              <strong>Payment Instructions:</strong>
                              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                                <li>Send the exact order amount to the account above</li>
                                <li>Take a screenshot of the successful transaction</li>
                                <li>Upload the screenshot after placing your order</li>
                                <li>Wait for admin approval (usually within 24 hours)</li>
                              </ol>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Coupon Code */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-3">Discount Code</h3>
                          {appliedCoupon ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">
                                  <Percent className="w-3 h-3 mr-1" />
                                  {appliedCoupon.code}
                                </Badge>
                                <span className="text-sm text-green-600">
                                  -{appliedCoupon.discountType === "percentage" ? 
                                    `${appliedCoupon.discountValue}%` : 
                                    `${appliedCoupon.discountValue}`}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeCoupon}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <FormField
                                control={paymentForm.control}
                                name="couponCode"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input {...field} placeholder="Enter coupon code" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={applyCoupon}
                                disabled={applyCouponMutation.isPending}
                              >
                                Apply
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Mobile Payment Buttons - Full Width Stack */}
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-6">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setCurrentStep(2)}
                            className="w-full sm:w-auto order-2 sm:order-1 h-11"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Shipping
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={placeOrderMutation.isPending}
                            className="w-full sm:w-auto order-1 sm:order-2 h-11 min-w-32"
                          >
                            {placeOrderMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              "Place Order"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Order Confirmation */}
              {currentStep === 4 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
                    <p className="text-muted-foreground mb-6">
                      {paymentData?.paymentMethod === 'cod' 
                        ? "Your order will be delivered and payment collected on delivery."
                        : "Your order is pending payment confirmation. You'll be notified once approved."
                      }
                    </p>
                    <div className="space-y-2">
                      <Button onClick={() => navigate("/dashboard")}>
                        View Order History
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/")} className="ml-2">
                        Continue Shopping
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <OrderSummary 
                cartItems={cartItems} 
                appliedCoupon={appliedCoupon}
                showButtons={false}
                className="sticky top-4"
                onCouponChange={setAppliedCoupon}
                enableCouponInput={false}
                serverCalculation={serverCalculation}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Upload Dialog */}
      <Dialog open={showPaymentProof} onOpenChange={setShowPaymentProof}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Payment Proof
            </DialogTitle>
            <DialogDescription>
              Please upload a screenshot of your successful {paymentData?.paymentMethod} transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {paymentProofPreview ? (
              <div className="space-y-4">
                <img 
                  src={paymentProofPreview} 
                  alt="Payment proof preview"
                  className="w-full h-48 object-cover border rounded-lg"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentProofFile(null);
                    setPaymentProofPreview(null);
                  }}
                  className="w-full"
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Upload Payment Screenshot</p>
                  <p className="text-xs text-muted-foreground">JPG, JPEG, or PNG (max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="paymentProof"
                />
                <Label htmlFor="paymentProof" className="cursor-pointer">
                  <Button variant="outline" className="mt-4" asChild>
                    <span>Choose File</span>
                  </Button>
                </Label>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentProof(false);
                  setCurrentStep(4);
                }}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handlePaymentProofUpload}
                disabled={!paymentProofFile || uploadPaymentProof.isPending}
                className="flex-1"
              >
                {uploadPaymentProof.isPending ? "Uploading..." : "Upload Proof"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              You can also upload payment proof later from your user dashboard
            </p>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}