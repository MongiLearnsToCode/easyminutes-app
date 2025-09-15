
import { NextApiRequest, NextApiResponse } from 'next';
import { Polar } from '@polar-sh/sdk';

const polar = new Polar();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    try {
        const event = await polar.webhooks.constructEvent(
            req.body,
            req.headers['polar-signature'] as string,
            process.env.POLAR_WEBHOOK_SECRET as string
        );

        switch (event.type) {
            case 'subscription.created':
                // Handle subscription created event
                break;
            case 'subscription.updated':
                // Handle subscription updated event
                break;
            case 'subscription.deleted':
                // Handle subscription deleted event
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error(err);
        res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
}
