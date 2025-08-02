import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/dbService';
import { LogoIcon, SpinnerIcon, CheckCircleIcon } from '../constants';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    currentView: 'dashboard' | 'allMeetings' | 'pricing';
    onNavigate: (view: 'dashboard' | 'allMeetings' | 'pricing') => void;
    session: Session | null;
    savingStatus?: {
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: any;
    };
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, session, savingStatus }) => {
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
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
        <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-20 border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <LogoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Easy Minutes</h1>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                        <div className="hidden sm:block">
                            <SavingStatus />
                        </div>
                        <nav className="flex items-center space-x-1 sm:space-x-2">
                            <Button
                                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('dashboard')}
                                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                            >
                                <span className="hidden sm:inline">Dashboard</span>
                                <span className="sm:hidden">Home</span>
                            </Button>
                            <Button
                                variant={currentView === 'allMeetings' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('allMeetings')}
                                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                            >
                                <span className="hidden sm:inline">All Meetings</span>
                                <span className="sm:hidden">All</span>
                            </Button>
                            <Button
                                variant={currentView === 'pricing' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('pricing')}
                                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                            >
                                Pricing
                            </Button>
                        </nav>
                        {session && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                            >
                                <span className="hidden sm:inline">Logout</span>
                                <span className="sm:hidden">Out</span>
                            </Button>
                        )}
                    </div>
                </div>
                {/* Mobile saving status */}
                <div className="sm:hidden pb-2">
                    <SavingStatus />
                </div>
            </div>
        </header>
    );
};

export default Header;