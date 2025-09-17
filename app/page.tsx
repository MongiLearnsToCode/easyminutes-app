'use client';

import { authClient } from '@/lib/auth-client';
import AppClient from './AppClient';
import { SignIn } from '../components/SignIn';

export default function Page() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="min-h-screen bg-background" />;
  }

  return session ? <AppClient /> : <SignIn />;
}