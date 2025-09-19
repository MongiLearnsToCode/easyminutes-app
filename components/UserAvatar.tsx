import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ size = 'md', onProfileClick, onSettingsClick }) => {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative rounded-full ${getSizeClasses()}`} aria-label="Open user menu">
          <Avatar className={getSizeClasses()}>
            <AvatarImage src={String(user?.image || '')} alt={String(user?.name || '')} />
            <AvatarFallback>{String(user?.name || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{String(user?.name || '')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {String(user?.email || '')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={onSettingsClick}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
         <DropdownMenuItem onClick={() => authClient.signOut()}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;