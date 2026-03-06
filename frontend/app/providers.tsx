"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
