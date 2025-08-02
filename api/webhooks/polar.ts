// This is a Next.js API route or Express.js endpoint for handling Polar webhooks
// You'll need to adapt this to your deployment environment

import { supabase } from '../../services/dbService';

interface PolarWebhookEvent {
    type: string;
    data: {
        id: string;
        customer_id?: string;
        customer_email?: string;
        product_id?: string;
        product_price_id?: string;
        subscription_id?: string;
        status?: string;
        current_period_start?: string;
        current_period_end?: string;
        metadata?: Record<string, string>;
    };
}

// Mapping of Polar product price IDs to internal plan types
const PRICE_TO_PLAN_MAP: Record<string, 'one_time' | 'starter' | 'pro' | 'enterprise'> = {
    'price_one_time': 'one_time',
    'price_starter': 'starter',
    'price_pro': 'pro',
    'price_enterprise': 'enterprise',
};

const PLAN_LIMITS = {
    one_time: { meetings_limit: 1 },
    starter: { meetings_limit: 30 },
    pro: { meetings_limit: 100 },
    enterprise: { meetings_limit: -1 }, // Unlimited
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const event: PolarWebhookEvent = req.body;
        
        // Verify webhook signature (implement this based on Polar's documentation)
        // const signature = req.headers['polar-signature'];
        // if (!verifyWebhookSignature(req.body, signature)) {
        //     return res.status(401).json({ error: 'Invalid signature' });
        // }

        console.log('Received Polar webhook event:', event.type, event.data);

        switch (event.type) {
            case 'checkout.created':
                await handleCheckoutCreated(event.data);
                break;
            case 'checkout.completed':
                await handleCheckoutCompleted(event.data);
                break;
            case 'subscription.created':
                await handleSubscriptionCreated(event.data);
                break;
            case 'subscription.updated':
                await handleSubscriptionUpdated(event.data);
                break;
            case 'subscription.cancelled':
                await handleSubscriptionCancelled(event.data);
                break;
            case 'subscription.renewed':
                await handleSubscriptionRenewed(event.data);
                break;
            default:
                console.log('Unhandled webhook event type:', event.type);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing Polar webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function handleCheckoutCreated(data: any) {
    // Log checkout creation for tracking
    console.log('Checkout created:', data.id);
}

async function handleCheckoutCompleted(data: any) {
    try {
        // Find user by email
        const { data: userData, error: userError } = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', data.customer_email)
            .single();

        if (userError || !userData) {
            console.error('User not found for email:', data.customer_email);
            return;
        }

        const planType = PRICE_TO_PLAN_MAP[data.product_price_id];
        if (!planType) {
            console.error('Unknown product price ID:', data.product_price_id);
            return;
        }

        const planLimits = PLAN_LIMITS[planType];
        
        // Update or create user subscription
        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: userData.id,
                polar_customer_id: data.customer_id,
                polar_subscription_id: data.subscription_id,
                plan_type: planType,
                status: 'active',
                meetings_used: 0,
                meetings_limit: planLimits.meetings_limit,
                current_period_start: data.current_period_start,
                current_period_end: data.current_period_end,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error updating user subscription:', error);
            throw error;
        }

        console.log('Subscription activated for user:', userData.id, 'plan:', planType);
    } catch (error) {
        console.error('Error handling checkout completed:', error);
        throw error;
    }
}

async function handleSubscriptionCreated(data: any) {
    console.log('Subscription created:', data.id);
    // Additional logic for subscription creation if needed
}

async function handleSubscriptionUpdated(data: any) {
    try {
        // Update subscription status
        const { error } = await supabase
            .from('user_subscriptions')
            .update({
                status: mapPolarStatusToInternal(data.status),
                current_period_start: data.current_period_start,
                current_period_end: data.current_period_end,
                updated_at: new Date().toISOString(),
            })
            .eq('polar_subscription_id', data.id);

        if (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }

        console.log('Subscription updated:', data.id);
    } catch (error) {
        console.error('Error handling subscription updated:', error);
        throw error;
    }
}

async function handleSubscriptionCancelled(data: any) {
    try {
        // Mark subscription as cancelled
        const { error } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'canceled',
                updated_at: new Date().toISOString(),
            })
            .eq('polar_subscription_id', data.id);

        if (error) {
            console.error('Error cancelling subscription:', error);
            throw error;
        }

        console.log('Subscription cancelled:', data.id);
    } catch (error) {
        console.error('Error handling subscription cancelled:', error);
        throw error;
    }
}

async function handleSubscriptionRenewed(data: any) {
    try {
        // Reset meeting usage and update period
        const { error } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'active',
                meetings_used: 0, // Reset usage for new period
                current_period_start: data.current_period_start,
                current_period_end: data.current_period_end,
                updated_at: new Date().toISOString(),
            })
            .eq('polar_subscription_id', data.id);

        if (error) {
            console.error('Error renewing subscription:', error);
            throw error;
        }

        console.log('Subscription renewed:', data.id);
    } catch (error) {
        console.error('Error handling subscription renewed:', error);
        throw error;
    }
}

function mapPolarStatusToInternal(polarStatus: string): 'active' | 'canceled' | 'past_due' | 'inactive' | 'trialing' {
    const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'inactive' | 'trialing'> = {
        'active': 'active',
        'trialing': 'trialing',
        'past_due': 'past_due',
        'canceled': 'canceled',
        'cancelled': 'canceled',
        'unpaid': 'past_due',
        'incomplete': 'inactive',
        'incomplete_expired': 'inactive',
    };
    
    return statusMap[polarStatus] || 'inactive';
}

// Webhook signature verification (implement based on Polar's documentation)
// function verifyWebhookSignature(payload: any, signature: string): boolean {
//     // Implement signature verification logic here
//     // This is crucial for security in production
//     return true; // Placeholder
// }
