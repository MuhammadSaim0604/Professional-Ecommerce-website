import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Users as UsersIcon,
  Trash,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
}

interface UsersTableProps {
  onEditUser?: (user: User) => void;
  onDeleteUser?: (userId: number) => void;
  onAddUser?: () => void;
  users?: User[];
  total?: number;
  loading?: boolean;
}

export function UsersTableEnhanced({
  onEditUser,
  onDeleteUser,
  onAddUser,
  users = [],
  total = 0,
  loading = false,
}: UsersTableProps) {
  const { toast } = useToast();
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localRoleFilter, setLocalRoleFilter] = useState("all");
  const [localStatusFilter, setLocalStatusFilter] = useState("all");
  const [localSortBy, setLocalSortBy] = useState("createdAt");
  const [localSortOrder, setLocalSortOrder] = useState<"asc" | "desc">("desc");
  const [debouncedLocalSearch, setDebouncedLocalSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocalSearch(localSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Build query parameters
  const buildQueryParams = useCallback(
    (pageParam = 0) => {
      const params = new URLSearchParams();
      if (debouncedLocalSearch) params.set("search", debouncedLocalSearch);
      if (localRoleFilter !== "all") params.set("role", localRoleFilter);
      if (localStatusFilter !== "all") params.set("status", localStatusFilter);
      params.set("limit", "20");
      params.set("offset", pageParam.toString());
      params.set("sortBy", localSortBy);
      params.set("sortOrder", localSortOrder);
      return params.toString();
    },
    [debouncedLocalSearch, localRoleFilter, localStatusFilter, localSortBy, localSortOrder],
  );

  // Use the passed users data instead of making separate queries

  // Delete user mutation with isolated state management
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      setIsProcessing(true);
      try {
        await apiRequest(`/api/users/${userId}`, {
          method: "DELETE",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    onMutate: async (userId) => {
      setIsProcessing(true);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });

      // Snapshot the previous values
      const previousUsers = queryClient.getQueryData(["users"]);
      const previousApiUsers = queryClient.getQueryData(["/api/users"]);
      const previousAdminUsers = queryClient.getQueryData(["/api/admin/users"]);

      // Optimistically remove user from all caches with better error handling
      const removeUserFromArray = (userArray: any) => {
        if (!userArray) return [];
        
        if (Array.isArray(userArray)) {
          return userArray.filter(user => user?.id !== userId);
        } else if (userArray && typeof userArray === 'object') {
          if (Array.isArray(userArray.users)) {
            return { 
              ...userArray, 
              users: userArray.users.filter(user => user?.id !== userId),
              total: Math.max(0, (userArray.total || 0) - 1)
            };
          } else if (Array.isArray(userArray.data)) {
            return { 
              ...userArray, 
              data: userArray.data.filter(user => user?.id !== userId)
            };
          }
        }
        
        return [];
      };

      queryClient.setQueryData(["users"], removeUserFromArray(previousUsers));
      queryClient.setQueryData(["/api/users"], removeUserFromArray(previousApiUsers));
      queryClient.setQueryData(["/api/admin/users"], removeUserFromArray(previousAdminUsers));

      return { previousUsers, previousApiUsers, previousAdminUsers };
    },
    onSuccess: () => {
      setIsProcessing(false);
      setSelectedUsers(prev => prev.filter(id => id !== deleteUserMutation.variables));
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      // Force refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any, variables, context) => {
      setIsProcessing(false);
      
      // Rollback all caches on error
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      if (context?.previousApiUsers) {
        queryClient.setQueryData(["/api/users"], context.previousApiUsers);
      }
      if (context?.previousAdminUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousAdminUsers);
      }

      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation with improved state management
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: number;
      isActive: boolean;
    }) => {
      setIsProcessing(true);
      try {
        const response = await apiRequest(`/api/users/${userId}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        });
        return response;
      } finally {
        setIsProcessing(false);
      }
    },
    onMutate: async ({ userId, isActive }) => {
      setIsProcessing(true);
      
      // Cancel any outgoing refetches  
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData(["users"]);
      const previousApiUsers = queryClient.getQueryData(["/api/users"]);
      const previousAdminUsers = queryClient.getQueryData(["/api/admin/users"]);

      // Optimistically update all relevant query caches with better safety
      const updateUserInArray = (userArray: any) => {
        // Handle different data structures safely
        if (!userArray) {
          return [];
        }
        
        if (Array.isArray(userArray)) {
          return userArray.map(user => 
            user.id === userId ? { ...user, isActive } : user
          );
        } else if (userArray && typeof userArray === 'object') {
          if (Array.isArray(userArray.users)) {
            return { 
              ...userArray, 
              users: userArray.users.map(user => 
                user.id === userId ? { ...user, isActive } : user
              )
            };
          } else if (Array.isArray(userArray.data)) {
            return { 
              ...userArray, 
              data: userArray.data.map(user => 
                user.id === userId ? { ...user, isActive } : user
              )
            };
          }
        }
        
        // Fallback: return empty array if structure is unexpected
        return [];
      };

      // Update React Query cache immediately for instant UI feedback
      queryClient.setQueryData(["users"], updateUserInArray(previousUsers));
      queryClient.setQueryData(["/api/users"], updateUserInArray(previousApiUsers));
      queryClient.setQueryData(["/api/admin/users"], updateUserInArray(previousAdminUsers));

      return { previousUsers, previousApiUsers, previousAdminUsers };
    },
    onSuccess: (data, { userId, isActive }) => {
      toast({
        title: "Success",
        description: `User ${isActive ? "activated" : "deactivated"} successfully`,
      });

      // Force refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any, variables, context) => {
      // Rollback all caches on error
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      if (context?.previousApiUsers) {
        queryClient.setQueryData(["/api/users"], context.previousApiUsers);
      }
      if (context?.previousAdminUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousAdminUsers);
      }

      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      const promises = userIds.map((id) =>
        apiRequest(`/api/users/${id}`, { method: "DELETE" }),
      );
      await Promise.all(promises);
    },
    onMutate: async (userIds) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });

      // Snapshot the previous values
      const previousUsers = queryClient.getQueryData(["users"]);
      const previousApiUsers = queryClient.getQueryData(["/api/users"]);
      const previousAdminUsers = queryClient.getQueryData(["/api/admin/users"]);

      // Optimistically remove users from all caches
      const removeUsersFromArray = (userArray: any) => {
        // Handle different data structures safely
        if (!userArray) {
          return [];
        }
        
        if (Array.isArray(userArray)) {
          return userArray.filter(user => !userIds.includes(user.id));
        } else if (userArray && typeof userArray === 'object') {
          if (Array.isArray(userArray.users)) {
            return { 
              ...userArray, 
              users: userArray.users.filter(user => !userIds.includes(user.id))
            };
          } else if (Array.isArray(userArray.data)) {
            return { 
              ...userArray, 
              data: userArray.data.filter(user => !userIds.includes(user.id))
            };
          }
        }
        
        // Fallback: return empty array if structure is unexpected
        return [];
      };

      queryClient.setQueryData(["users"], removeUsersFromArray(previousUsers));
      queryClient.setQueryData(["/api/users"], removeUsersFromArray(previousApiUsers));
      queryClient.setQueryData(["/api/admin/users"], removeUsersFromArray(previousAdminUsers));

      return { previousUsers, previousApiUsers, previousAdminUsers };
    },
    onSuccess: () => {
      const count = selectedUsers.length;
      toast({ 
        title: "Success",
        description: `${count} user${count > 1 ? 's' : ''} deleted successfully` 
      });
      setSelectedUsers([]);

      // Force refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error, variables, context) => {
      // Rollback all caches on error
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      if (context?.previousApiUsers) {
        queryClient.setQueryData(["/api/users"], context.previousApiUsers);
      }
      if (context?.previousAdminUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousAdminUsers);
      }

      toast({
        title: "Error deleting users",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk status update mutation
  const bulkStatusUpdateMutation = useMutation({
    mutationFn: async ({
      userIds,
      isActive,
    }: {
      userIds: number[];
      isActive: boolean;
    }) => {
      const promises = userIds.map((id) =>
        apiRequest(`/api/users/${id}`, {
          method: "PUT",
          body: JSON.stringify({ isActive }),
        }),
      );
      await Promise.all(promises);
    },
    onMutate: async ({ userIds, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });

      // Snapshot the previous values
      const previousUsers = queryClient.getQueryData(["users"]);
      const previousApiUsers = queryClient.getQueryData(["/api/users"]);
      const previousAdminUsers = queryClient.getQueryData(["/api/admin/users"]);

      // Optimistically update users in all caches
      const updateUsersInArray = (userArray: any) => {
        // Handle different data structures safely
        if (!userArray) {
          return [];
        }
        
        if (Array.isArray(userArray)) {
          return userArray.map(user => 
            userIds.includes(user.id) ? { ...user, isActive } : user
          );
        } else if (userArray && typeof userArray === 'object') {
          if (Array.isArray(userArray.users)) {
            return { 
              ...userArray, 
              users: userArray.users.map(user => 
                userIds.includes(user.id) ? { ...user, isActive } : user
              )
            };
          } else if (Array.isArray(userArray.data)) {
            return { 
              ...userArray, 
              data: userArray.data.map(user => 
                userIds.includes(user.id) ? { ...user, isActive } : user
              )
            };
          }
        }
        
        // Fallback: return empty array if structure is unexpected
        return [];
      };

      queryClient.setQueryData(["users"], updateUsersInArray(previousUsers));
      queryClient.setQueryData(["/api/users"], updateUsersInArray(previousApiUsers));
      queryClient.setQueryData(["/api/admin/users"], updateUsersInArray(previousAdminUsers));

      return { previousUsers, previousApiUsers, previousAdminUsers };
    },
    onSuccess: (_, { isActive }) => {
      const count = selectedUsers.length;
      toast({
        title: "Success",
        description: `${count} user${count > 1 ? 's' : ''} ${isActive ? "activated" : "deactivated"} successfully`,
      });
      setSelectedUsers([]);

      // Force refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error, variables, context) => {
      // Rollback all caches on error
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      if (context?.previousApiUsers) {
        queryClient.setQueryData(["/api/users"], context.previousApiUsers);
      }
      if (context?.previousAdminUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousAdminUsers);
      }

      toast({
        title: "Error updating user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use the passed users data
  const displayUsers = users;
  const totalUsers = total;

  // Load more functionality removed since we're using pre-loaded data

  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      if (onDeleteUser) {
        onDeleteUser(userId);
      } else {
        deleteUserMutation.mutate(userId);
      }
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  // Reset filters
  const handleResetFilters = () => {
    setLocalSearchTerm("");
    setLocalRoleFilter("all");
    setLocalStatusFilter("all");
    setLocalSortBy("createdAt");
    setLocalSortOrder("desc");
  };

  // Handle row click to show checkboxes and toggle selection
  const handleRowClick = (userId: number) => {
    setShowCheckboxes(true);
    handleSelectUser(userId, !selectedUsers.includes(userId));
  };

  // Hide checkboxes when no items are selected
  React.useEffect(() => {
    if (selectedUsers.length === 0 && showCheckboxes) {
      setShowCheckboxes(false);
    }
  }, [selectedUsers.length, showCheckboxes]);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(displayUsers.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedUsers.length} users?`,
      )
    ) {
      bulkDeleteMutation.mutate(selectedUsers);
    }
  };

  const handleBulkActivate = () => {
    if (selectedUsers.length === 0) return;
    bulkStatusUpdateMutation.mutate({ userIds: selectedUsers, isActive: true });
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length === 0) return;
    bulkStatusUpdateMutation.mutate({
      userIds: selectedUsers,
      isActive: false,
    });
  };

  // Filter users based on search and filters  
  const filteredUsers = displayUsers.filter((user) => {
    const matchesSearch =
      !debouncedLocalSearch ||
      user.username.toLowerCase().includes(debouncedLocalSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedLocalSearch.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(debouncedLocalSearch.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(debouncedLocalSearch.toLowerCase());

    const matchesRole = localRoleFilter === "all" || user.role === localRoleFilter;
    const matchesStatus =
      localStatusFilter === "all" ||
      (localStatusFilter === "active" ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Users Management ({totalUsers} total)
            </CardTitle>
            <CardDescription>
              Manage user accounts and permissions with advanced filtering and
              bulk operations
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {onAddUser && (
              <Button onClick={onAddUser} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
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
                  placeholder="Search users by name, email, or username..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10"
                  data-user-search="true"
                />
              </div>
            </div>
            <Button
              onClick={handleResetFilters}
              variant="outline"
              size="sm"
              className="sm:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={localRoleFilter} onValueChange={setLocalRoleFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={localStatusFilter} onValueChange={setLocalStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${localSortBy}-${localSortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-");
                setLocalSortBy(field);
                setLocalSortOrder(order as "asc" | "desc");
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
                <SelectItem value="email-desc">Email Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleResetFilters}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedUsers.length} user
                  {selectedUsers.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBulkActivate}
                  variant="outline"
                  size="sm"
                  disabled={bulkStatusUpdateMutation.isPending}
                >
                  {bulkStatusUpdateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Activate
                </Button>
                <Button
                  onClick={handleBulkDeactivate}
                  variant="outline"
                  size="sm"
                  disabled={bulkStatusUpdateMutation.isPending}
                >
                  {bulkStatusUpdateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-2" />
                  )}
                  Deactivate
                </Button>
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
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading users...
          </div>
        )}

        {/* Users Table */}
        {!loading && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className={
                        showCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"
                      }
                    >
                      {showCheckboxes && (
                        <Checkbox
                          checked={
                            selectedUsers.length === displayUsers.length &&
                            displayUsers.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all users"
                        />
                      )}
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        {debouncedSearch ||
                        roleFilter !== "all" ||
                        statusFilter !== "all"
                          ? "No users found matching your filters"
                          : "No users available"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-muted/50 hover:shadow-md cursor-pointer transition-all duration-200"
                        onClick={() => handleRowClick(user.id)}
                      >
                        <TableCell
                          className={
                            showCheckboxes ? "w-12" : "w-0 p-0 overflow-hidden"
                          }
                        >
                          {showCheckboxes && (
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) =>
                                handleSelectUser(user.id, checked as boolean)
                              }
                              aria-label={`Select user ${user.firstName} ${user.lastName}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "destructive"}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUserStatus(user.id, user.isActive);
                            }}
                          >
                            {updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.userId === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditUser?.(user);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.id);
                              }}
                              disabled={deleteUserMutation.isPending}
                            >
                              {deleteUserMutation.isPending ? (
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
                  className="flex items-center gap-2"
                >
                  {false ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Load More Users
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Footer Info */}
            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <span>
                Showing {displayUsers.length} of {totalUsers} users
              </span>
              {displayUsers.length > 0 && <span>All users loaded</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}