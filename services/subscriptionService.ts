import { supabase } from './dbService';
import { User } from '@supabase/supabase-js';

export interface UserSubscription {
    id: string;
    user_id: string;
    lemonsqueezy_customer_id?: string;
    lemonsqueezy_subscription_id?: string;
    lemonsqueezy_order_id?: string;
    plan_type: 'trial' | 'pro';
    status: 'active' | 'canceled' | 'past_due' | 'inactive' | 'trialing';
    current_period_start?: string;
    current_period_end?: string;
    meetings_used: number;
    meetings_limit: number;
    session_generations: number; // Track AI generations in current session
    created_at: string;
    updated_at: string;
}

export interface PlanLimits {
    meetings_limit: number;
    can_save: boolean;
    can_export: boolean;
    can_share: boolean;
    has_autosave: boolean;
    has_audio_transcription: boolean;
    session_generation_limit: number; // Limit for AI generations per session
    has_priority_support: boolean;
    has_custom_templates: boolean;
    has_api_access: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
    trial: {
        meetings_limit: -1, // No meeting storage limit, but can't save
        can_save: false,
        can_export: false,
        can_share: false,
        has_autosave: false,
        has_audio_transcription: false,
        session_generation_limit: 5, // 3-5 AI generations per session
        has_priority_support: false,
        has_custom_templates: false,
        has_api_access: false,
    },
    pro: {
        meetings_limit: 100,
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: true,
        has_audio_transcription: true,
        session_generation_limit: -1, // Unlimited
        has_priority_support: true,
        has_custom_templates: true,
        has_api_access: false,
    },
};

class SubscriptionService {
    private async getCurrentUser(): Promise<User> {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            throw new Error("User not authenticated. Please log in.");
        }
        return user;
    }

    /**
     * Get user's current subscription
     */
    async getUserSubscription(): Promise<UserSubscription | null> {
        const user = await this.getCurrentUser();
        
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching user subscription:', error);
            throw new Error('Failed to fetch subscription');
        }

        return data || null;
    }

    /**
     * Create or update user subscription
     */
    async upsertUserSubscription(subscription: Partial<UserSubscription>): Promise<UserSubscription> {
        const user = await this.getCurrentUser();
        
        const subscriptionData = {
            ...subscription,
            user_id: user.id,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('user_subscriptions')
            .upsert(subscriptionData, { onConflict: 'user_id' })
            .select('*')
            .single();

        if (error) {
            console.error('Error upserting user subscription:', error);
            throw new Error('Failed to update subscription');
        }

        return data;
    }

    /**
     * Get plan limits for a subscription
     */
    getPlanLimits(planType: string): PlanLimits {
        return PLAN_LIMITS[planType] || PLAN_LIMITS.trial;
    }

    /**
     * Check if user can perform an action based on their subscription
     */
    async canPerformAction(action: keyof PlanLimits): Promise<boolean> {
        try {
            const subscription = await this.getUserSubscription();
            if (!subscription) {
                // User has no subscription, they're on trial
                return this.getPlanLimits('trial')[action] as boolean;
            }

            const limits = this.getPlanLimits(subscription.plan_type);
            return limits[action] as boolean;
        } catch (error) {
            console.error('Error checking action permission:', error);
            return false;
        }
    }

    /**
     * Check if user has reached their meeting limit
     */
    async hasReachedMeetingLimit(): Promise<boolean> {
        try {
            const subscription = await this.getUserSubscription();
            if (!subscription) {
                // Free user gets 1 meeting
                const { count } = await supabase
                    .from('meetings')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', (await this.getCurrentUser()).id);

                return (count || 0) >= 1;
            }

            const limits = this.getPlanLimits(subscription.plan_type);
            if (limits.meetings_limit === -1) {
                return false; // Unlimited
            }

            return subscription.meetings_used >= limits.meetings_limit;
        } catch (error) {
            console.error('Error checking meeting limit:', error);
            return true; // Default to limiting access on error
        }
    }

    /**
     * Increment meeting usage count
     */
    async incrementMeetingUsage(): Promise<void> {
        try {
            const subscription = await this.getUserSubscription();
            if (!subscription) {
                // Create a trial subscription record
                await this.upsertUserSubscription({
                    plan_type: 'trial',
                    status: 'active',
                    meetings_used: 1,
                    meetings_limit: -1,
                    session_generations: 0,
                    created_at: new Date().toISOString(),
                });
                return;
            }

            await this.upsertUserSubscription({
                ...subscription,
                meetings_used: subscription.meetings_used + 1,
            });
        } catch (error) {
            console.error('Error incrementing meeting usage:', error);
            throw new Error('Failed to update meeting usage');
        }
    }

    /**
     * Reset monthly meeting usage (call this monthly via cron job)
     */
    async resetMonthlyUsage(): Promise<void> {
        const { error } = await supabase
            .from('user_subscriptions')
            .update({ 
                meetings_used: 0,
                updated_at: new Date().toISOString() 
            })
            .in('plan_type', ['starter', 'pro', 'enterprise'])
            .eq('status', 'active');

        if (error) {
            console.error('Error resetting monthly usage:', error);
            throw new Error('Failed to reset monthly usage');
        }
    }

    /**
     * Check if user can generate more AI summaries in current session
     */
    async canGenerateInSession(): Promise<{ canGenerate: boolean; remainingGenerations: number; isTrialUser: boolean }> {
        try {
            const subscription = await this.getUserSubscription();
            
            if (!subscription) {
                // Create trial subscription for new users
                const newSubscription = await this.upsertUserSubscription({
                    plan_type: 'trial',
                    status: 'active',
                    meetings_used: 0,
                    meetings_limit: -1,
                    session_generations: 0,
                    created_at: new Date().toISOString(),
                });
                
                const limits = this.getPlanLimits('trial');
                return {
                    canGenerate: true,
                    remainingGenerations: limits.session_generation_limit,
                    isTrialUser: true
                };
            }

            const limits = this.getPlanLimits(subscription.plan_type);
            const isTrialUser = subscription.plan_type === 'trial';
            
            if (limits.session_generation_limit === -1) {
                // Unlimited generations for Pro users
                return {
                    canGenerate: true,
                    remainingGenerations: -1,
                    isTrialUser: false
                };
            }

            const remaining = limits.session_generation_limit - subscription.session_generations;
            return {
                canGenerate: remaining > 0,
                remainingGenerations: remaining,
                isTrialUser
            };
        } catch (error) {
            console.error('Error checking session generation limit:', error);
            return { canGenerate: false, remainingGenerations: 0, isTrialUser: true };
        }
    }

    /**
     * Increment session generation count
     */
    async incrementSessionGeneration(): Promise<void> {
        try {
            const subscription = await this.getUserSubscription();
            if (!subscription) {
                // This shouldn't happen if canGenerateInSession was called first
                throw new Error('No subscription found');
            }

            await this.upsertUserSubscription({
                ...subscription,
                session_generations: subscription.session_generations + 1,
            });
        } catch (error) {
            console.error('Error incrementing session generation:', error);
            throw new Error('Failed to update session generation count');
        }
    }

    /**
     * Reset session generations (call this when user starts a new session)
     */
    async resetSessionGenerations(): Promise<void> {
        try {
            const subscription = await this.getUserSubscription();
            if (subscription) {
                await this.upsertUserSubscription({
                    ...subscription,
                    session_generations: 0,
                });
            }
        } catch (error) {
            console.error('Error resetting session generations:', error);
        }
    }

    /**
     * Get subscription status for display
     */
    async getSubscriptionStatus(): Promise<{
        planType: string;
        status: string;
        meetingsUsed: number;
        meetingsLimit: number;
        canSave: boolean;
        canExport: boolean;
        canShare: boolean;
        hasAutosave: boolean;
        hasAudioTranscription: boolean;
        sessionGenerations: number;
        sessionGenerationLimit: number;
        isTrialUser: boolean;
    }> {
        const subscription = await this.getUserSubscription();
        
        if (!subscription) {
            const limits = this.getPlanLimits('trial');
            
            return {
                planType: 'Trial',
                status: 'active',
                meetingsUsed: 0,
                meetingsLimit: limits.meetings_limit,
                canSave: limits.can_save,
                canExport: limits.can_export,
                canShare: limits.can_share,
                hasAutosave: limits.has_autosave,
                hasAudioTranscription: limits.has_audio_transcription,
                sessionGenerations: 0,
                sessionGenerationLimit: limits.session_generation_limit,
                isTrialUser: true,
            };
        }

        const limits = this.getPlanLimits(subscription.plan_type);
        
        return {
            planType: subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1),
            status: subscription.status,
            meetingsUsed: subscription.meetings_used,
            meetingsLimit: limits.meetings_limit,
            canSave: limits.can_save,
            canExport: limits.can_export,
            canShare: limits.can_share,
            hasAutosave: limits.has_autosave,
            hasAudioTranscription: limits.has_audio_transcription,
            sessionGenerations: subscription.session_generations || 0,
            sessionGenerationLimit: limits.session_generation_limit,
            isTrialUser: subscription.plan_type === 'trial',
        };
    }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
