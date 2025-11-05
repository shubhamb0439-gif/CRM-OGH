import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Optimized for admin panel with long-running sessions
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus after tab is inactive
      refetchOnWindowFocus: true,

      // Retry failed queries with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Network mode - handle offline gracefully
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      networkMode: 'online',
    },
  },
});
