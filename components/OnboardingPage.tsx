import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { LogoIcon } from '../constants';
import { useCreateUser } from '../services/profileService';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

interface OnboardingPageProps {
    onComplete: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const identity = useQuery(api.users.getCurrentUserIdentity);
    const createUser = useCreateUser();

    useEffect(() => {
        if (identity) {
            setFormData(prev => ({
                ...prev,
                email: identity.email!,
                name: identity.name || identity.email?.split('@')[0] || ''
            }));
        }
    }, [identity]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!formData.name.trim()) {
            setError('Please enter your name');
            setIsLoading(false);
            return;
        }

        try {
            await createUser({
                name: formData.name.trim(),
                email: formData.email,
            });

            onComplete();
        } catch (error) {
            console.error('Error creating profile:', error);
            setError(error instanceof Error ? `An error occurred: ${error.message}` : 'Failed to complete onboarding');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        try {
            await createUser({
                name: formData.name.trim(),
                email: formData.email,
            });
            onComplete();
        } catch (error) {
            console.error('Error skipping onboarding:', error);
            setError(error instanceof Error ? `An error occurred: ${error.message}` : 'Failed to skip onboarding');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto shadow-2xl">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <LogoIcon className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">
                        Welcome to Easy Minutes
                    </CardTitle>
                    <p className="text-muted-foreground">
                        Let&apos;s set up your profile to get started
                    </p>
                </CardHeader>
                
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert className="border-destructive">
                                <AlertDescription className="text-destructive">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="your@email.com"
                                disabled={true}
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed after signup
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !formData.name.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Setting up your profile...
                                </>
                            ) : (
                                'Complete Setup'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full mt-2"
                            onClick={handleSkip}
                            disabled={isLoading}
                        >
                            Skip for now
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardingPage;