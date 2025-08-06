import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AllMeetingsPage from './components/AllMeetingsPage';
import PricingPage from './components/PricingPage';
import SuccessPage from './components/SuccessPage';
import ProfilePage from './components/ProfilePage';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { authService } from './services/AuthService';
import SignUpModal from './components/SignUpModal';
import OnboardingPage from './components/OnboardingPage';
import { profileService } from './services/profileService';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [view, setView] = useState<'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'profile' | 'settings' | 'onboarding'>('dashboard');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
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
                    if (profile && !profile.onboarding_completed) {
                        setView('onboarding');
                    }
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

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        setView('dashboard');
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('session_id') || urlParams.get('checkout_id')) {
            setView('success');
        }
    }, []);

    const handleSelectMeetingFromAll = (id: string) => {
        setSelectedMeetingId(id);
        setView('dashboard');
    };

    useEffect(() => {
        const handler = () => setView('pricing');
        window.addEventListener('navigate-pricing' as any, handler);
        return () => window.removeEventListener('navigate-pricing' as any, handler);
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <ThemeProvider>
            <ToastProvider>
                {view === 'onboarding' ? (
                    <OnboardingPage onComplete={() => setView('dashboard')} />
                ) : (
                    <div className="min-h-screen bg-background font-sans text-foreground">
                        <Header currentView={view} onNavigate={handleNavigate} session={session} savingStatus={savingStatus} onSignUpClick={() => setIsSignUpModalOpen(true)} />
                        {view === 'dashboard' && <Dashboard onShowAll={() => handleNavigate('allMeetings')} selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} session={session} />}
                        {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
                        {view === 'pricing' && <PricingPage />}
                        {view === 'success' && <SuccessPage onNavigate={handleNavigate} />}
                        {view === 'profile' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                        {view === 'settings' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                        <SignUpModal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} />
                    </div>
                )}
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;