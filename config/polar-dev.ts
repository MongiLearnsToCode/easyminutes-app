// Development configuration for Polar.sh sandbox testing

export const POLAR_DEV_CONFIG = {
    // Sandbox environment settings
    SANDBOX_API_URL: 'https://sandbox-api.polar.sh',
    SANDBOX_DASHBOARD_URL: 'https://sandbox.polar.sh',
    
    // Test card numbers for sandbox
    TEST_CARDS: {
        VISA_SUCCESS: '4242424242424242',
        VISA_DECLINE: '4000000000000002',
        MASTERCARD_SUCCESS: '5555555555554444',
        AMEX_SUCCESS: '378282246310005',
    },
    
    // Common test data
    TEST_CUSTOMER: {
        email: 'test@example.com',
        name: 'Test Customer',
    },
    
    // Sandbox webhook endpoints
    WEBHOOK_ENDPOINTS: {
        LOCAL_DEV: 'http://localhost:3000/api/webhooks/polar',
        NGROK_PLACEHOLDER: 'https://your-ngrok-url.ngrok.io/api/webhooks/polar',
    },
    
    // Development helpers
    DEBUG_MODE: true,
    LOG_REQUESTS: true,
};

// Helper function to check if we're in sandbox mode
export const isSandboxMode = (): boolean => {
    return (import.meta.env.VITE_POLAR_ENVIRONMENT || 'sandbox') === 'sandbox';
};

// Helper function to get the appropriate dashboard URL
export const getPolarDashboardUrl = (): string => {
    return isSandboxMode() 
        ? POLAR_DEV_CONFIG.SANDBOX_DASHBOARD_URL 
        : 'https://polar.sh';
};

// Helper function to log development info
export const logDevInfo = (message: string, data?: any): void => {
    if (POLAR_DEV_CONFIG.DEBUG_MODE && import.meta.env.DEV) {
        console.log(`[Polar Dev] ${message}`, data);
    }
};

// Test product configuration for sandbox
export const SANDBOX_TEST_PRODUCTS = {
    ONE_TIME: {
        name: 'Test One-Time Purchase',
        description: 'Single meeting processing for testing',
        price: 600, // $6.00 in cents
        currency: 'USD',
    },
    STARTER: {
        name: 'Test Starter Plan',
        description: '30 meetings per month for testing',
        price: 3900, // $39.00 in cents
        currency: 'USD',
        interval: 'month' as const,
    },
    PRO: {
        name: 'Test Pro Plan',
        description: '100 meetings per month for testing',
        price: 9900, // $99.00 in cents
        currency: 'USD',
        interval: 'month' as const,
    },
    ENTERPRISE: {
        name: 'Test Enterprise Plan',
        description: 'Unlimited meetings for testing',
        price: 19900, // $199.00 in cents
        currency: 'USD',
        interval: 'month' as const,
    },
};

// Function to create test products (run this in your Polar sandbox dashboard)
export const getCreateProductsScript = (): string => {
    return `
// Run this in your Polar sandbox dashboard console to create test products:

const products = ${JSON.stringify(SANDBOX_TEST_PRODUCTS, null, 2)};

// You'll need to create these products manually in the Polar dashboard
// or use the Polar API to create them programmatically
console.log('Create these products in your Polar sandbox:', products);
`;
};

export default POLAR_DEV_CONFIG;
