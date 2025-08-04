import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, TrendingUp, Package, Grid3X3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface SearchSuggestionsProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  id: number;
  name: string;
  slug?: string;
  type: 'product' | 'category';
  price?: string;
  category?: string;
  image?: string;
}

export default function SearchSuggestions({ 
  onSearch, 
  placeholder = "Search products...", 
  className = "" 
}: SearchSuggestionsProps) {
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Update search input when on search page or when URL changes
  useEffect(() => {
    if (location.startsWith('/search')) {
      const urlParams = new URLSearchParams(location.split('?')[1] || '');
      const searchParam = urlParams.get('search');
      if (searchParam && searchParam !== query) {
        setQuery(decodeURIComponent(searchParam));
      }
    } else if (!location.startsWith('/search') && query) {
      // Clear search when navigating away from search page
      setQuery('');
    }
  }, [location]);

  // Search suggestions query with debouncing
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/search/suggestions", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Search suggestions error:', error);
        return [];
      }
    },
    enabled: query.length >= 2 && isOpen,
    staleTime: 300000, // 5 minutes
  });

  // Handle input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      // Query only triggers when conditions are met due to enabled flag
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Add to recent searches
    const newRecentSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches));
    
    setIsOpen(false);
    
    // Use the onSearch prop which handles smart navigation
    onSearch(searchQuery.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [suggestion.name, ...recentSearches.filter(s => s !== suggestion.name)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches));
    
    if (suggestion.type === 'product') {
      // Use the product slug for correct routing to /products/:slug
      setLocation(`/products/${suggestion.slug || suggestion.id}`);
    } else {
      setLocation(`/category/${suggestion.id}`);
    }
    setIsOpen(false);
    setQuery("");
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    handleSearch(searchTerm);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-12 pr-14 rounded-full border-2 border-muted hover:border-primary/50 focus:border-primary transition-colors duration-200"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {/* Recent Searches */}
            {query.length < 2 && recentSearches.length > 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Searches
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearRecentSearches}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="block w-full text-left p-2 hover:bg-muted rounded text-sm"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            {query.length >= 2 && (
              <>
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.type}-${suggestion.id}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full p-3 hover:bg-muted text-left flex items-center space-x-3"
                      >
                        <div className="flex-shrink-0">
                          {suggestion.type === 'category' ? (
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Grid3X3 className="h-4 w-4 text-primary" />
                            </div>
                          ) : suggestion.image ? (
                            <img 
                              src={suggestion.image} 
                              alt={suggestion.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{suggestion.name}</p>
                          {suggestion.type === 'product' && suggestion.category && (
                            <p className="text-xs text-muted-foreground truncate">
                              in {suggestion.category}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {suggestion.type === 'category' ? (
                            <Badge variant="secondary" className="text-xs">
                              Category
                            </Badge>
                          ) : suggestion.price ? (
                            <span className="text-sm font-medium">
                              ${suggestion.price}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found for "{query}"
                  </div>
                )}
              </>
            )}

            {/* Popular Searches */}
            {query.length < 2 && recentSearches.length === 0 && (
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Popular Searches
                </h4>
                <div className="space-y-2">
                  {["iPhone", "MacBook", "Headphones", "Gaming", "Fashion"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        handleSearch(term);
                      }}
                      className="block w-full text-left p-2 hover:bg-muted rounded text-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}