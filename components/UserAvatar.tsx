import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User, Settings, LogOut, Crown, Loader2, Moon, Sun, Monitor } from 'lucide-react';
import { profileService } from '../services/profileService';
import { subscriptionService } from '../services/subscriptionService';
import { supabase } from '../services/dbService';
import { useTheme } from '../contexts/ThemeContext';

interface UserAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  className = '', 
  size = 'md', 
  showDropdown = true,
  onProfileClick,
  onSettingsClick
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('User');
  const [email, setEmail] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [profile, subscription] = await Promise.all([
          profileService.getProfile(),
          subscriptionService.getSubscriptionStatus()
        ]);
        
        if (profile) {
          setAvatarUrl(profile.avatar_url || '');
          setDisplayName(profile.name);
          setEmail(profile.email);
        } else {
          // Fallback to auth user data if profile doesn't exist yet
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setDisplayName(user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
            setEmail(user.email || '');
          }
        }
        
        setSubscriptionStatus(subscription);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const avatarElement = (
    <Avatar className={`${sizeClasses[size]} ${showDropdown ? 'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all' : ''} ${className}`}>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      ) : (
        <>
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="font-medium">
            {getInitials(displayName)}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );

  if (!showDropdown) {
    return avatarElement;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {avatarElement}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{email}</p>
              </div>
            </div>
            {subscriptionStatus && (
              <div className="flex items-center justify-between">
                <Badge variant={subscriptionStatus.planType === 'Free' ? 'outline' : 'default'} className="text-xs">
                  {subscriptionStatus.planType === 'Enterprise' && <Crown className="h-3 w-3 mr-1" />}
                  {subscriptionStatus.planType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {subscriptionStatus.meetingsUsed}/{subscriptionStatus.meetingsLimit === -1 ? '∞' : subscriptionStatus.meetingsLimit} meetings
                </span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Theme Toggle Options */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
          Theme
        </DropdownMenuLabel>
        
        <DropdownMenuItem 
          onClick={() => setTheme('light')} 
          className={`cursor-pointer ${theme === 'light' ? 'bg-accent' : ''}`}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('dark')} 
          className={`cursor-pointer ${theme === 'dark' ? 'bg-accent' : ''}`}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('system')} 
          className={`cursor-pointer ${theme === 'system' ? 'bg-accent' : ''}`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;
