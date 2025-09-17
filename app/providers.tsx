'use client';

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={() => ({ isLoading: false, isAuthenticated: true, fetchAccessToken: async () => null })}>
      {children}
    </ConvexProviderWithAuth>
  );
}