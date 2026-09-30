import { QueryClient } from "@tanstack/react-query";

/**
 * Cache de API (spec §11): catálogo com stale generoso, progresso/matrícula
 * sempre fresco.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

/** Chaves com staleTime 0: progresso e status de matrícula. */
export const FRESH_QUERY = { staleTime: 0 } as const;
