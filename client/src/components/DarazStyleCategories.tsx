import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export function DarazStyleCategories() {
  const [, setLocation] = useLocation();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <section className="py-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-16 h-16 mx-auto mb-2 rounded" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="py-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Categories</h2>
            <Button variant="link" className="text-orange-500 hover:text-orange-600 text-sm font-medium p-0">
              Shop More →
            </Button>
          </div>
          <div className="text-center py-6">
            <p className="text-gray-500">No categories available</p>
          </div>
        </div>
      </section>
    );
  }

  // Category images mapping (since we don't have real category images)
  const categoryImages = [
    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=100&h=100&fit=crop&crop=center", // 3D Printers
    "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=100&h=100&fit=crop&crop=center", // Pasta/Noodle
    "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=100&h=100&fit=crop&crop=center", // Casserole Pots
    "https://images.unsplash.com/photo-1556701063-d4760b35ba82?w=100&h=100&fit=crop&crop=center", // Hoodie/Sweats
    "https://images.unsplash.com/photo-1516146266509-2fddf9170e1d?w=100&h=100&fit=crop&crop=center", // Dog & Cat Electric
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop&crop=center", // Pendants
    "https://images.unsplash.com/photo-1559040656-b27c41bba075?w=100&h=100&fit=crop&crop=center", // Dining Sets
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=100&h=100&fit=crop&crop=center", // Microphones
  ];

  // Default category names if not enough from API
  const defaultCategories: Category[] = [
    { id: 1, name: "3D Printers", slug: "3d-printers", image: categoryImages[0] },
    { id: 2, name: "Pasta, Noodle & ......", slug: "pasta-noodle", image: categoryImages[1] },
    { id: 3, name: "Casserole Pots", slug: "casserole-pots", image: categoryImages[2] },
    { id: 4, name: "Hoodie Sweats", slug: "hoodie-sweats", image: categoryImages[3] },
    { id: 5, name: "Dog & Cat Electric......", slug: "dog-cat-electric", image: categoryImages[4] },
    { id: 6, name: "Pendants", slug: "pendants", image: categoryImages[5] },
    { id: 7, name: "Dining Sets", slug: "dining-sets", image: categoryImages[6] },
    { id: 8, name: "Microphones", slug: "microphones", image: categoryImages[7] },
    { id: 9, name: "Books & Media", slug: "books-media", image: categoryImages[0] },
    { id: 10, name: "Health & Beauty", slug: "health-beauty", image: categoryImages[1] },
    { id: 11, name: "Tools & Hardware", slug: "tools-hardware", image: categoryImages[2] },
    { id: 12, name: "Garden & Outdoor", slug: "garden-outdoor", image: categoryImages[3] },
  ];

  // Use API categories or fallback to default ones - ensure we have enough for scrolling
  const displayCategories = categories && categories.length >= 12 ? categories.slice(0, 12) : defaultCategories;

  return (
    <section className="py-4 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Header - Exactly matching Daraz design */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Categories</h2>
          <Button 
            variant="link" 
            className="text-orange-500 hover:text-orange-600 text-sm font-medium p-0"
            onClick={() => setLocation('/categories')}
          >
            Shop More →
          </Button>
        </div>
        
        {/* Categories - Horizontal scroll with visible scrollbar */}
        <div className="overflow-x-auto pb-4 scrollbar-visible" style={{ minHeight: '120px' }}>
          <div className="flex gap-4 min-w-max">
            {displayCategories.map((category, index) => (
              <div 
                key={category.id} 
                className="text-center cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                onClick={() => setLocation(`/categories/${category.slug}`)}
              >
                {/* Category Image */}
                <div className="w-16 h-16 mx-auto mb-2 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                  <img
                    src={category.image || categoryImages[index % categoryImages.length] || "/api/placeholder/64/64"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Category Name */}
                <h3 className="text-xs text-gray-800 dark:text-gray-200 leading-tight line-clamp-2 w-16">
                  {category.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}