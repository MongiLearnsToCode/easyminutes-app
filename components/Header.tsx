import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import UserAvatar from './UserAvatar';
import { LogoIcon, SpinnerIcon, CheckCircleIcon } from '../constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { authClient } from '@/lib/auth-client';
import { MeetingSummary } from '../types';

interface HeaderProps {
    currentView: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings' | 'success';
    onNavigate: (view: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings') => void;
    savingStatus?: {
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: MeetingSummary;
    };
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, savingStatus }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    useTheme();
    const { data: session } = authClient.useSession();
    const isAuthenticated = !!session;

    const handleNavigation = (view: 'dashboard' | 'allMeetings' | 'pricing') => {
        onNavigate(view);
        setIsMenuOpen(false);
    };

    const SavingStatus = () => {
        if (!savingStatus?.currentSummary) return null;

        if (savingStatus.isAutoSaving) {
            return <div className="flex items-center text-xs sm:text-sm text-muted-foreground"><SpinnerIcon className="text-primary w-4 h-4 sm:w-5 sm:h-5"/> <span className="ml-1 sm:ml-2">Saving...</span></div>
        }

        if (!savingStatus.hasUnsavedChanges) {
            return <div className="flex items-center text-xs sm:text-sm text-green-600"><CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5"/> <span className="ml-1">Saved</span></div>
        }

        return null;
    };

    return (
        <>
            <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-20 border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <LogoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Easy Minutes</h1>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                        <div className="hidden sm:block">
                            <SavingStatus />
                        </div>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-2">
                            <Button
                                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('dashboard')}
                                className="text-sm px-3 py-2"
                            >
                                Dashboard
                            </Button>
                            <Button
                                variant={currentView === 'allMeetings' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('allMeetings')}
                                className="text-sm px-3 py-2"
                            >
                                All Meetings
                            </Button>
                            <Button
                                variant={currentView === 'pricing' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('pricing')}
                                className="text-sm px-3 py-2"
                            >
                                Pricing
                            </Button>
                        </nav>
                        
                        {/* User Avatar */}
                        {isAuthenticated && (
                            <UserAvatar 
                                size="md"
                                onProfileClick={() => onNavigate('profile')}
                                onSettingsClick={() => onNavigate('settings')}
                            />
                        )}
                        {/* Mobile/Tablet Hamburger Menu */}
                        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="lg:hidden p-2"
                                    aria-label="Open menu"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-64 p-0">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between p-4 border-b border-border">
                                        <div className="flex items-center space-x-2">
                                            <LogoIcon className="h-6 w-6 text-primary" />
                                            <span className="font-bold text-foreground">Easy Minutes</span>
                                        </div>
                                    </div>
                                    
                                    <nav className="flex-1 p-4 space-y-2">
                                        <Button
                                            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                                            size="lg"
                                            onClick={() => handleNavigation('dashboard')}
                                            className="w-full justify-start text-left"
                                        >
                                            Dashboard
                                        </Button>
                                        <Button
                                            variant={currentView === 'allMeetings' ? 'default' : 'ghost'}
                                            size="lg"
                                            onClick={() => handleNavigation('allMeetings')}
                                            className="w-full justify-start text-left"
                                        >
                                            All Meetings
                                        </Button>
                                        <Button
                                            variant={currentView === 'pricing' ? 'default' : 'ghost'}
                                            size="lg"
                                            onClick={() => handleNavigation('pricing')}
                                            className="w-full justify-start text-left"
                                        >
                                            Pricing
                                        </Button>
                                    </nav>
                                    
                                    {isAuthenticated && (
                                        <div className="p-4 border-t border-border">
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={() => authClient.signOut()}
                                                className="w-full"
                                            >
                                                Logout
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
                {/* Mobile saving status */}
                <div className="sm:hidden pb-2">
                    <SavingStatus />
                </div>
            </div>
        </header>
        
        </>
    );
};

export default Header;