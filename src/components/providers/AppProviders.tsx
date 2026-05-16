"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import superjson from "superjson";

import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { ReactQueryDevtoolsPanel } from "@/components/providers/ReactQueryDevtoolsPanel";
import { trpcBrowserFetch } from "@/lib/trpc/browser-fetch";
import { trpc } from "@/lib/trpc/react";

interface AppProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function AppProviders({ children, session }: AppProvidersProps) {
  const providerSession = (session ?? undefined) as React.ComponentProps<
    typeof SessionProvider
  >["session"];

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch: trpcBrowserFetch
        })
      ]
    })
  );

  return (
    <SessionProvider session={providerSession} refetchOnWindowFocus={false} basePath="/api/auth">
      <LocaleProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtoolsPanel />
          </QueryClientProvider>
        </trpc.Provider>
      </LocaleProvider>
    </SessionProvider>
  );
}
