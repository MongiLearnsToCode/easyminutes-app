
import { Webhooks } from '@polar-sh/nextjs';

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    onPayload: async (payload) => {
        console.log('Received Polar webhook payload:', payload);

        switch (payload.type) {
            case 'subscription.created':
                console.log('New subscription created:', payload.data);
                // Update your database, send a welcome email, etc.
                break;
            case 'order.paid':
                console.log('Order paid:', payload.data);
                // Fulfill the order, grant access, etc.
                break;
            // Add more cases for other event types you've subscribed to
            default:
                console.log(`Unhandled event type: ${payload.type}`);
        }
    },
});
