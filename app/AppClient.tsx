'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import AllMeetingsPage from '../components/AllMeetingsPage';
import PricingPage from '../components/PricingPage';
import ProfilePage from '../components/ProfilePage';
import { ToastProvider } from '../components/ui/toast';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function AppClient() {
    const { data: session, status } = useSession();
    const [view, setView] = useState<'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings'>('dashboard');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [currentSummary, setCurrentSummary] = useState<any | null>(null);
    const [savingStatus, setSavingStatus] = useState<{
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: any;
    } | undefined>(undefined);

    const handleNavigate = (targetView: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings') => {
        setSelectedMeetingId(null);
        setView(targetView);
    };

    useEffect(() => {
        const handler = () => setView('pricing');
        window.addEventListener('navigate-pricing' as any, handler);
        return () => window.removeEventListener('navigate-pricing' as any, handler);
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (currentSummary && !session) {
                event.preventDefault();
                event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentSummary, session]);

    const handleSelectMeetingFromAll = (id: string) => {
        setSelectedMeetingId(id);
        setView('dashboard');
    };

    if (status === 'loading') {
        return <div className="min-h-screen bg-background" />;
    }

    if (status === 'unauthenticated') {
        return (
            <ThemeProvider>
                <div className="min-h-screen bg-background font-sans text-foreground">
                    <Header currentView={view} onNavigate={handleNavigate} session={null} savingStatus={savingStatus} onSignUpClick={() => signIn('google')} />
                    <div className="flex flex-col items-center justify-center h-screen">
                        <h1 className="text-4xl font-bold mb-4">Welcome to Easy Minutes</h1>
                        <p className="text-lg mb-8">Please sign in to continue</p>
                        <button onClick={() => signIn('google')} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg">
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="min-h-screen bg-background font-sans text-foreground">
                    <Header currentView={view} onNavigate={handleNavigate} session={session} savingStatus={savingStatus} onSignUpClick={() => {}} />
                    {view === 'dashboard' && <Dashboard onShowAll={() => handleNavigate('allMeetings')} selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} session={session} currentSummary={currentSummary} setCurrentSummary={setCurrentSummary} onNavigate={handleNavigate} />}
                    {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
                    {view === 'pricing' && <PricingPage />}
                    {view === 'profile' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                    {view === 'settings' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                </div>
            </ToastProvider>
        </ThemeProvider>
    );
}