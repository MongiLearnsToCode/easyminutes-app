import React from 'react';
import { useConvexAuth } from 'convex/react';
import { UserButton } from '@clerk/clerk-react';

interface UserAvatarProps {
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ className = '' }) => {
  const { isLoading } = useConvexAuth();

  if (isLoading) {
    return <div className={`h-8 w-8 bg-gray-200 rounded-full animate-pulse ${className}`} />;
  }

  return <UserButton afterSignOutUrl="/" />;
};

export default UserAvatar;