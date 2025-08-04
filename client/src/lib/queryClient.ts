import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
  }
): Promise<Response> {
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : {},
    body: options?.body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    return await res.json();
  };

// Helper function to make API requests that return JSON
export async function apiRequestJson(
  url: string,
  options?: {
    method?: string;
    body?: string;
  }
): Promise<any> {
  const res = await apiRequest(url, options);
  return await res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for admin sections
      refetchOnWindowFocus: true, // Refresh when window gains focus
      refetchOnMount: true, // Refresh on component mount
      refetchOnReconnect: true, // Refresh on network reconnection
      staleTime: 10 * 1000, // Data becomes stale after 10 seconds
      gcTime: 5 * 60 * 1000, // Keep cache for 5 minutes
      retry: 2, // Retry twice for better reliability
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      networkMode: 'online',
    },
    mutations: {
      retry: 1, // Retry mutations once
      gcTime: 2 * 60 * 1000, // 2 minutes
    },
  },
});
