import React, { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './services/dbService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AllMeetingsPage from './components/AllMeetingsPage';
import PricingPage from './components/PricingPage';
import { LogoIcon } from './constants';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [view, setView] = useState<'dashboard' | 'allMeetings' | 'pricing'>('dashboard');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingStatus, setSavingStatus] = useState<{
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: any;
    } | undefined>(undefined);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleNavigate = (targetView: 'dashboard' | 'allMeetings' | 'pricing') => {
        setSelectedMeetingId(null);
        setView(targetView);
    };

    const handleSelectMeetingFromAll = (id: string) => {
        setSelectedMeetingId(id);
        setView('dashboard');
    };

    if (loading) {
        return <div className="min-h-screen bg-brand-bg" />;
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-brand-surface rounded-2xl shadow-xl p-8">
                    <div className="flex flex-col items-center mb-8">
                        <LogoIcon className="h-12 w-12 mb-4" />
                        <h1 className="text-2xl font-bold text-brand-secondary">Welcome to Easy Minutes</h1>
                        <p className="text-brand-muted mt-1 text-center">Your AI-powered meeting assistant.</p>
                    </div>
                    <Auth
                        supabaseClient={supabase}
                        appearance={{ 
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#F45D48',
                                        brandAccent: '#E14D39'
                                    }
                                }
                            }
                        }}
                        providers={['google', 'github']}
                        theme="light"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg font-sans text-brand-secondary">
            <Header currentView={view} onNavigate={handleNavigate} session={session} savingStatus={savingStatus} />
            {view === 'dashboard' && <Dashboard onShowAll={() => handleNavigate('allMeetings')} selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} />}
            {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
            {view === 'pricing' && <PricingPage />}
        </div>
    );
}

export default App;
