import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AttendeeAvatarProps {
  name: string;
  className?: string;
}

function getInitials(name: string) {
  const names = name.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

export const AttendeeAvatar: React.FC<AttendeeAvatarProps> = ({ name, className }) => {
  return (
    <Avatar className={cn('w-8 h-8', className)}>
      <AvatarFallback className="bg-primary/20 text-primary font-bold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
