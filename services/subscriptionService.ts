import { supabase } from './dbService';
import { User } from '@supabase/supabase-js';

export interface UserSubscription {
    id: string;
    user_id: string;
    polar_customer_id?: string;
    polar_subscription_id?: string;
    plan_type: 'free' | 'one_time' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'inactive' | 'trialing';
    current_period_start?: string;
    current_period_end?: string;
    meetings_used: number;
    meetings_limit: number;
    created_at: string;
    updated_at: string;
}

export interface PlanLimits {
    meetings_limit: number;
    can_save: boolean;
    can_export: boolean;
    can_share: boolean;
    has_autosave: boolean;
    has_priority_support: boolean;
    has_custom_templates: boolean;
    has_api_access: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
    free: {
        meetings_limit: 1,
        can_save: false,
        can_export: false,
        can_share: false,
        has_autosave: false,
        has_priority_support: false,
        has_custom_templates: false,
        has_api_access: false,
    },
    one_time: {
        meetings_limit: 1,
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: false,
        has_priority_support: false,
        has_custom_templates: false,
        has_api_access: false,
    },
    starter: {
        meetings_limit: 30,
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: true,
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
        has_priority_support: true,
        has_custom_templates: true,
        has_api_access: false,
    },
    enterprise: {
        meetings_limit: -1, // Unlimited
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: true,
        has_priority_support: true,
        has_custom_templates: true,
        has_api_access: true,
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
        return PLAN_LIMITS[planType] || PLAN_LIMITS.free;
    }

    /**
     * Check if user can perform an action based on their subscription
     */
    async canPerformAction(action: keyof PlanLimits): Promise<boolean> {
        try {
            const subscription = await this.getUserSubscription();
            if (!subscription) {
                // User has no subscription, they're on free plan
                return this.getPlanLimits('free')[action] as boolean;
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
                // Create a free subscription record
                await this.upsertUserSubscription({
                    plan_type: 'free',
                    status: 'active',
                    meetings_used: 1,
                    meetings_limit: 1,
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
    }> {
        const subscription = await this.getUserSubscription();
        
        if (!subscription) {
            const limits = this.getPlanLimits('free');
            const user = await this.getCurrentUser();
            
            // Count user's meetings to show usage
            const { count } = await supabase
                .from('meetings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            return {
                planType: 'Free',
                status: 'active',
                meetingsUsed: count || 0,
                meetingsLimit: limits.meetings_limit,
                canSave: limits.can_save,
                canExport: limits.can_export,
                canShare: limits.can_share,
                hasAutosave: limits.has_autosave,
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
        };
    }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
