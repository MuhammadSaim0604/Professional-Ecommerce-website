import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, X, Clock, TrendingUp, Grid3X3, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

interface SearchSuggestion {
  id: number;
  name: string;
  type: "product" | "category";
  image?: string;
  price?: string;
  category?: string;
  slug: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "mobile" | "desktop";
  initialQuery?: string;
}

export function SearchOverlay({
  isOpen,
  onClose,
  variant = "mobile",
  initialQuery = "",
}: SearchOverlayProps) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const popularSearches = [
    "iPhone",
    "MacBook",
    "Headphones",
    "Gaming",
    "Fashion",
    "Electronics",
    "Laptops",
    "Smartphones",
    "Watches",
    "Cameras",
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Focus input when opened and select all text if there's an initial query
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (initialQuery) {
          inputRef.current?.select();
        }
      }, 100);
    }
  }, [isOpen, initialQuery]);

  // Search suggestions query
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/search/suggestions", query],
    queryFn: () =>
      fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      }).then((res) => res.json()),
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    // Add to recent searches
    const newRecentSearches = [
      searchTerm,
      ...recentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches));

    // Navigate to products page with search
    navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "product") {
      navigate(`/products/${suggestion.slug}`);
    } else {
      navigate(`/products?category=${suggestion.slug}`);
    }
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  if (variant === "desktop") {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />
        )}
        <div
          className={`fixed top-0 left-0 right-0 z-[60] h-[80vh] bg-background dark:bg-background border-b border-border shadow-2xl transition-transform duration-300 ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Desktop Search Header */}
            <div className="p-6 border-b border-border bg-background dark:bg-background flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground dark:text-foreground">
                  Search Products
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Desktop Search Bar - 70-80% width */}
              <div className="flex justify-center">
                <form onSubmit={handleSubmit} className="relative w-[75%]">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for products, categories..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 pr-14 h-12 text-base rounded-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-black dark:focus:border-white focus:outline-none transition-all duration-200 bg-background dark:bg-background shadow-sm"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl p-0 bg-primary hover:bg-primary/90 shadow-md"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Desktop Search Content */}
            <div className="flex-1 overflow-hidden bg-background dark:bg-background">
              <div className="h-full flex">
                {/* Left Column - Popular/Recent Searches */}
                <div className="w-1/2 p-6 overflow-y-auto bg-background dark:bg-background">
                  {query.length >= 2 ? (
                    <>
                      {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-base font-medium">Searching...</p>
                        </div>
                      ) : suggestions.length > 0 ? (
                        <div>
                          <h4 className="font-semibold mb-4 text-base text-foreground dark:text-foreground">
                            Search Results
                          </h4>
                          <div className="space-y-3">
                            {suggestions.map((suggestion: SearchSuggestion) => (
                              <button
                                key={`${suggestion.type}-${suggestion.id}`}
                                onClick={() =>
                                  handleSuggestionClick(suggestion)
                                }
                                className="w-full p-3 hover:bg-muted/50 dark:hover:bg-muted/30 rounded-xl text-left flex items-center space-x-3 transition-colors border border-transparent hover:border-border shadow-sm hover:shadow-md"
                              >
                                <div className="flex-shrink-0">
                                  {suggestion.type === "category" ? (
                                    <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
                                      <Grid3X3 className="h-5 w-5 text-primary" />
                                    </div>
                                  ) : suggestion.image ? (
                                    <img
                                      src={suggestion.image}
                                      alt={suggestion.name}
                                      className="w-10 h-10 object-cover rounded-xl"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-muted dark:bg-muted/60 rounded-xl flex items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate text-foreground dark:text-foreground">
                                    {suggestion.name}
                                  </p>
                                  {suggestion.type === "product" &&
                                    suggestion.category && (
                                      <p className="text-xs text-muted-foreground truncate mt-1">
                                        in {suggestion.category}
                                      </p>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                  {suggestion.type === "category" ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Category
                                    </Badge>
                                  ) : suggestion.price ? (
                                    <span className="text-sm font-semibold text-primary">
                                      ${suggestion.price}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <div className="w-16 h-16 bg-muted/30 dark:bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 opacity-50" />
                          </div>
                          <p className="text-base font-semibold mb-2 text-foreground dark:text-foreground">
                            No results found
                          </p>
                          <p className="text-sm">
                            Try searching for "{query}" with different keywords
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 bg-muted/30 dark:bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 opacity-50" />
                      </div>
                      <p className="text-base">
                        Start typing to search for products and categories
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column - Popular/Recent Searches - Always Visible */}
                <div className="w-1/2 p-6 border-r border-border bg-muted/10 dark:bg-muted/10 overflow-y-auto">
                  {recentSearches.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-base flex items-center text-foreground dark:text-foreground">
                          <div className="w-6 h-6 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mr-2">
                            <Clock className="h-3 w-3 text-primary" />
                          </div>
                          Recent Searches
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearRecentSearches}
                          className="text-xs hover:bg-muted"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(search)}
                            className="inline-flex items-center px-3 py-1.5 bg-muted/50 dark:bg-muted/30 hover:bg-muted dark:hover:bg-muted/50 rounded-full text-xs font-medium transition-colors text-foreground dark:text-foreground border border-border hover:border-primary/50"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-base mb-4 flex items-center text-foreground dark:text-foreground">
                      <div className="w-6 h-6 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mr-2">
                        <TrendingUp className="h-3 w-3 text-primary" />
                      </div>
                      Popular Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(term)}
                          className="inline-flex items-center px-3 py-1.5 bg-muted/50 dark:bg-muted/30 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full text-xs font-medium transition-colors text-foreground dark:text-foreground border border-border hover:border-primary/50"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Mobile full-screen overlay - positioned over navbar
  return (
    <div
      className={`fixed inset-0 z-[60] bg-background dark:bg-background transition-transform duration-300 ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="h-screen w-screen flex flex-col">
        {/* Mobile Search Header */}
        <div className="p-4 border-b border-border bg-background dark:bg-background flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1.5 hover:bg-muted rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-foreground dark:text-foreground">
              Search
            </h1>
          </div>

          {/* Mobile Search Bar - Full width on mobile */}
          <div className="w-full">
            <form onSubmit={handleSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-12 h-11 text-sm rounded-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-black dark:focus:border-white focus:outline-none transition-all duration-200 bg-background dark:bg-background"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg p-0 bg-primary hover:bg-primary/90"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile Search Content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-background dark:bg-background overscroll-contain">
          {query.length >= 2 ? (
            // Search Results
            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-sm font-medium">Searching...</p>
                  <p className="text-xs mt-1">
                    Finding the best results for you
                  </p>
                </div>
              ) : suggestions.length > 0 ? (
                <div>
                  <h2 className="font-bold mb-3 text-base text-foreground dark:text-foreground">
                    Search Results
                  </h2>
                  <div className="space-y-2">
                    {suggestions.map((suggestion: SearchSuggestion) => (
                      <button
                        key={`${suggestion.type}-${suggestion.id}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full p-3 hover:bg-muted/50 dark:hover:bg-muted/30 rounded-lg text-left flex items-center space-x-3 transition-all duration-200 border border-transparent hover:border-border dark:hover:border-border active:bg-muted dark:active:bg-muted/40 shadow-sm hover:shadow-md"
                      >
                        <div className="flex-shrink-0">
                          {suggestion.type === "category" ? (
                            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center shadow-sm">
                              <Grid3X3 className="h-4 w-4 text-primary" />
                            </div>
                          ) : suggestion.image ? (
                            <img
                              src={suggestion.image}
                              alt={suggestion.name}
                              className="w-10 h-10 object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted dark:bg-muted/60 rounded-lg flex items-center justify-center shadow-sm">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-foreground dark:text-foreground leading-tight">
                            {suggestion.name}
                          </p>
                          {suggestion.type === "product" &&
                            suggestion.category && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                in {suggestion.category}
                              </p>
                            )}
                        </div>
                        <div className="flex-shrink-0">
                          {suggestion.type === "category" ? (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0.5"
                            >
                              Category
                            </Badge>
                          ) : suggestion.price ? (
                            <span className="text-sm font-semibold text-primary">
                              ${suggestion.price}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-12 h-12 bg-muted/50 dark:bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-base font-semibold mb-1 text-foreground dark:text-foreground">
                    No results found
                  </p>
                  <p className="text-xs">
                    Try searching for "{query}" with different keywords
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Popular and Recent Searches - Always visible on mobile
            <div className="p-4 space-y-3 pb-6">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-medium text-sm flex items-center text-foreground dark:text-foreground">
                      <div className="w-4 h-4 bg-primary/10 dark:bg-primary/20 rounded-md flex items-center justify-center mr-1.5">
                        <Clock className="h-2.5 w-2.5 text-primary" />
                      </div>
                      Recent Searches
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-xs hover:bg-muted px-1.5 py-0.5 h-5"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="inline-flex items-center px-2.5 py-1 bg-muted/50 dark:bg-muted/30 hover:bg-muted dark:hover:bg-muted/50 rounded-full text-xs font-medium transition-all duration-200 text-foreground dark:text-foreground border border-border hover:border-primary/50"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="font-medium text-sm mb-2 flex items-center text-foreground dark:text-foreground">
                  <div className="w-4 h-4 bg-primary/10 dark:bg-primary/20 rounded-md flex items-center justify-center mr-1.5">
                    <TrendingUp className="h-2.5 w-2.5 text-primary" />
                  </div>
                  Popular Searches
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="inline-flex items-center px-2.5 py-1 bg-muted/50 dark:bg-muted/30 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full text-xs font-medium transition-all duration-200 text-foreground dark:text-foreground border border-border hover:border-primary/50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
