import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import Footer from "@/components/footer";

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["/api/orders", orderNumber],
    queryFn: async () => {
      if (!orderNumber) return null;
      const response = await fetch(`/api/orders/track/${orderNumber}`);
      if (!response.ok) throw new Error("Order not found");
      return response.json();
    },
    enabled: searchAttempted && !!orderNumber,
  });

  const handleSearch = () => {
    setSearchAttempted(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "processing":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order number to track your package
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Input
                  placeholder="Enter order number (e.g., SF-1234567890)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={!orderNumber || isLoading}>
                  {isLoading ? "Searching..." : "Track Order"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Results */}
          {searchAttempted && (
            <>
              {isLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Searching for your order...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : order ? (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Order {order.orderNumber}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Order Date</p>
                          <p className="font-medium">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-medium">${order.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Status</p>
                          <p className="font-medium capitalize">{order.paymentStatus}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Status Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { status: "pending", label: "Order Placed", description: "We have received your order" },
                          { status: "processing", label: "Processing", description: "Your order is being prepared" },
                          { status: "shipped", label: "Shipped", description: "Your order is on its way" },
                          { status: "delivered", label: "Delivered", description: "Order has been delivered" }
                        ].map((step, index) => {
                          const isCompleted = ["pending", "processing", "shipped", "delivered"]
                            .indexOf(order.status.toLowerCase()) >= index;
                          const isCurrent = order.status.toLowerCase() === step.status;

                          return (
                            <div key={step.status} className="flex items-center space-x-4">
                              <div className={`flex-shrink-0 ${isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                                {getStatusIcon(step.status)}
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                                  {step.label}
                                  {isCurrent && <span className="ml-2 text-primary">(Current)</span>}
                                </div>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              </div>
                              {index < 3 && (
                                <div className={`w-full h-px ${isCompleted ? "bg-primary" : "bg-muted"} hidden md:block`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          <p>{order.shippingAddress.street}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center space-x-4">
                            <img
                              src={item.product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop"}
                              alt={item.product.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} × ${item.price}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                            </div>
                          </div>
                        )) || (
                          <p className="text-muted-foreground">No items found for this order.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
                      <p className="text-muted-foreground mb-4">
                        We couldn't find an order with that number. Please check your order number and try again.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setOrderNumber("");
                        setSearchAttempted(false);
                      }}>
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Where to find your order number?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check your order confirmation email</li>
                    <li>• Look in your account dashboard</li>
                    <li>• Order numbers start with "SF-"</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contact Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Can't find your order? Contact our customer support team.
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}