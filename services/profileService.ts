import { supabase } from './dbService';
import { UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

export interface ProfileUpdateData {
    name?: string;
    email?: string;
    avatar_url?: string | null;
    theme_preference?: 'light' | 'dark' | 'system';
}

class ProfileService {
    private async getCurrentUser(): Promise<User> {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            throw new Error("User not authenticated. Please log in.");
        }
        return user;
    }

    /**
     * Get user's profile
     */
    async getProfile(): Promise<UserProfile | null> {
        const user = await this.getCurrentUser();
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching user profile:', error);
            throw new Error('Failed to fetch profile');
        }

        return data || null;
    }

    /**
     * Create or update user profile
     */
    async upsertProfile(profileData: ProfileUpdateData): Promise<UserProfile> {
        const user = await this.getCurrentUser();
        
        const updateData = {
            ...profileData,
            id: user.id,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('profiles')
            .upsert(updateData, { onConflict: 'id' })
            .select('*')
            .single();

        if (error) {
            console.error('Error upserting user profile:', error);
            throw new Error('Failed to update profile');
        }

        return data;
    }

    /**
     * Update profile fields
     */
    async updateProfile(profileData: ProfileUpdateData): Promise<UserProfile> {
        const user = await this.getCurrentUser();
        
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...profileData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating user profile:', error);
            throw new Error('Failed to update profile');
        }

        return data;
    }

    /**
     * Update theme preference
     */
    async updateThemePreference(theme: 'light' | 'dark' | 'system'): Promise<void> {
        const user = await this.getCurrentUser();
        
        const { error } = await supabase
            .from('profiles')
            .update({
                theme_preference: theme,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating theme preference:', error);
            throw new Error('Failed to update theme preference');
        }
    }

    /**
     * Upload avatar image
     */
    async uploadAvatar(file: File): Promise<string> {
        const user = await this.getCurrentUser();
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('Error uploading avatar:', error);
            throw new Error('Failed to upload avatar');
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path);

        // Update profile with new avatar URL
        await this.updateProfile({ avatar_url: publicUrl });

        return publicUrl;
    }

    /**
     * Delete avatar
     */
    async deleteAvatar(): Promise<void> {
        const profile = await this.getProfile();
        if (!profile?.avatar_url) return;

        // Extract filename from URL
        try {
            const url = new URL(profile.avatar_url);
            const pathSegments = url.pathname.split('/');
            const fileName = pathSegments[pathSegments.length - 1];

            // Delete from storage
            const { error } = await supabase.storage
                .from('avatars')
                .remove([fileName]);

            if (error) {
                console.error('Error deleting avatar from storage:', error);
                // Continue to remove from profile even if storage deletion fails
            }
        } catch (e) {
            console.error('Error parsing avatar URL:', e);
        }

        // Remove avatar URL from profile
        await this.updateProfile({ avatar_url: null });
    }

    /**
     * Create initial profile for new user
     */
    async createInitialProfile(userData: {
        name: string;
        email: string;
        avatar_url?: string;
    }): Promise<UserProfile> {
        const user = await this.getCurrentUser();
        
        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                name: userData.name,
                email: userData.email,
                avatar_url: userData.avatar_url,
                theme_preference: 'system',
            })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating initial profile:', error);
            throw new Error('Failed to create profile');
        }

        return data;
    }

    /**
     * Check if user has completed onboarding
     */
    async hasCompletedOnboarding(): Promise<boolean> {
        try {
            const profile = await this.getProfile();
            return profile !== null;
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            return false;
        }
    }

    /**
     * Get user's display name
     */
    async getDisplayName(): Promise<string> {
        try {
            const profile = await this.getProfile();
            if (profile?.name) {
                return profile.name;
            }
            
            const user = await this.getCurrentUser();
            return user.email?.split('@')[0] || 'User';
        } catch (error) {
            console.error('Error getting display name:', error);
            return 'User';
        }
    }

    /**
     * Get user's avatar URL
     */
    async getAvatarUrl(): Promise<string | null> {
        try {
            const profile = await this.getProfile();
            return profile?.avatar_url || null;
        } catch (error) {
            console.error('Error getting avatar URL:', error);
            return null;
        }
    }
}

export const profileService = new ProfileService();

// Legacy exports for backward compatibility
export const getProfile = () => profileService.getProfile();
export const createProfile = (data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => 
    profileService.createInitialProfile(data);
export const updateProfile = (data: Partial<Omit<UserProfile, 'id' | 'created_at'>>) => 
    profileService.updateProfile(data);

export default profileService;
