import { Polar } from '@polar-sh/sdk';

// Initialize Polar SDK with environment-based configuration
const getServerUrl = () => {
    const environment = import.meta.env.VITE_POLAR_ENVIRONMENT || 'sandbox';
    return environment === 'production' 
        ? 'https://api.polar.sh'
        : 'https://sandbox-api.polar.sh';
};

// Check if environment variables are properly configured
const isConfigured = () => {
    const accessToken = import.meta.env.VITE_POLAR_ACCESS_TOKEN;
    return accessToken && 
           accessToken !== 'your_polar_access_token_here' && 
           accessToken.length > 10;
};

// Initialize Polar SDK only if properly configured
let polar: Polar | null = null;
try {
    if (isConfigured()) {
        polar = new Polar({
            accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN,
            server: getServerUrl(),
        });
    } else {
        console.warn('⚠️ Polar SDK not configured. Set VITE_POLAR_ACCESS_TOKEN in .env.local');
    }
} catch (error) {
    console.error('❌ Failed to initialize Polar SDK:', error);
    polar = null;
}

// Helper function to log environment info
const logEnvironmentInfo = () => {
    const environment = import.meta.env.VITE_POLAR_ENVIRONMENT || 'sandbox';
    console.log(`Polar SDK initialized in ${environment} mode using ${getServerUrl()}`);
};

// Log environment info when service is imported
if (import.meta.env.DEV) {
    logEnvironmentInfo();
}

export interface PolarProduct {
    id: string;
    name: string;
    description?: string;
    is_recurring: boolean;
    is_archived: boolean;
    organization_id: string;
    prices: PolarPrice[];
}

export interface PolarPrice {
    id: string;
    amount_type: 'fixed' | 'custom';
    is_archived: boolean;
    price_amount?: number;
    price_currency?: string;
    type: 'one_time' | 'recurring';
    recurring_interval?: 'month' | 'year';
}

export interface PolarCheckoutSession {
    id: string;
    url: string;
    customer_id?: string;
    customer_email?: string;
    customer_name?: string;
    product_id: string;
    product_price_id: string;
    subscription_id?: string;
    status: 'open' | 'expired' | 'completed';
}

export interface CreateCheckoutRequest {
    product_price_id: string;
    success_url: string;
    customer_email?: string;
    customer_name?: string;
    metadata?: Record<string, string>;
}

export interface PolarSubscription {
    id: string;
    status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    started_at?: string;
    ended_at?: string;
    customer_id: string;
    product_id: string;
    price_id: string;
}

class PolarService {
    /**
     * Get all products from Polar
     */
    async getProducts(organizationId?: string): Promise<PolarProduct[]> {
        if (!polar) {
            console.warn('Polar SDK not configured - returning empty products list');
            return [];
        }
        
        try {
            const response = await polar.products.list({
                organization_id: organizationId,
                is_archived: false,
            });
            
            return response.result?.items || [];
        } catch (error) {
            console.error('Error fetching Polar products:', error);
            throw new Error('Failed to fetch products');
        }
    }

    /**
     * Get a specific product by ID
     */
    async getProduct(productId: string): Promise<PolarProduct | null> {
        if (!polar) {
            console.warn('Polar SDK not configured - cannot fetch product');
            return null;
        }
        
        try {
            const response = await polar.products.get({
                id: productId,
            });
            
            return response.result || null;
        } catch (error) {
            console.error('Error fetching Polar product:', error);
            return null;
        }
    }

    /**
     * Create a checkout session for a product
     */
    async createCheckoutSession(request: CreateCheckoutRequest): Promise<PolarCheckoutSession> {
        if (!polar) {
            throw new Error('Polar SDK not configured - cannot create checkout session');
        }
        
        try {
            const response = await polar.checkouts.create({
                product_price_id: request.product_price_id,
                success_url: request.success_url,
                customer_email: request.customer_email,
                customer_name: request.customer_name,
                metadata: request.metadata,
            });

            if (!response.result) {
                throw new Error('No checkout session returned from Polar');
            }

            return response.result;
        } catch (error) {
            console.error('Error creating Polar checkout session:', error);
            throw new Error('Failed to create checkout session');
        }
    }

    /**
     * Get customer subscriptions
     */
    async getCustomerSubscriptions(customerId: string): Promise<PolarSubscription[]> {
        if (!polar) {
            console.warn('Polar SDK not configured - returning empty subscriptions list');
            return [];
        }
        
        try {
            const response = await polar.subscriptions.list({
                customer_id: customerId,
            });
            
            return response.result?.items || [];
        } catch (error) {
            console.error('Error fetching customer subscriptions:', error);
            throw new Error('Failed to fetch subscriptions');
        }
    }

    /**
     * Get subscription by ID
     */
    async getSubscription(subscriptionId: string): Promise<PolarSubscription | null> {
        if (!polar) {
            console.warn('Polar SDK not configured - cannot fetch subscription');
            return null;
        }
        
        try {
            const response = await polar.subscriptions.get({
                id: subscriptionId,
            });
            
            return response.result || null;
        } catch (error) {
            console.error('Error fetching subscription:', error);
            return null;
        }
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId: string): Promise<PolarSubscription> {
        if (!polar) {
            throw new Error('Polar SDK not configured - cannot cancel subscription');
        }
        
        try {
            const response = await polar.subscriptions.cancel({
                id: subscriptionId,
            });

            if (!response.result) {
                throw new Error('No subscription returned from Polar');
            }

            return response.result;
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }

    /**
     * Update subscription (e.g., change plan)
     */
    async updateSubscription(subscriptionId: string, productPriceId: string): Promise<PolarSubscription> {
        if (!polar) {
            throw new Error('Polar SDK not configured - cannot update subscription');
        }
        
        try {
            const response = await polar.subscriptions.update({
                id: subscriptionId,
                product_price_id: productPriceId,
            });

            if (!response.result) {
                throw new Error('No subscription returned from Polar');
            }

            return response.result;
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw new Error('Failed to update subscription');
        }
    }

    /**
     * Get organization info (useful for getting your organization ID)
     */
    async getOrganization(slug: string): Promise<any> {
        if (!polar) {
            console.warn('Polar SDK not configured - cannot fetch organization');
            return null;
        }
        
        try {
            const response = await polar.organizations.get({
                slug: slug,
            });
            
            return response.result || null;
        } catch (error) {
            console.error('Error fetching organization:', error);
            return null;
        }
    }
}

export const polarService = new PolarService();
export default polarService;
