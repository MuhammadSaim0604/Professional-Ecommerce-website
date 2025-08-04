import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  ChevronDown,
  X,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePriceFormatter } from "@/lib/currency";
import { ProductsLoader } from "@/components/AnimatedLoader";
import { useDocumentTitle } from "@/hooks/use-document-title";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
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
  stock: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface FilterState {
  search: string;
  categoryIds: number[];
  priceRange: [number, number];
  minRating: number;
  inStock: boolean;
  featured: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}



// ProductCard with cart button for products page
const ProductCardWithCart = ({ product }: { product: Product }) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please log in to add items to cart");
      }
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
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
        {product.featured && (
          <Badge className="absolute top-2 left-2 md:top-3 md:left-3 bg-yellow-500 text-black text-xs">
            Featured
          </Badge>
        )}
        {product.category && (
          <Badge className="absolute top-2 right-2 md:top-3 md:right-3 bg-blue-500 text-white text-xs">
            {product.category.name}
          </Badge>
        )}
      </div>
      <CardContent className="p-3 md:p-4">
        <div className="space-y-2 md:space-y-3">
          <h3 className="font-semibold text-base line-clamp-2">{product.name}</h3>
          
          {/* Hide description on mobile, show on desktop */}
          <p className="hidden md:block text-sm text-muted-foreground line-clamp-2">
            {product.description || "No description available"}
          </p>

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="text-lg md:text-xl font-bold">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                ${product.originalPrice}
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
              addToCartMutation.mutate();
            }}
            disabled={addToCartMutation.isPending}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProductsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set document title
  useDocumentTitle("Products");
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktopFiltersOpen, setIsDesktopFiltersOpen] = useState(false);
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(true);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(true);
  const [isRatingFilterOpen, setIsRatingFilterOpen] = useState(true);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoryIds: [],
    priceRange: [0, 1000],
    minRating: 0,
    inStock: false,
    featured: false,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 10;

  // Handle search change with proper optimization
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
  }, []);



  // Debounce search input - only trigger on Enter or when user stops typing
  useEffect(() => {
    // Don't auto-trigger search, only update when user explicitly searches
    if (searchInput === '') {
      setDebouncedSearch('');
    }
  }, [searchInput]);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch }));
      setCurrentPage(1);
      setAllProducts([]);
      setHasMore(true);
    }
  }, [debouncedSearch, filters.search]);

  // Track if search came from header
  const [isHeaderSearch, setIsHeaderSearch] = useState(false);

  // Monitor URL search parameters for changes
  const [currentSearch, setCurrentSearch] = useState(window.location.search);
  
  useEffect(() => {
    const handleUrlChange = () => {
      const newSearch = window.location.search;
      if (newSearch !== currentSearch) {
        setCurrentSearch(newSearch);
        
        const params = new URLSearchParams(newSearch);
        const urlSearch = params.get('search') || '';
        
        // Update search state when URL changes
        setSearchInput(urlSearch);
        setDebouncedSearch(urlSearch);
        
        // Update filters when URL changes
        setFilters(prev => ({
          ...prev,
          search: urlSearch,
          featured: params.get('featured') === 'true',
          sortBy: params.get('sortBy') || 'name',
          sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'asc'
        }));
        
        // Reset pagination for new search
        setCurrentPage(1);
        setAllProducts([]);
        setHasMore(true);
      }
    };

    // Override history methods to detect programmatic URL changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleUrlChange, 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleUrlChange, 0);
    };

    // Listen for back/forward navigation
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [currentSearch]);

  // Get initial URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get('search') || '';
    
    setSearchInput(initialSearch);
    setDebouncedSearch(initialSearch);
    
    setFilters(prev => ({
      ...prev,
      search: initialSearch,
      featured: params.get('featured') === 'true',
      sortBy: params.get('sortBy') || 'name',
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'asc'
    }));
  }, []);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryIds.length > 0) {
      filters.categoryIds.forEach(id => params.append('categoryId', id.toString()));
    }
    if (filters.featured) params.append('featured', 'true');
    if (filters.inStock) params.append('inStock', 'true');
    if (filters.minRating > 0) params.append('minRating', filters.minRating.toString());
    params.append('sortBy', filters.sortBy);
    params.append('sortOrder', filters.sortOrder);
    params.append('limit', itemsPerPage.toString());
    params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
    
    return params.toString();
  };

  const { data: productsData, isLoading: productsLoading, refetch } = useQuery({
    queryKey: ["/api/products", filters, currentPage],
    queryFn: () => fetch(`/api/products?${buildQueryParams()}`, { credentials: "include" }).then(res => res.json()),
    enabled: true,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  // Handle infinite scroll data management
  useEffect(() => {
    if (productsData?.products) {
      if (currentPage === 1) {
        setAllProducts(productsData.products);
      } else {
        setAllProducts(prev => [...prev, ...productsData.products]);
      }
      setHasMore(productsData.products.length === itemsPerPage);
      setIsLoadingMore(false);
    }
  }, [productsData, currentPage]);

  const products = allProducts;
  const totalProducts = productsData?.total || 0;

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
  };

  const loadMoreProducts = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  };

  // Infinite scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Trigger when user is within 100px of the bottom
      if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoadingMore && hasMore) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore]);

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setFilters({
      search: '',
      categoryIds: [],
      priceRange: [0, 1000],
      minRating: 0,
      inStock: false,
      featured: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter(id => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    
    handleFilterChange({ categoryIds: newCategoryIds });
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
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
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
        description: "Product has been added to your wishlist.",
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

  const addToCart = (productId: number) => {
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

  const addToWishlist = (productId: number) => {
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

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-card border-border">
      <div className="relative">
        <div className={`${viewMode === 'grid' ? 'aspect-square' : 'aspect-video'} overflow-hidden bg-muted`}>
          <img
            src={product.imageUrl || "/api/placeholder/300/300"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        {product.featured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
            Featured
          </Badge>
        )}
        {product.stock === 0 && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            Out of Stock
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-background/90 backdrop-blur-sm"
              onClick={() => navigate(`/products/${product.slug}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-background/90 backdrop-blur-sm"
              onClick={() => addToWishlist(product.id)}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <CardContent className={`p-4 ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}>
        <div className={`${viewMode === 'list' ? 'flex-1' : ''} space-y-2`}>
          {product.rating && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {product.rating} ({product.reviewCount || 0})
              </span>
            </div>
          )}
          <h3 
            className="font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/products/${product.slug}`)}
          >
            {product.name}
          </h3>
          {viewMode === 'list' && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
          <div className={`flex items-center ${viewMode === 'list' ? 'space-x-4' : 'justify-between'}`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-primary">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
            <Button 
              size="sm" 
              className="btn-primary"
              onClick={() => addToCart(product.id)}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductCardSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className={viewMode === 'grid' ? 'aspect-square' : 'aspect-video'} />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-full" />
        {viewMode === 'list' && <Skeleton className="h-4 w-3/4" />}
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  const FilterSection = () => (
    <div className="space-y-6">

      {/* Categories */}
      <Collapsible open={isCategoryFilterOpen} onOpenChange={setIsCategoryFilterOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <Label className="cursor-pointer">Categories</Label>
            <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {categoriesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))
          ) : categories && Array.isArray(categories) ? (
            categories.map((category: Category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={filters.categoryIds.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No categories available</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible open={isPriceFilterOpen} onOpenChange={setIsPriceFilterOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <Label className="cursor-pointer">Price Range</Label>
            <ChevronDown className={`h-4 w-4 transition-transform ${isPriceFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => handleFilterChange({ priceRange: value as [number, number] })}
            max={1000}
            min={0}
            step={5}
            className="w-full"
            aria-label="Price range"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rating */}
      <Collapsible open={isRatingFilterOpen} onOpenChange={setIsRatingFilterOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <Label className="cursor-pointer">Minimum Rating</Label>
            <ChevronDown className={`h-4 w-4 transition-transform ${isRatingFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {[4, 3, 2, 1, 0].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.minRating === rating}
                onCheckedChange={() => handleFilterChange({ minRating: rating })}
              />
              <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex items-center">
                {rating > 0 ? (
                  <>
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1">& up</span>
                  </>
                ) : (
                  'All ratings'
                )}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Additional Filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStock}
            onCheckedChange={(checked) => handleFilterChange({ inStock: !!checked })}
          />
          <Label htmlFor="in-stock" className="text-sm cursor-pointer">
            In Stock Only
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={filters.featured}
            onCheckedChange={(checked) => handleFilterChange({ featured: !!checked })}
          />
          <Label htmlFor="featured" className="text-sm cursor-pointer">
            Featured Products
          </Label>
        </div>
      </div>

      {/* Clear Filters */}
      <Button onClick={clearFilters} variant="outline" className="w-full">
        <X className="h-4 w-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">


        {/* Header Search Display - Show search term when searching */}
        {searchInput && (
          <div className="mb-6">
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Search results for:</span>
                <span className="font-medium">{searchInput}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                  setFilters(prev => ({ ...prev, search: '' }));
                  window.history.replaceState({}, '', '/products');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Products</h1>
            <p className="text-muted-foreground">
              {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Sort */}
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                handleFilterChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
              }}
            >
              <SelectTrigger className="w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none border-l"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop Filter Button */}
            <Button 
              variant="outline" 
              className="hidden lg:flex"
              onClick={() => setIsDesktopFiltersOpen(!isDesktopFiltersOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {/* Mobile Filter */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                  <SheetDescription>
                    Narrow down your search with these filters
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSection />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters - Hidden by default, shown when filter button is clicked */}
          {isDesktopFiltersOpen && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <SlidersHorizontal className="h-5 w-5 mr-2" />
                    <h2 className="text-lg font-semibold">Filters</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsDesktopFiltersOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <FilterSection />
              </Card>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {productsLoading ? (
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product: Product) => (
                    <ProductCardWithCart key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && !productsLoading && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={loadMoreProducts}
                      disabled={isLoadingMore}
                      className="px-8"
                    >
                      {isLoadingMore ? 'Loading...' : 'Load More Products'}
                    </Button>
                  </div>
                )}

                {/* Loading More Skeleton */}
                {isLoadingMore && (
                  <div className="mt-6">
                    <ProductsLoader />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}