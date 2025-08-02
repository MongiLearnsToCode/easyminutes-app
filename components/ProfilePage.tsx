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
import { profileService } from '../services/profileService';
import { subscriptionService } from '../services/subscriptionService';
import { UserProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';

interface ProfilePageProps {
    onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        avatar_url: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    const { theme, setTheme } = useTheme();

    // Load profile data on mount
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setIsLoading(true);
                
                // Load profile and subscription status in parallel
                const [profileData, subscriptionData] = await Promise.all([
                    profileService.getProfile(),
                    subscriptionService.getSubscriptionStatus()
                ]);

                if (profileData) {
                    setProfile(profileData);
                    setFormData({
                        name: profileData.name,
                        email: profileData.email,
                        avatar_url: profileData.avatar_url || '',
                    });
                    setAvatarPreview(profileData.avatar_url || '');
                }

                setSubscriptionStatus(subscriptionData);
            } catch (error) {
                console.error('Error loading profile data:', error);
                setError('Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
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

    const removeAvatar = async () => {
        if (profile?.avatar_url) {
            try {
                await profileService.deleteAvatar();
                setAvatarPreview('');
                setAvatarFile(null);
                setSuccess('Avatar removed successfully');
                
                // Refresh profile data
                const updatedProfile = await profileService.getProfile();
                if (updatedProfile) {
                    setProfile(updatedProfile);
                    setFormData(prev => ({ ...prev, avatar_url: '' }));
                }
            } catch (error) {
                setError('Failed to remove avatar');
            }
        } else {
            setAvatarFile(null);
            setAvatarPreview('');
            // Reset file input
            const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        }
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
            let avatarUrl = formData.avatar_url;

            // Upload new avatar if selected
            if (avatarFile) {
                try {
                    avatarUrl = await profileService.uploadAvatar(avatarFile);
                } catch (uploadError) {
                    console.error('Avatar upload failed:', uploadError);
                    setError('Failed to upload avatar, but profile will be saved');
                }
            }

            // Update profile
            const updatedProfile = await profileService.updateProfile({
                name: formData.name.trim(),
                email: formData.email,
                avatar_url: avatarUrl || null,
            });

            setProfile(updatedProfile);
            setFormData({
                name: updatedProfile.name,
                email: updatedProfile.email,
                avatar_url: updatedProfile.avatar_url || '',
            });
            setAvatarPreview(updatedProfile.avatar_url || '');
            setAvatarFile(null);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
                                        src={avatarPreview || profile?.avatar_url} 
                                        alt="Profile avatar" 
                                    />
                                    <AvatarFallback className="text-lg">
                                        {profile?.name ? getInitials(profile.name) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 h-6 w-6 flex items-center justify-center hover:bg-destructive/80 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            
                            {isEditing && (
                                <div className="flex flex-col space-y-2">
                                    <label
                                        htmlFor="avatar-upload"
                                        className="cursor-pointer flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span>Change Avatar</span>
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG or GIF, max 2MB
                                    </p>
                                </div>
                            )}
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
                                            avatar_url: profile?.avatar_url || '',
                                        });
                                        setAvatarPreview(profile?.avatar_url || '');
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

                {/* Subscription Status Card */}
                {subscriptionStatus && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Badge variant="outline" className="mr-2">
                                    {subscriptionStatus.planType}
                                </Badge>
                                <span>Subscription Details</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Status</Label>
                                    <p className="font-medium capitalize">{subscriptionStatus.status}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Meetings Used</Label>
                                    <p className="font-medium">
                                        {subscriptionStatus.meetingsUsed} / {subscriptionStatus.meetingsLimit === -1 ? '∞' : subscriptionStatus.meetingsLimit}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {subscriptionStatus.canSave && <Badge variant="secondary">Save Meetings</Badge>}
                                {subscriptionStatus.canExport && <Badge variant="secondary">Export</Badge>}
                                {subscriptionStatus.canShare && <Badge variant="secondary">Share</Badge>}
                                {subscriptionStatus.hasAutosave && <Badge variant="secondary">Auto-save</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Account Info Card */}
                {profile && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5" />
                                <span>Account Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Member since</span>
                                <span className="font-medium">{formatDate(profile.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last updated</span>
                                <span className="font-medium">{formatDate(profile.updated_at)}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
