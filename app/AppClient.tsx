'use client';

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import AllMeetingsPage from '../components/AllMeetingsPage';
import PricingPage from '../components/PricingPage';
import ProfilePage from '../components/ProfilePage';
import { ToastProvider } from '../components/ui/toast';
import { ThemeProvider } from '../contexts/ThemeContext';
import { authService } from '../services/AuthService';
import SignUpModal from '../components/SignUpModal';
import { profileService } from '../services/profileService';

export default function AppClient({ session: initialSession }: { session: Session | null }) {
    const [session, setSession] = useState<Session | null>(initialSession);
    const [view, setView] = useState<'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'profile' | 'settings'>('dashboard');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [currentSummary, setCurrentSummary] = useState<any | null>(null);
    const [savingStatus, setSavingStatus] = useState<{
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: any;
    } | undefined>(undefined);

    useEffect(() => {
        const subscription = authService.onAuthStateChange((session) => {
            setSession(session);
            if (session) {
                profileService.getProfile().then(profile => {
                    setLoading(false);
                }).catch(error => {
                    console.error("Error fetching profile: ", error);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleNavigate = (targetView: 'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'profile' | 'settings') => {
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

    if (loading) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="min-h-screen bg-background font-sans text-foreground">
                    <Header currentView={view} onNavigate={handleNavigate} session={session} savingStatus={savingStatus} onSignUpClick={() => setIsSignUpModalOpen(true)} />
                    {view === 'dashboard' && <Dashboard onShowAll={() => handleNavigate('allMeetings')} selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} session={session} currentSummary={currentSummary} setCurrentSummary={setCurrentSummary} onNavigate={handleNavigate} />}
                    {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
                    {view === 'pricing' && <PricingPage />}
                    {view === 'profile' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                    {view === 'settings' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                    <SignUpModal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} />
                </div>
            </ToastProvider>
        </ThemeProvider>
    );
}

    const handleSelectMeetingFromAll = (id: string) => {
        setSelectedMeetingId(id);
        setView('dashboard');
    };
