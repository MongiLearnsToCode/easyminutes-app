import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/dbService';
import { LogoIcon } from '../constants';

interface HeaderProps {
    currentView: 'dashboard' | 'allMeetings';
    onNavigate: (view: 'dashboard' | 'allMeetings') => void;
    session: Session | null;
}

const NavLink: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => {
    const activeClasses = "bg-brand-primary/10 text-brand-primary";
    const inactiveClasses = "text-brand-muted hover:bg-gray-100";
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
        >
            {children}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, session }) => {
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
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
                        <nav className="flex items-center space-x-2">
                            <NavLink
                                isActive={currentView === 'dashboard'}
                                onClick={() => onNavigate('dashboard')}
                            >
                                Dashboard
                            </NavLink>
                            <NavLink
                                isActive={currentView === 'allMeetings'}
                                onClick={() => onNavigate('allMeetings')}
                            >
                                All Meetings
                            </NavLink>
                        </nav>
                        {session && (
                             <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors duration-200 text-brand-muted bg-gray-100 hover:bg-gray-200"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;