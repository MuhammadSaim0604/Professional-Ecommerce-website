import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Bell, 
  Settings, 
  CreditCard,
  ShoppingBag,
  Star,
  Eye,
  Download,
  Menu,
  X,
  Plus,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage, AvatarInitials } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/use-auth";

export default function UserDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Pakistan',
    phone: '',
    isDefault: false
  });
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [reordering, setReordering] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user orders with real-time updates
  const { data: ordersData = { orders: [] } } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
  
  const orders = ordersData.orders || [];

  // Upload payment proof mutation
  const uploadPaymentProofMutation = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: number; file: File }) => {
      const formData = new FormData();
      formData.append('paymentProof', file);
      
      const response = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload payment proof');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setPaymentFile(null);
      setUploadingPayment(false);
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully. Your order is now under review.",
      });
    },
    onError: () => {
      setUploadingPayment(false);
      toast({
        title: "Error",
        description: "Failed to upload payment proof",
        variant: "destructive",
      });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/orders/${orderId}/reorder`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reorder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setReordering(false);
      toast({
        title: "Success",
        description: "Order placed successfully!",
      });
    },
    onError: () => {
      setReordering(false);
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
    },
  });

  // Get wishlist items with real-time updates
  const { data: wishlistItems = [] } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // Get user addresses with real-time updates
  const { data: addresses = [] } = useQuery({
    queryKey: ["/api/addresses"],
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Get notifications with real-time updates
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 3000,
  });

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to add address');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setAddAddressOpen(false);
      setNewAddress({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        phone: '',
        isDefault: false
      });
      toast({
        title: "Success",
        description: "Address added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add address",
        variant: "destructive",
      });
    },
  });

  const handleAddAddress = () => {
    if (!newAddress.firstName || !newAddress.lastName || !newAddress.address || !newAddress.city || !newAddress.postalCode || !newAddress.country || !newAddress.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addAddressMutation.mutate(newAddress);
  };

  // Edit address mutation
  const editAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      const response = await fetch(`/api/addresses/${addressData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to update address');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setEditAddressOpen(false);
      setEditingAddress(null);
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: number) => {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete address');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setEditAddressOpen(true);
  };

  const handleUpdateAddress = () => {
    if (!editingAddress.firstName || !editingAddress.lastName || !editingAddress.address || !editingAddress.city || !editingAddress.postalCode || !editingAddress.country || !editingAddress.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    editAddressMutation.mutate(editingAddress);
  };

  const handleDeleteAddress = (addressId: number) => {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
    setPaymentFile(null);
    setUploadingPayment(false);
    setReordering(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setPaymentFile(file);
    }
  };

  const handleUploadPaymentProof = () => {
    if (!paymentFile || !selectedOrder) return;
    
    setUploadingPayment(true);
    uploadPaymentProofMutation.mutate({
      orderId: selectedOrder.id,
      file: paymentFile
    });
  };

  const handleReorder = () => {
    if (!selectedOrder) return;
    
    setReordering(true);
    reorderMutation.mutate(selectedOrder.id);
  };

  const needsPaymentProof = (order: any) => {
    return (
      (order.paymentMethod === 'easypaisa' || order.paymentMethod === 'jazzcash') &&
      !order.paymentProof &&
      (order.status === 'cancelled' || order.paymentStatus === 'rejected')
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Filter orders for the current user and calculate totals
  const userOrders = Array.isArray(orders) ? orders.filter((order: any) => order.userId === user?.id) : [];
  const totalSpent = userOrders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0);
  const recentOrders = userOrders.slice(0, 3);
  const unreadNotifications = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Please sign in to access your dashboard.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8 px-2 sm:px-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                <AvatarImage src={user.avatar} alt={user.firstName} />
                <AvatarFallback>
                  <AvatarInitials name={`${user.firstName} ${user.lastName}`} />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage your account, orders, and preferences
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Mobile Menu Button */}
            <div className="flex items-center justify-between md:hidden mb-4 px-2">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 sm:w-80">
                  <SheetHeader>
                    <SheetTitle className="text-lg">Dashboard Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <Button
                      variant={activeTab === "overview" ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-10"
                      onClick={() => {
                        setActiveTab("overview");
                        setSidebarOpen(false);
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Overview
                    </Button>
                    <Button
                      variant={activeTab === "orders" ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-10"
                      onClick={() => {
                        setActiveTab("orders");
                        setSidebarOpen(false);
                      }}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Button>
                    <Button
                      variant={activeTab === "wishlist" ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-10"
                      onClick={() => {
                        setActiveTab("wishlist");
                        setSidebarOpen(false);
                      }}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Button>
                    <Button
                      variant={activeTab === "addresses" ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-10"
                      onClick={() => {
                        setActiveTab("addresses");
                        setSidebarOpen(false);
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Addresses
                    </Button>
                    <Button
                      variant={activeTab === "notifications" ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-10"
                      onClick={() => {
                        setActiveTab("notifications");
                        setSidebarOpen(false);
                      }}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                      {unreadNotifications > 0 && (
                        <Badge variant="destructive" className="ml-auto h-4 w-4 p-0 text-xs flex items-center justify-center">
                          {unreadNotifications}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant={activeTab === "settings" ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-10"
                      onClick={() => {
                        setActiveTab("settings");
                        setSidebarOpen(false);
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <h2 className="text-base sm:text-lg font-semibold capitalize truncate">{activeTab}</h2>
            </div>

            {/* Desktop Tabs */}
            <TabsList className="hidden md:flex w-full justify-start">
              <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
              <TabsTrigger value="orders" className="text-sm">Orders</TabsTrigger>
              <TabsTrigger value="wishlist" className="text-sm">Wishlist</TabsTrigger>
              <TabsTrigger value="addresses" className="text-sm">Addresses</TabsTrigger>
              <TabsTrigger value="notifications" className="text-sm">
                Notifications
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 px-2 sm:px-0">
                <Card className="p-3 sm:p-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate pr-1">Total Orders</CardTitle>
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold">{userOrders.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {userOrders.filter((o: any) => o.status === 'delivered').length} delivered
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate pr-1">Total Spent</CardTitle>
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold">Rs. {totalSpent.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      Lifetime spending
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate pr-1">Wishlist Items</CardTitle>
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold">{wishlistItems.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Saved for later
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate pr-1">Addresses</CardTitle>
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold">{addresses.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Saved addresses
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="mx-2 sm:mx-0">
                <CardHeader className="px-4 sm:px-6 py-4">
                  <CardTitle className="text-lg sm:text-xl">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {recentOrders.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {recentOrders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="font-semibold text-sm sm:text-base truncate">Order #{order.orderNumber}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-sm sm:text-base">Rs. {order.totalAmount}</p>
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("orders")} 
                        className="w-full text-sm h-10"
                      >
                        View All Orders
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                      <p className="text-sm sm:text-base text-muted-foreground">No orders yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4 sm:space-y-6">
              <Card className="mx-2 sm:mx-0">
                <CardHeader className="px-4 sm:px-6 py-4">
                  <CardTitle className="text-lg sm:text-xl">Order History</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {orders.length > 0 ? (
                    <>
                      {/* Mobile Layout */}
                      <div className="block sm:hidden space-y-3">
                        {userOrders.map((order: any) => (
                          <div key={order.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">#{order.orderNumber}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={`${getStatusColor(order.status)} text-xs ml-2`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="text-muted-foreground">{order.items?.length || 0} items • </span>
                                <span className="font-semibold">Rs. {parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewOrderDetails(order)}
                                className="h-8 px-2"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Desktop Table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-sm">Order Number</TableHead>
                              <TableHead className="text-sm">Date</TableHead>
                              <TableHead className="text-sm">Items</TableHead>
                              <TableHead className="text-sm">Total</TableHead>
                              <TableHead className="text-sm">Status</TableHead>
                              <TableHead className="text-sm">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userOrders.map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium text-sm">
                                  #{order.orderNumber}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {order.items?.length || 0} items
                                </TableCell>
                                <TableCell className="text-sm">Rs. {parseFloat(order.totalAmount || 0).toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(order.status)} text-xs`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewOrderDetails(order)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                      <h3 className="text-base sm:text-lg font-semibold mb-2">No orders yet</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Start shopping to see your orders here
                      </p>
                      <Button onClick={() => window.location.href = '/'} className="text-sm h-10">Browse Products</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  {wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistItems.map((item: any) => (
                        <Card key={item.id} className="group">
                          <div className="relative overflow-hidden">
                            <img
                              src={item.product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop"}
                              alt={item.product.name}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{item.product.name}</h3>
                            <p className="text-2xl font-bold text-primary mb-4">
                              ${item.product.price}
                            </p>
                            <div className="flex space-x-2">
                              <Button className="flex-1">Add to Cart</Button>
                              <Button variant="outline" size="icon">
                                <Heart className="h-4 w-4 fill-current" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                      <p className="text-muted-foreground mb-4">
                        Save items you love for later
                      </p>
                      <Button onClick={() => window.location.href = '/'}>Browse Products</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Saved Addresses</CardTitle>
                  <Dialog open={addAddressOpen} onOpenChange={setAddAddressOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={newAddress.firstName}
                              onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
                              placeholder="Enter first name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={newAddress.lastName}
                              onChange={(e) => setNewAddress({...newAddress, lastName: e.target.value})}
                              placeholder="Enter last name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                            placeholder="Enter street address"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                              placeholder="Enter city"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                              id="postalCode"
                              value={newAddress.postalCode}
                              onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
                              placeholder="Enter postal code"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={newAddress.country}
                            onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                            placeholder="Enter country"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                            className="rounded"
                          />
                          <Label htmlFor="isDefault">Set as default address</Label>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setAddAddressOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddAddress} disabled={addAddressMutation.isPending}>
                            {addAddressMutation.isPending ? "Adding..." : "Add Address"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map((address: any) => (
                        <Card key={address.id}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-semibold">
                                {address.firstName} {address.lastName}
                              </h3>
                              {address.isDefault && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>{address.address}</p>
                              <p>{address.city}, {address.postalCode}</p>
                              <p>{address.country}</p>
                              <p>{address.phone}</p>
                            </div>
                            <div className="flex space-x-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditAddress(address)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                                disabled={deleteAddressMutation.isPending}
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
                      <p className="text-muted-foreground mb-4">
                        Add an address for faster checkout
                      </p>
                      <Button onClick={() => setAddAddressOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Notifications</CardTitle>
                  <Button variant="outline" size="sm">Mark All Read</Button>
                </CardHeader>
                <CardContent>
                  {notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.map((notification: any) => (
                        <div 
                          key={notification.id} 
                          className={`p-4 border rounded-lg ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                      <p className="text-muted-foreground">
                        You're all caught up!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Personal Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate('/profile?tab=profile')}
                      >
                        Edit Profile
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Email Notifications</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/profile?tab=preferences')}
                          >
                            Configure
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Privacy Settings</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/profile?tab=privacy')}
                          >
                            Manage
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Change Password</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/profile?tab=security')}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <Badge variant={selectedOrder.paymentStatus === 'approved' ? 'default' : 'secondary'}>
                    {selectedOrder.paymentStatus || 'Pending'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedOrder.paymentMethod || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {parseFloat(selectedOrder.subtotalAmount || selectedOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountAmount && parseFloat(selectedOrder.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-Rs. {parseFloat(selectedOrder.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.shippingAmount && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>Rs. {parseFloat(selectedOrder.shippingAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.taxAmount && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>Rs. {parseFloat(selectedOrder.taxAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Total:</span>
                    <span>Rs. {parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </Label>
                  <div className="text-sm text-muted-foreground mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    <p className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {selectedOrder.shippingAddress.phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items with Images */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Order Items ({selectedOrder.items?.length || 0})
                </Label>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {item.product?.images && item.product.images.length > 0 ? (
                            <img 
                              src={item.product.images[0]} 
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{item.product?.name || 'Product'}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × Rs. {parseFloat(item.price || 0).toFixed(2)}
                          </p>
                          {item.product?.brand && (
                            <p className="text-xs text-muted-foreground">Brand: {item.product.brand}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">Rs. {(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2" />
                      <p>No items found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof Display */}
              {selectedOrder.paymentProof && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Proof
                  </Label>
                  <div className="mt-2 p-3 border rounded-lg">
                    <img 
                      src={selectedOrder.paymentProof.startsWith('/uploads') ? selectedOrder.paymentProof : `/uploads/payments/${selectedOrder.paymentProof}`}
                      alt="Payment Proof"
                      className="max-w-full h-auto max-h-64 object-contain rounded border"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(selectedOrder.paymentProof.startsWith('/uploads') ? selectedOrder.paymentProof : `/uploads/payments/${selectedOrder.paymentProof}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Proof Upload Section (for cancelled/rejected orders) */}
              {needsPaymentProof(selectedOrder) && (
                <div className="border-2 border-dashed border-orange-200 bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">Payment Proof Required</h4>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                    Your order was cancelled due to missing payment proof. Upload your {selectedOrder.paymentMethod} payment screenshot to reorder.
                  </p>
                  
                  {paymentFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        File selected: {paymentFile.name}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUploadPaymentProof}
                          disabled={uploadingPayment}
                          size="sm"
                        >
                          {uploadingPayment ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload & Reorder
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentFile(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileChange}
                        className="hidden"
                        id="paymentProofUpload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('paymentProofUpload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select Payment Screenshot
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: JPG, JPEG, PNG (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reorder Button (for delivered orders) */}
              {selectedOrder.status === 'delivered' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleReorder}
                    disabled={reordering}
                    className="flex-1"
                  >
                    {reordering ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reorder Items
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div>
                  <Label className="text-sm font-medium">Order Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Admin Notes (if any) */}
              {selectedOrder.adminNotes && (
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    {selectedOrder.adminNotes}
                  </p>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedOrder.rejectionReason && (
                <div>
                  <Label className="text-sm font-medium text-red-600">Rejection Reason</Label>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    {selectedOrder.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          {editingAddress && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editingAddress.firstName}
                    onChange={(e) => setEditingAddress({...editingAddress, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editingAddress.lastName}
                    onChange={(e) => setEditingAddress({...editingAddress, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAddress">Address</Label>
                <Input
                  id="editAddress"
                  value={editingAddress.address}
                  onChange={(e) => setEditingAddress({...editingAddress, address: e.target.value})}
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCity">City</Label>
                  <Input
                    id="editCity"
                    value={editingAddress.city}
                    onChange={(e) => setEditingAddress({...editingAddress, city: e.target.value})}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPostalCode">Postal Code</Label>
                  <Input
                    id="editPostalCode"
                    value={editingAddress.postalCode}
                    onChange={(e) => setEditingAddress({...editingAddress, postalCode: e.target.value})}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCountry">Country</Label>
                  <Input
                    id="editCountry"
                    value={editingAddress.country}
                    onChange={(e) => setEditingAddress({...editingAddress, country: e.target.value})}
                    placeholder="Enter country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone</Label>
                  <Input
                    id="editPhone"
                    value={editingAddress.phone}
                    onChange={(e) => setEditingAddress({...editingAddress, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsDefault"
                  checked={editingAddress.isDefault}
                  onChange={(e) => setEditingAddress({...editingAddress, isDefault: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="editIsDefault">Set as default address</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditAddressOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAddress} disabled={editAddressMutation.isPending}>
                  {editAddressMutation.isPending ? "Updating..." : "Update Address"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}