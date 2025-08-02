import React, { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './services/dbService';
import { profileService } from './services/profileService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AllMeetingsPage from './components/AllMeetingsPage';
import PricingPage from './components/PricingPage';
import SuccessPage from './components/SuccessPage';
import OnboardingPage from './components/OnboardingPage';
import ProfilePage from './components/ProfilePage';
import { LogoIcon } from './constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [view, setView] = useState<'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'onboarding' | 'profile' | 'settings'>('dashboard');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [savingStatus, setSavingStatus] = useState<{
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: any;
    } | undefined>(undefined);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            
            if (session) {
                // Check if user needs onboarding
                try {
                    const hasProfile = await profileService.hasCompletedOnboarding();
                    if (!hasProfile) {
                        setNeedsOnboarding(true);
                        setView('onboarding');
                    }
                } catch (error) {
                    console.error('Error checking onboarding status:', error);
                }
            }
            
            setLoading(false);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            
            if (session && _event === 'SIGNED_IN') {
                // Check if new user needs onboarding
                try {
                    const hasProfile = await profileService.hasCompletedOnboarding();
                    if (!hasProfile) {
                        setNeedsOnboarding(true);
                        setView('onboarding');
                    }
                } catch (error) {
                    console.error('Error checking onboarding status:', error);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleNavigate = (targetView: 'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'profile' | 'settings') => {
        setSelectedMeetingId(null);
        setView(targetView);
    };

    const handleOnboardingComplete = () => {
        setNeedsOnboarding(false);
        setView('dashboard');
    };
    
    // Check for success page on mount
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

    // Show onboarding if needed (without header)
    if (needsOnboarding && view === 'onboarding') {
        return (
            <ThemeProvider>
                <ToastProvider>
                    <OnboardingPage onComplete={handleOnboardingComplete} />
                </ToastProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="min-h-screen bg-background font-sans text-foreground">
                    <Header currentView={view} onNavigate={handleNavigate} session={session} savingStatus={savingStatus} />
                    {view === 'dashboard' && <Dashboard onShowAll={() => handleNavigate('allMeetings')} selectedMeetingId={selectedMeetingId} onSavingStatusChange={setSavingStatus} />}
                    {view === 'allMeetings' && <AllMeetingsPage onSelectMeeting={handleSelectMeetingFromAll} onBack={() => handleNavigate('dashboard')} />}
                    {view === 'pricing' && <PricingPage />}
                    {view === 'success' && <SuccessPage onNavigate={handleNavigate} />}
                    {view === 'profile' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                    {view === 'settings' && <ProfilePage onBack={() => handleNavigate('dashboard')} />}
                </div>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
