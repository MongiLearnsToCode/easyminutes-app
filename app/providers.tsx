'use client';

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error('NEXT_PUBLIC_CONVEX_URL is not set');
}

const convex = new ConvexReactClient(convexUrl || '');

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={() => ({ isLoading: false, isAuthenticated: true, fetchAccessToken: async () => null })}>
      {children}
    </ConvexProviderWithAuth>
  );
}