import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse JSON error message first
    let errorMessage;
    try {
      const errorData = await res.json();
      // Extract a user-friendly message if possible
      errorMessage = errorData.message || errorData.error || 'An error occurred';
    } catch (e) {
      // If JSON parsing fails, use text or status text
      errorMessage = await res.text() || res.statusText || 'An error occurred';
    }
    
    // Throw a clean error without the technical details
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  urlOrMethod: string,
  methodOrUrl: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle both usage patterns: apiRequest(url, 'GET') and apiRequest('GET', url)
  let method: string;
  let url: string;
  
  // Check if the first parameter is a HTTP method
  if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(urlOrMethod.toUpperCase())) {
    method = urlOrMethod.toUpperCase();
    url = methodOrUrl;
  } else {
    // For backward compatibility with existing code using apiRequest(url, 'GET')
    method = methodOrUrl.toUpperCase();
    url = urlOrMethod;
  }

  // Prepare headers with cache control
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  // Add Content-Type for requests with body
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
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
      method: 'GET', // Explicitly adding the GET method
      credentials: "include",
      // Add cache-busting headers to prevent browser caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0, // Consider data stale immediately
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
