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
            return <div className="flex items-center text-sm text-brand-muted"><SpinnerIcon className="text-brand-primary"/> <span className="ml-2">Saving...</span></div>
        }

        if (!savingStatus.hasUnsavedChanges) {
            return <div className="flex items-center text-sm text-green-600"><CheckCircleIcon className="w-5 h-5"/> <span className="ml-1">All changes saved</span></div>
        }

        return null;
    };

    return (
        <header className="bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                        <LogoIcon className="h-8 w-8" />
                        <h1 className="text-xl font-bold text-brand-secondary">Easy Minutes</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <SavingStatus />
                        <nav className="flex items-center space-x-2">
                            <Button
                                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('dashboard')}
                            >
                                Dashboard
                            </Button>
                            <Button
                                variant={currentView === 'allMeetings' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('allMeetings')}
                            >
                                All Meetings
                            </Button>
                            <Button
                                variant={currentView === 'pricing' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onNavigate('pricing')}
                            >
                                Pricing
                            </Button>
                        </nav>
                        {session && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;