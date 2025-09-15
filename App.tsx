import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AllMeetingsPage from './components/AllMeetingsPage';
import PricingPage from './components/PricingPage';
// import SuccessPage from './components/SuccessPage';
import ProfilePage from './components/ProfilePage';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from './contexts/ThemeContext';
import SignUpModal from './components/SignUpModal';
import { useQuery } from 'convex/react';
import { api } from './convex/_generated/api';

const App: React.FC = () => {
    const session = useQuery(api.users.getCurrentUser);
    const [view, setView] = useState<'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'profile' | 'settings'>('dashboard');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    // const [showOnboarding, setShowOnboarding] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [currentSummary, setCurrentSummary] = useState<any | null>(null);
    const [savingStatus, setSavingStatus] = useState<{
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: any;
    } | undefined>(undefined);

    useEffect(() => {
        if (session !== undefined) {
            setLoading(false);
        }
    }, [session]);

    const handleNavigate = (targetView: 'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'profile' | 'settings') => {
        setSelectedMeetingId(null);
        setView(targetView);
    };

    // const handleOnboardingComplete = () => {
    //     setShowOnboarding(false);
    //     setView('dashboard');
    // };

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
                        {view === 'dashboard' && <Dashboard onShowAll={() => handleNavigate('allMeetings')} selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} currentSummary={currentSummary} setCurrentSummary={setCurrentSummary} onNavigate={handleNavigate} />}
                        {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
                        {view === 'pricing' && <PricingPage />}
                        {/* {view === 'success' && <SuccessPage onNavigate={handleNavigate} />} */}
                        {view === 'profile' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                        {view === 'settings' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                        <SignUpModal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} />
                    </div>
                </ToastProvider>
        </ThemeProvider>
    );
}

export default App;