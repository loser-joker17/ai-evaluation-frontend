import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // treat data as fresh for 30 s: fewer repeat requests
      retry: 1,                    // one retry on network errors, not three
      refetchOnWindowFocus: false, // polling (F3) decides when to refresh, not tab switches
    },
  },
});