import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, Save, ArrowLeft, User, Mail, Calendar, Palette } from 'lucide-react';
import { useGetUserProfile, useUpdateUserProfile } from '../services/profileService';
import { useTheme } from '../contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';

interface ProfilePageProps {
    onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
    const profile = useGetUserProfile();
    const updateUserProfile = useUpdateUserProfile();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        image: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    const { theme, setTheme } = useTheme();

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name,
                email: profile.email,
                image: profile.image || '',
            });
            setAvatarPreview(profile.image || '');
            setIsLoading(false);
        }
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setIsSaving(true);

        if (!formData.name.trim()) {
            setError('Please enter your name');
            setIsSaving(false);
            return;
        }

        try {
            await updateUserProfile({
                name: formData.name.trim(),
                image: formData.image || null,
            });

            setIsEditing(false);
            setSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
                </div>

                {/* Status Messages */}
                {error && (
                    <Alert className="border-destructive">
                        <AlertDescription className="text-destructive">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                        <AlertDescription className="text-green-700 dark:text-green-300">
                            {success}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <User className="h-5 w-5" />
                                <span>Profile Information</span>
                            </CardTitle>
                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={avatarPreview || profile?.image}
                                        alt="Profile avatar"
                                    />
                                    <AvatarFallback className="text-lg">
                                        {profile?.name ? getInitials(profile.name) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? 'bg-muted' : ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={true}
                                    className="bg-muted"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex space-x-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving || !formData.name.trim()}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            name: profile?.name || '',
                                            email: profile?.email || '',
                                            image: profile?.image || '',
                                        });
                                        setAvatarPreview(profile?.image || '');
                                        setAvatarFile(null);
                                        setError('');
                                        setSuccess('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Theme Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Palette className="h-5 w-5" />
                            <span>Theme Preferences</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base">Light Mode</Label>
                                <p className="text-sm text-muted-foreground">Use light theme</p>
                            </div>
                            <Switch
                                checked={theme === 'light'}
                                onCheckedChange={(checked) => handleThemeChange(checked ? 'light' : 'dark')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base">Dark Mode</Label>
                                <p className="text-sm text-muted-foreground">Use dark theme</p>
                            </div>
                            <Switch
                                checked={theme === 'dark'}
                                onCheckedChange={(checked) => handleThemeChange(checked ? 'dark' : 'light')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base">Follow System</Label>
                                <p className="text-sm text-muted-foreground">Use system theme preference</p>
                            </div>
                            <Switch
                                checked={theme === 'system'}
                                onCheckedChange={(checked) => handleThemeChange(checked ? 'system' : 'light')}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;