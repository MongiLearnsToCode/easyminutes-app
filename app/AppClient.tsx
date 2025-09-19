
'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import AllMeetingsPage from '../components/AllMeetingsPage';
import PricingPage from '../components/PricingPage';
import ProfilePage from '../components/ProfilePage';
import { ToastProvider } from '../components/ui/toast';
import { ThemeProvider } from '../contexts/ThemeContext';
import { MeetingSummary } from '../types';

export default function AppClient() {
    const [view, setView] = useState<'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings'>('dashboard');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [currentSummary, setCurrentSummary] = useState<MeetingSummary | null>(null);
    const [savingStatus, setSavingStatus] = useState<{
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: MeetingSummary;
    } | undefined>(undefined);

    const handleNavigate = (targetView: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings') => {
        setSelectedMeetingId(null);
        setView(targetView);
    };

    useEffect(() => {
        const handler = () => setView('pricing');
        window.addEventListener('navigate-pricing', handler);
        return () => window.removeEventListener('navigate-pricing', handler);
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (currentSummary) {
                event.preventDefault();
                event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentSummary]);

    const handleSelectMeetingFromAll = (id: string) => {
        setSelectedMeetingId(id);
        setView('dashboard');
    };

    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="h-screen bg-background font-sans text-foreground flex flex-col">
                    <Header currentView={view} onNavigate={handleNavigate} savingStatus={savingStatus} />
                    <div className="flex-1 overflow-y-auto">
                        {view === 'dashboard' && <Dashboard selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} currentSummary={currentSummary} setCurrentSummary={setCurrentSummary} onNavigate={handleNavigate} />}
                        {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
                        {view === 'pricing' && <PricingPage />}
                        {view === 'profile' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                        {view === 'settings' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                    </div>
                </div>
            </ToastProvider>
        </ThemeProvider>
    );
}
