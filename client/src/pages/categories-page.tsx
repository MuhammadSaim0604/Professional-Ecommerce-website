import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  ShoppingBag, 
  Grid3X3,
  Package,
  TrendingUp,
  Star
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

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
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

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="h-12 bg-muted animate-pulse rounded mb-4" />
            <div className="h-6 bg-muted animate-pulse rounded w-2/3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-4" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
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
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <Grid3X3 className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Shop by Category
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our wide range of products organized by categories. 
            Find exactly what you're looking for with ease.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No Categories Found</h2>
              <p className="text-muted-foreground">
                Categories will appear here once they're added to the store.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category: Category) => {
                const productCount = getCategoryProductCount(category.id);
                const categoryProducts = getCategoryProducts(category.id);
                
                return (
                  <Card 
                    key={category.id} 
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/category/${category.id}`)}
                  >
                    {/* Category Image */}
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${category.image ? 'hidden' : ''}`}>
                        <ShoppingBag className="h-16 w-16 text-primary/60" />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      
                      {/* Product Count Badge */}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm"
                      >
                        {productCount} products
                      </Badge>
                    </div>

                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-muted-foreground mt-2 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {/* Sample Products */}
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
                          <p className="text-sm text-muted-foreground">
                            Featured: {categoryProducts.slice(0, 2).map(p => p.name).join(", ")}
                            {categoryProducts.length > 2 && "..."}
                          </p>
                        </div>
                      )}

                      <Button 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        variant="outline"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Browse {category.name}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Use our advanced search and filtering options to find the perfect product for your needs.
          </p>
          <div className="space-x-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/products")}
            >
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