import type { NextApiRequest, NextApiResponse } from 'next';
import { subscriptionService } from '../../services/subscriptionService';
import crypto from 'crypto';

// Disable the default body parser to access the raw request body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to read the raw body from the request
const getRawBody = async (req: NextApiRequest): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-signature'] as string;
    const secret = process.env.LEMONSQUEEZY_SIGNING_SECRET;

    if (!secret) {
      throw new Error('Lemon Squeezy signing secret is not set.');
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return res.status(401).json({ message: 'Invalid signature.' });
    }

    const event = JSON.parse(rawBody.toString());

    // Handle the event
    switch (event.meta.event_name) {
      case 'subscription_created':
        await subscriptionService.upsertUserSubscription({
          lemonsqueezy_subscription_id: event.data.id,
          lemonsqueezy_customer_id: event.data.attributes.customer_id,
          lemonsqueezy_order_id: event.data.attributes.order_id,
          plan_type: event.data.attributes.variant_name.toLowerCase(),
          status: event.data.attributes.status,
          current_period_start: event.data.attributes.renews_at,
          current_period_end: event.data.attributes.ends_at,
        });
        break;
      case 'subscription_updated':
        await subscriptionService.upsertUserSubscription({
          lemonsqueezy_subscription_id: event.data.id,
          plan_type: event.data.attributes.variant_name.toLowerCase(),
          status: event.data.attributes.status,
          current_period_start: event.data.attributes.renews_at,
          current_period_end: event.data.attributes.ends_at,
        });
        break;
      case 'subscription_cancelled':
        await subscriptionService.upsertUserSubscription({
          lemonsqueezy_subscription_id: event.data.id,
          status: 'canceled',
        });
        break;
      default:
        console.log(`Unhandled event type: ${event.meta.event_name}`);
    }

    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
