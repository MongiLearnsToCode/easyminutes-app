import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, X } from 'lucide-react';
import { LogoIcon } from '../constants';
import { profileService } from '../services/profileService';
import { supabase } from '../services/dbService';

interface OnboardingPageProps {
    onComplete: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        avatar_url: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // Load user email from auth on mount
    React.useEffect(() => {
        const loadUserEmail = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                    setFormData(prev => ({
                        ...prev,
                        email: user.email!,
                        name: user.user_metadata?.name || user.user_metadata?.full_name || ''
                    }));
                }
            } catch (error) {
                console.error('Error loading user email:', error);
            }
        };

        loadUserEmail();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            // Validate file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setError('Avatar image must be less than 2MB');
                return;
            }

            setAvatarFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const removeAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview('');
        // Reset file input
        const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
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
            let avatarUrl = '';

            // Upload avatar if selected
            if (avatarFile) {
                try {
                    avatarUrl = await profileService.uploadAvatar(avatarFile);
                } catch (uploadError) {
                    console.error('Avatar upload failed:', uploadError);
                    // Continue with profile creation even if avatar upload fails
                }
            }

            // Create profile
            await profileService.createInitialProfile({
                name: formData.name.trim(),
                email: formData.email,
                avatar_url: avatarUrl || undefined,
            });

            onComplete();
        } catch (error) {
            console.error('Error creating profile:', error);
            setError(error instanceof Error ? error.message : 'Failed to complete onboarding');
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
                        Let's set up your profile to get started
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

                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage 
                                        src={avatarPreview} 
                                        alt="Avatar preview" 
                                    />
                                    <AvatarFallback className="text-lg">
                                        {formData.name ? getInitials(formData.name) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 h-6 w-6 flex items-center justify-center hover:bg-destructive/80 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center">
                                <label
                                    htmlFor="avatar-upload"
                                    className="cursor-pointer flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span>Upload Avatar (Optional)</span>
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG or GIF, max 2MB
                                </p>
                            </div>
                        </div>

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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardingPage;
