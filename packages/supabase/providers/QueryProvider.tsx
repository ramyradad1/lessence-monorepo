import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const queryCache = new QueryCache({
      onSuccess: (data, query) => {
        // Track successful fetches and refetches
        console.log(`[REACT_QUERY] Fetched/Updated:`, query.queryKey);
      },
      onError: (error, query) => {
        console.error(`[REACT_QUERY] Error:`, query.queryKey, error);
      }
    });

    // Subscribe to all query events to track exactly WHY things are fetching
    queryCache.subscribe((event) => {
      // event.type can be 'added', 'removed', 'updated', 'observerAdded', 'observerRemoved', 'observerResultsUpdated', 'observerOptionsUpdated'
      if (event?.query?.state?.fetchStatus === 'fetching' && event?.type === 'updated') {
         console.log(`[REACT_QUERY] Triggered fetch for key:`, event.query.queryKey, '| Status:', event.query.state.status);
      }
    });

    return new QueryClient({
      queryCache,
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 2, // 2 minutes
          gcTime: 1000 * 60 * 30, // 30 minutes
          retry: 3,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          refetchOnWindowFocus: true,
          refetchOnMount: true,
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
