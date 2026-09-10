'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let clientQueryClient: QueryClient | undefined = undefined;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    if (typeof window === 'undefined') {
      return clientQueryClient ??= makeQueryClient();
    }
    return makeQueryClient();
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </QueryClientProvider>
  );
}
