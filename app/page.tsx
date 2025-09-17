'use client';

import { authClient } from '@/lib/auth-client';
import AppClient from './AppClient';
import { SignIn } from '../components/SignIn';
import { useEffect, useState } from 'react';

export default function Page() {
  const { data: session, isPending, error } = authClient.useSession();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (error) {
      console.error('Auth session error:', error);
      setHasError(true);
    }
  }, [error]);

  // Show loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an auth error
  if (hasError || error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">
            There was an issue loading the application. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return session ? <AppClient /> : <SignIn />;
}