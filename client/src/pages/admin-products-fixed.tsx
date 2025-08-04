import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Upload,
  X,
  LogOut,
} from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function AdminProductsFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    originalPrice: '',
    salePrice: '',
    discountPercentage: '',
    categoryId: '',
    stock: '',
    sku: '',
    weight: '',
    dimensions: '',
    material: '',
    brand: '',
    color: '',
    size: '',
    tags: '',
    isFeatured: false,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const products = (productsData as any)?.products || productsData || [];

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Sending FormData with entries:');
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }
      
      const response = await fetch('/api/products', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product created successfully" });
      resetProductForm();
      setShowProductDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        body: data,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product updated successfully" });
      resetProductForm();
      setShowProductDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetProductForm = () => {
    setProductForm({
      name: '',
      shortDescription: '',
      description: '',
      price: '',
      originalPrice: '',
      salePrice: '',
      discountPercentage: '',
      categoryId: '',
      stock: '',
      sku: '',
      weight: '',
      dimensions: '',
      material: '',
      brand: '',
      color: '',
      size: '',
      tags: '',
      isFeatured: false,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
    });
    setEditingProduct(null);
    setSelectedImages([]);
    setImageUrls([]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      price: product.price,
      originalPrice: product.originalPrice || '',
      salePrice: product.salePrice || '',
      discountPercentage: product.discountPercentage || '',
      categoryId: product.categoryId?.toString() || '',
      stock: product.stock.toString(),
      sku: product.sku,
      weight: product.weight || '',
      dimensions: product.dimensions || '',
      material: product.material || '',
      brand: product.brand || '',
      color: product.color || '',
      size: product.size || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
    });
    setImageUrls(Array.isArray(product.images) ? product.images : []);
    setShowProductDialog(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    // Add all form fields ensuring complete data submission
    formData.append('name', productForm.name);
    formData.append('shortDescription', productForm.shortDescription);
    formData.append('description', productForm.description);
    formData.append('price', productForm.price);
    formData.append('originalPrice', productForm.originalPrice);
    formData.append('salePrice', productForm.salePrice);
    formData.append('discountPercentage', productForm.discountPercentage);
    formData.append('categoryId', productForm.categoryId);
    formData.append('stock', productForm.stock);
    formData.append('sku', productForm.sku);
    formData.append('weight', productForm.weight);
    formData.append('dimensions', productForm.dimensions);
    formData.append('material', productForm.material);
    formData.append('brand', productForm.brand);
    formData.append('color', productForm.color);
    formData.append('size', productForm.size);
    formData.append('metaTitle', productForm.metaTitle);
    formData.append('metaDescription', productForm.metaDescription);
    formData.append('isFeatured', productForm.isFeatured.toString());
    formData.append('isActive', productForm.isActive.toString());

    // Process tags
    const tagsArray = productForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    formData.append('tags', JSON.stringify(tagsArray));

    // Add new images
    selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    // Add existing image URLs for edit operations
    if (imageUrls.length > 0) {
      formData.append('existingImages', JSON.stringify(imageUrls));
    }

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProductMutation.mutate(productId);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.categoryId?.toString() === categoryFilter;
    const matchesFeatured = !featuredFilter || 
                           (featuredFilter === 'featured' && product.isFeatured) ||
                           (featuredFilter === 'not-featured' && !product.isFeatured);
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesFeatured && matchesStatus;
  });

  const logout = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetProductForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="pricing">Pricing</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="seo">SEO & Media</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Product Name *</Label>
                          <Input
                            id="name"
                            value={productForm.name}
                            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sku">SKU *</Label>
                          <Input
                            id="sku"
                            value={productForm.sku}
                            onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="shortDescription">Short Description</Label>
                        <Textarea
                          id="shortDescription"
                          value={productForm.shortDescription}
                          onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={productForm.description}
                          onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="categoryId">Category</Label>
                          <Select 
                            value={productForm.categoryId} 
                            onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {(categories as Category[]).map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="stock">Stock Quantity *</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Price *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="originalPrice">Original Price</Label>
                          <Input
                            id="originalPrice"
                            type="number"
                            step="0.01"
                            value={productForm.originalPrice}
                            onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="salePrice">Sale Price</Label>
                          <Input
                            id="salePrice"
                            type="number"
                            step="0.01"
                            value={productForm.salePrice}
                            onChange={(e) => setProductForm(prev => ({ ...prev, salePrice: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="discountPercentage">Discount %</Label>
                          <Input
                            id="discountPercentage"
                            type="number"
                            step="0.01"
                            value={productForm.discountPercentage}
                            onChange={(e) => setProductForm(prev => ({ ...prev, discountPercentage: e.target.value }))}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="brand">Brand</Label>
                          <Input
                            id="brand"
                            value={productForm.brand}
                            onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="color">Color</Label>
                          <Input
                            id="color"
                            value={productForm.color}
                            onChange={(e) => setProductForm(prev => ({ ...prev, color: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="size">Size</Label>
                          <Input
                            id="size"
                            value={productForm.size}
                            onChange={(e) => setProductForm(prev => ({ ...prev, size: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="weight">Weight</Label>
                          <Input
                            id="weight"
                            value={productForm.weight}
                            onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dimensions">Dimensions</Label>
                          <Input
                            id="dimensions"
                            value={productForm.dimensions}
                            onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="material">Material</Label>
                          <Input
                            id="material"
                            value={productForm.material}
                            onChange={(e) => setProductForm(prev => ({ ...prev, material: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={productForm.tags}
                          onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="electronics, smartphone, featured"
                        />
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isFeatured"
                            checked={productForm.isFeatured}
                            onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: checked }))}
                          />
                          <Label htmlFor="isFeatured">Featured Product</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            checked={productForm.isActive}
                            onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: checked }))}
                          />
                          <Label htmlFor="isActive">Active</Label>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="seo" className="space-y-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          value={productForm.metaTitle}
                          onChange={(e) => setProductForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          value={productForm.metaDescription}
                          onChange={(e) => setProductForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Product Images</Label>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Images
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </div>

                          {/* Display existing image URLs */}
                          {imageUrls.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Existing Images:</p>
                              <div className="grid grid-cols-3 gap-2">
                                {imageUrls.map((url, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={url}
                                      alt={`Product ${index + 1}`}
                                      className="w-full h-20 object-cover rounded border"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                      onClick={() => removeImageUrl(index)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Display selected files */}
                          {selectedImages.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">New Images:</p>
                              <div className="grid grid-cols-3 gap-2">
                                {selectedImages.map((file, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`Selected ${index + 1}`}
                                      className="w-full h-20 object-cover rounded border"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                      onClick={() => removeImage(index)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    >
                      {createProductMutation.isPending || updateProductMutation.isPending 
                        ? 'Saving...' 
                        : editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="categoryFilter">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {(categories as Category[]).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="featuredFilter">Featured</Label>
                <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All products</SelectItem>
                    <SelectItem value="featured">Featured only</SelectItem>
                    <SelectItem value="not-featured">Not featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statusFilter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => {
                    const category = (categories as Category[]).find(c => c.id === product.categoryId);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {Array.isArray(product.images) && product.images.length > 0 && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-10 w-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.isFeatured && (
                                <Badge variant="secondary" className="text-xs">Featured</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{category?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">${product.price}</div>
                            {product.salePrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                ${product.originalPrice}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                            {product.stock} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              disabled={updateProductMutation.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              disabled={deleteProductMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}