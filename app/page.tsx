'use client';

import { useConvexAuth } from 'convex/react';
import AppClient from './AppClient';
import { SignIn } from '../components/SignIn'; // This component will be created later

export default function Page() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return isAuthenticated ? <AppClient /> : <SignIn />;
}