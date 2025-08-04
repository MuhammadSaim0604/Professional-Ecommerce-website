import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  FolderIcon,
  Trash,
  Eye,
  EyeOff,
  ExternalLink,
  Plus
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

interface CategoriesTableProps {
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: number) => void;
  onAddCategory?: () => void;
  categories?: Category[];
  total?: number;
  loading?: boolean;
}

export function CategoriesTableEnhanced({ onEditCategory, onDeleteCategory, onAddCategory, categories = [], total = 0, loading = false }: CategoriesTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters
  const buildQueryParams = useCallback((pageParam = 0) => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "20");
    params.set("offset", pageParam.toString());
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    return params.toString();
  }, [debouncedSearch, statusFilter, sortBy, sortOrder]);

  // Use the passed categories data instead of making separate queries

  // Use the passed categories data
  const allCategories = categories;
  const totalCategories = total;

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await apiRequest(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Category deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['categories-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting category", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (categoryIds: number[]) => {
      const promises = categoryIds.map(id =>
        apiRequest(`/api/categories/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: `${selectedCategories.length} categories deleted successfully` });
      setSelectedCategories([]);
      queryClient.invalidateQueries({ queryKey: ['categories-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting categories", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Load more functionality removed since we're using pre-loaded data

  // Handle delete category
  const handleDeleteCategory = (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      if (onDeleteCategory) {
        onDeleteCategory(categoryId);
      } else {
        deleteCategoryMutation.mutate(categoryId);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedCategories.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedCategories.length} categories?`)) {
      bulkDeleteMutation.mutate(selectedCategories);
    }
  };

  // Handle row click to show checkboxes and toggle selection
  const handleRowClick = (categoryId: number) => {
    setShowCheckboxes(true);
    handleSelectCategory(categoryId, !selectedCategories.includes(categoryId));
  };

  // Hide checkboxes when no items are selected
  React.useEffect(() => {
    if (selectedCategories.length === 0 && showCheckboxes) {
      setShowCheckboxes(false);
    }
  }, [selectedCategories.length, showCheckboxes]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(categories.map(category => category.id));
    } else {
      setSelectedCategories([]);
    }
  };

  // Handle individual selection
  const handleSelectCategory = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  // Filter categories based on search and filters
  const filteredCategories = categories.filter(category => {
    const matchesSearch = !debouncedSearch || 
      category.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      category.slug.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      category.description?.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" ? category.isActive : !category.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5" />
              Categories Management ({totalCategories} total)
            </CardTitle>
            <CardDescription>
              Organize your products by categories with advanced filtering and bulk operations
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {onAddCategory && (
              <Button onClick={onAddCategory} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleResetFilters} variant="outline" size="sm" className="sm:hidden">
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="sortOrder-asc">Sort Order</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleResetFilters} variant="outline" size="sm" className="hidden sm:flex">
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCategories.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <span className="text-sm font-medium">
              {selectedCategories.length} category(ies) selected
            </span>
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              size="sm"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Delete Selected
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading categories...</span>
          </div>
        )}

        {/* Categories Table */}
        {!loading && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={showCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                      {showCheckboxes && (
                        <Checkbox
                          checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      )}
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {debouncedSearch || statusFilter !== "all" 
                          ? "No categories found matching your filters" 
                          : "No categories available"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow 
                        key={category.id}
                        className="hover:bg-muted/50 hover:shadow-md cursor-pointer transition-all duration-200"
                        onClick={() => handleRowClick(category.id)}
                      >
                        <TableCell className={showCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"}>
                          {showCheckboxes && (
                            <Checkbox
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={(checked) => handleSelectCategory(category.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">
                              /{category.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            {category.description || "No description"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? "default" : "destructive"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {category.sortOrder || "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(category.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCategory?.(category);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(category.id);
                              }}
                              disabled={deleteCategoryMutation.isPending}
                            >
                              {deleteCategoryMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Load More Button */}
            {false && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => {}}
                  disabled={false}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {false ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more categories...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Load More Categories
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Summary */}
            <div className="text-center text-sm text-muted-foreground mt-4">
              Showing {allCategories.length} of {totalCategories} categories
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}