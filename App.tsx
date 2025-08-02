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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
        return <div className="min-h-screen bg-background" />;
    }

if (!session) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 md:p-6">
                <Card className="w-full max-w-md mx-auto shadow-2xl border-0 sm:border">
                    <CardHeader className="text-center pb-4 px-4 sm:px-6">
                        <div className="flex justify-center mb-4">
                            <LogoIcon className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-tight">
                            Welcome to Easy Minutes
                        </CardTitle>
                        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                            Your AI-powered meeting assistant
                        </p>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 px-4 sm:px-6">
                        <Separator />
                        
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                Sign in to start transforming your meetings with AI-powered minutes
                            </p>
                        </div>
                        
                        <Auth
                            supabaseClient={supabase}
                            appearance={{ 
                                theme: ThemeSupa,
                                variables: {
                                    default: {
                                        colors: {
                                            brand: 'hsl(var(--primary))',
                                            brandAccent: 'hsl(var(--primary))',
                                        },
                                        space: {
                                            spaceSmall: '6px',
                                            spaceMedium: '12px',
                                            spaceLarge: '18px',
                                        },
                                        fontSizes: {
                                            baseBodySize: '14px',
                                            baseInputSize: '16px',
                                        },
                                        radii: {
                                            borderRadiusButton: '8px',
                                            buttonBorderRadius: '8px',
                                            inputBorderRadius: '8px',
                                        }
                                    }
                                }
                            }}
                            providers={['google', 'github']}
                            theme="light"
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <Header currentView={view} onNavigate={handleNavigate} session={session} savingStatus={savingStatus} />
            {view === 'dashboard' && <Dashboard onShowAll={() => handleNavigate('allMeetings')} selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} />}
            {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
            {view === 'pricing' && <PricingPage />}
        </div>
    );
}

export default App;
