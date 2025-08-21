import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { 
  ShoppingBag, 
  Grid3X3,
  Package,
  TrendingUp,
  Star,
  ArrowRight,
  List,
  LayoutGrid,
  Smartphone,
  Gamepad2,
  Home,
  Heart,
  Baby,
  Car,
  Shirt,
  Watch,
  Footprints,
  Book,
  Music,
  Camera,
  Laptop,
  Headphones,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount?: number;
  subcategories?: Subcategory[];
}

interface Subcategory {
  sub_name: string;
  picture: string;
  search_term: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  images: string[];
  categoryId: number;
}

export default function CategoriesPage() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'sidebar'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: productsData } = useQuery({
    queryKey: ["/api/products", { limit: 1000 }],
    queryFn: () => fetch("/api/products?limit=1000", { credentials: "include" }).then(res => res.json()),
  });

  // Calculate product counts for each category
  const getCategoryProductCount = (categoryId: number) => {
    if (!productsData?.products) return 0;
    return productsData.products.filter((product: Product) => product.categoryId === categoryId).length;
  };

  const getCategoryProducts = (categoryId: number, limit = 4) => {
    if (!productsData?.products) return [];
    return productsData.products
      .filter((product: Product) => product.categoryId === categoryId)
      .slice(0, limit);
  };

  // Simple fade-in animation
  useEffect(() => {
    if (categoriesLoading || !categories.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(".category-item", 
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          ease: "power2.out",
          stagger: 0.1
        }
      );
    }, [categoriesRef]);

    return () => ctx.revert();
  }, [categoriesLoading, categories.length, viewMode]);

  // Auto-select first category when switching to sidebar mode
  useEffect(() => {
    if (viewMode === 'sidebar' && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [viewMode, categories, selectedCategory]);

  // Category icons mapping
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('electronic') || name.includes('phone')) return Smartphone;
    if (name.includes('game') || name.includes('toy')) return Gamepad2;
    if (name.includes('home') || name.includes('appliance')) return Home;
    if (name.includes('health') || name.includes('beauty')) return Heart;
    if (name.includes('baby') || name.includes('mother')) return Baby;
    if (name.includes('automotive') || name.includes('car')) return Car;
    if (name.includes('fashion') || name.includes('clothing')) return Shirt;
    if (name.includes('watch') || name.includes('jewelry')) return Watch;
    if (name.includes('shoe') || name.includes('footwear')) return Footprints;
    if (name.includes('book') || name.includes('education')) return Book;
    if (name.includes('music') || name.includes('audio')) return Music;
    if (name.includes('camera') || name.includes('photo')) return Camera;
    if (name.includes('computer') || name.includes('laptop')) return Laptop;
    if (name.includes('headphone') || name.includes('audio')) return Headphones;
    if (name.includes('sport') || name.includes('outdoor')) return TrendingUp;
    if (name.includes('gift')) return Gift;
    return ShoppingBag;
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-5 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-3" />
                  <div className="h-9 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Shop by Category
              </h1>
              <p className="text-muted-foreground">
                Browse our wide selection of products organized by category
              </p>
            </div>
            
            {/* View Mode Toggle */}
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
                variant={viewMode === 'sidebar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('sidebar')}
                className="rounded-l-none border-l"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Content */}
      <section ref={categoriesRef} className="py-6">
        <div className="container mx-auto px-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No Categories Found</h2>
              <p className="text-muted-foreground">
                Categories will appear here once they're added to the store.
              </p>
            </div>
          ) : viewMode === 'sidebar' ? (
            <div className="flex gap-6">
              {/* Sidebar */}
              <div className="w-48 md:w-64 flex-shrink-0">
                <Card className="sticky top-6 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
                  <CardHeader className="pb-3">
                    <h3 className="text-sm md:text-lg font-semibold">Categories</h3>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1 p-2">
                      {categories.map((category: Category) => {
                        const productCount = getCategoryProductCount(category.id);
                        const IconComponent = getCategoryIcon(category.name);
                        const isSelected = selectedCategory?.id === category.id;
                        
                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category)}
                            className={`w-full transition-colors rounded-lg group ${
                              isSelected 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            {/* Mobile: Icon + Text in column */}
                            <div className="md:hidden flex flex-col items-center gap-1 p-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-primary/20 text-primary' 
                                  : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                              }`}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <p className="text-xs font-medium text-center leading-tight max-w-full break-words line-clamp-2">
                                {category.name}
                              </p>
                            </div>
                            
                            {/* Desktop: Icon + Text + Count inline */}
                            <div className="hidden md:flex items-center gap-3 p-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-primary/20 text-primary' 
                                  : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                              }`}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium truncate">{category.name}</p>
                                <p className="text-xs text-muted-foreground">{productCount} items</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Content - Subcategories */}
              <div className="flex-1">
                {selectedCategory ? (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">{selectedCategory.name}</h2>
                      <p className="text-muted-foreground">
                        {selectedCategory.description || `Explore subcategories in ${selectedCategory.name}`}
                      </p>
                    </div>
                    
                    {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedCategory.subcategories
                          .filter((subcategory: Subcategory) => {
                            // Only show subcategories that have products
                            if (!productsData?.products) return true; // Show all if products not loaded yet
                            const subcategoryProducts = productsData.products.filter((product: Product) => 
                              product.categoryId === selectedCategory.id && 
                              product.subcategory && 
                              product.subcategory.toLowerCase() === subcategory.search_term.toLowerCase()
                            );
                            return subcategoryProducts.length > 0;
                          })
                          .map((subcategory: Subcategory, index: number) => (
                          <div 
                            key={index}
                            className="category-item group cursor-pointer"
                            onClick={() => navigate(`/products?search=${encodeURIComponent(subcategory.sub_name)}&categoryId=${selectedCategory.id}&sub_term=${encodeURIComponent(subcategory.search_term)}`)}
                          >
                            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                              <div className="aspect-square bg-muted/30 relative overflow-hidden">
                                {subcategory.picture ? (
                                  <img
                                    src={subcategory.picture}
                                    alt={subcategory.sub_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-full h-full flex items-center justify-center ${subcategory.picture ? 'hidden' : ''}`}>
                                  <div className="p-4 rounded-full bg-primary/10">
                                    <ShoppingBag className="h-8 w-8 text-primary" />
                                  </div>
                                </div>
                                
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                              </div>

                              <CardContent className="p-3">
                                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors text-center">
                                  {subcategory.sub_name}
                                </h3>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Subcategories Available</h3>
                        <p className="text-muted-foreground mb-4">
                          Subcategories will appear here as products are added to this category.
                        </p>
                        <Button onClick={() => navigate(`/category/${selectedCategory.id}`)}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Browse All {selectedCategory.name}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Select a Category</h3>
                    <p className="text-muted-foreground">
                      Choose a category from the sidebar to view its subcategories.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category: Category) => {
                const productCount = getCategoryProductCount(category.id);
                const categoryProducts = getCategoryProducts(category.id);
                const IconComponent = getCategoryIcon(category.name);
                
                return (
                  <div 
                    key={category.id}
                    className="category-item group cursor-pointer"
                    onClick={() => navigate(`/category/${category.id}`)}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                      <div className="aspect-video bg-muted/30 relative overflow-hidden">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${category.image ? 'hidden' : ''}`}>
                          <div className="p-6 rounded-full bg-primary/10">
                            <IconComponent className="h-10 w-10 text-primary" />
                          </div>
                        </div>
                        
                        <Badge className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm">
                          {productCount} items
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>

                        {categoryProducts.length > 0 && (
                          <div className="mb-4">
                            <div className="flex -space-x-2 mb-2">
                              {categoryProducts.slice(0, 3).map((product: Product) => (
                                <div 
                                  key={product.id}
                                  className="w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                                >
                                  <img
                                    src={product.images?.[0] || "/api/placeholder/32/32"}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {categoryProducts.length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                                  <span className="text-xs font-medium">+{categoryProducts.length - 3}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Featured: {categoryProducts.slice(0, 2).map((p: Product) => p.name).join(", ")}
                              {categoryProducts.length > 2 && "..."}
                            </p>
                          </div>
                        )}

                        <Button className="w-full" variant="outline">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Browse {category.name}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Use our advanced search and filtering options to find the perfect product for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/products")}
            >
              <Package className="h-4 w-4 mr-2" />
              Browse All Products
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/deals")}
            >
              <Star className="h-4 w-4 mr-2" />
              View Deals
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}