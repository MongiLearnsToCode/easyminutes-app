import React from 'react';
import { LogoIcon } from '../constants';

interface HeaderProps {
    currentView: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings' | 'success';
    onNavigate: (view: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings') => void;
    savingStatus?: {
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: any;
    };
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, savingStatus }) => {
    return (
        <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-20 border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <LogoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Easy Minutes</h1>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                        {/* Placeholder for navigation or user actions */}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;