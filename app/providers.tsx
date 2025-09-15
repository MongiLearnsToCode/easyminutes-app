'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { convex } from '../services/dbService';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
