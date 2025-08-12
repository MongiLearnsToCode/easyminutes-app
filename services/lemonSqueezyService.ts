
import { LemonsqueezyClient } from '@lemonsqueezy/lemonsqueezy.js';

const apiKey = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
const storeId = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;

let client: LemonsqueezyClient | null = null;

if (apiKey && storeId) {
  client = new LemonsqueezyClient(apiKey);
} else {
  console.warn('Lemon Squeezy API key or store ID not set. Lemon Squeezy service will not be available.');
}

class LemonSqueezyService {
  async createCheckoutUrl(variantId: string, userEmail: string, successUrl: string) {
    if (!client) {
      throw new Error('Lemon Squeezy client not initialized.');
    }

    const checkout = await client.createCheckout({
      storeId: parseInt(storeId!),
      variantId: parseInt(variantId),
      custom: {
        user_email: userEmail,
      },
      checkout_data: {
        email: userEmail,
      },
      redirect_url: successUrl,
    });

    return checkout.url;
  }

  async getCheckoutSession(checkoutId: string) {
    if (!client) {
      throw new Error('Lemon Squeezy client not initialized.');
    }

    return await client.getCheckout({ id: checkoutId });
  }
}

export const lemonSqueezyService = new LemonSqueezyService();
export default lemonSqueezyService;
