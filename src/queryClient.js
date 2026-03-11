import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,   // données fraîches pendant 2 min
      gcTime: 10 * 60 * 1000,     // cache conservé 10 min après inutilisation
      retry: 1,
      refetchOnWindowFocus: false, // pas de refetch au focus (backend lent)
    },
  },
});
