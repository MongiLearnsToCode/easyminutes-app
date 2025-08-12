
import { lemonSqueezySetup, createCheckout, getCheckout } from '@lemonsqueezy/lemonsqueezy.js';

const apiKey = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
const storeId = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;

let isInitialized = false;

if (apiKey && storeId) {
  lemonSqueezySetup({
    apiKey,
  });
  isInitialized = true;
} else {
  console.warn('Lemon Squeezy API key or store ID not set. Lemon Squeezy service will not be available.');
}

class LemonSqueezyService {
  async createCheckoutUrl(variantId: string, userEmail: string, successUrl: string) {
    if (!isInitialized) {
      throw new Error('Lemon Squeezy client not initialized.');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated.');
      }

      const checkout = await createCheckout(storeId!, variantId, {
        checkoutData: {
          email: userEmail,
          custom: {
            user_id: user.id,
          },
        },
        productOptions: {
          redirectUrl: successUrl,
        },
      });

      return checkout.data.attributes.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async getCheckoutSession(checkoutId: string) {
    if (!isInitialized) {
      throw new Error('Lemon Squeezy client not initialized.');
    }

    return await getCheckout(checkoutId);
  }
}

export const lemonSqueezyService = new LemonSqueezyService();
export default lemonSqueezyService;
