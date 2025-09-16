import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const MeetingCardSkeleton = () => {
  return (
    <div className="p-4 rounded-xl border border-border">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
};
