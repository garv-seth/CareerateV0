import { QueryClient } from "@tanstack/react-query";

// Default query function
const defaultQueryFn = async ({ queryKey }: { queryKey: any }) => {
  const res = await fetch(queryKey[0]); // The queryKey is an array, we want the first element
  if (res.status === 401) {
    return null; // Handle unauthorized case gracefully for useAuth hook
  }
  if (!res.ok) {
    throw new Error(`Network response was not ok for query: ${queryKey[0]}`);
  }
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set the default query function for all queries
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/404 errors
        if (error.message.includes('401') || error.message.includes('404')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
