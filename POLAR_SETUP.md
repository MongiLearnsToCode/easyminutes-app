# Polar.sh Sandbox Integration Setup

This guide will help you set up the Polar.sh sandbox integration for testing payment processing in your Easy Minutes application.

## Prerequisites

1. A Polar.sh account ([signup at sandbox.polar.sh](https://sandbox.polar.sh))
2. Your Easy Minutes project with Supabase configured
3. Node.js and npm installed

## Step 1: Create Polar.sh Sandbox Account

1. Go to [sandbox.polar.sh](https://sandbox.polar.sh)
2. Sign up for a sandbox account
3. Create an organization
4. Note your Organization ID from the dashboard

## Step 2: Get API Credentials

1. In your Polar sandbox dashboard, go to Settings → API Keys
2. Create a new API key with appropriate permissions
3. Copy the access token

## Step 3: Create Products in Polar Dashboard

Create the following products in your Polar sandbox dashboard:

### One-Time Purchase Product
- **Name**: Easy Minutes - One Time
- **Description**: Single meeting processing
- **Price**: $6.00 USD
- **Type**: One-time payment

### Starter Plan Product
- **Name**: Easy Minutes - Starter
- **Description**: 30 meetings per month
- **Price**: $39.00 USD
- **Type**: Recurring (Monthly)

### Pro Plan Product
- **Name**: Easy Minutes - Pro
- **Description**: 100 meetings per month
- **Price**: $99.00 USD
- **Type**: Recurring (Monthly)

### Enterprise Plan Product
- **Name**: Easy Minutes - Enterprise
- **Description**: Unlimited meetings
- **Price**: $199.00 USD
- **Type**: Recurring (Monthly)

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Polar credentials:
```env
# Polar.sh Configuration
VITE_POLAR_ENVIRONMENT=sandbox
VITE_POLAR_ACCESS_TOKEN=your_sandbox_access_token_here
VITE_POLAR_ORGANIZATION_ID=your_organization_id_here

# Product Price IDs (get these from your Polar dashboard)
VITE_POLAR_PRICE_ONE_TIME=price_xxxxxxxxxxxxx
VITE_POLAR_PRICE_STARTER=price_xxxxxxxxxxxxx
VITE_POLAR_PRICE_PRO=price_xxxxxxxxxxxxx
VITE_POLAR_PRICE_ENTERPRISE=price_xxxxxxxxxxxxx
```

## Step 5: Set Up Database Table

Run the SQL migration to create the user subscriptions table:

```sql
-- Copy the contents of sql/user_subscriptions.sql and run in your Supabase SQL editor
```

## Step 6: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the pricing page
3. You should see a sandbox indicator in the console
4. Try selecting a paid plan
5. Use the test card number: `4242 4242 4242 4242`
6. Any future expiry date and any 3-digit CVC will work

## Step 7: Set Up Webhooks (Optional but Recommended)

For production-like testing, set up webhooks:

1. Install ngrok for local development:
```bash
npm install -g ngrok
```

2. Expose your local server:
```bash
ngrok http 3000
```

3. In your Polar dashboard, add a webhook endpoint:
   - URL: `https://your-ngrok-url.ngrok.io/api/webhooks/polar`
   - Events: Select all checkout and subscription events

4. Update your webhook handler with proper signature verification (see `api/webhooks/polar.ts`)

## Testing Scenarios

### Successful Payment Flow
1. Select a plan
2. Complete checkout with test card
3. Verify success page shows
4. Check subscription in database

### Failed Payment Flow
1. Use decline test card: `4000000000000002`
2. Verify error handling

### Subscription Management
- Test plan upgrades/downgrades
- Test subscription cancellation
- Test webhook events

## Troubleshooting

### Common Issues

1. **"Product price ID not found"**
   - Verify your product price IDs in `.env.local`
   - Check that products are created in Polar dashboard

2. **API authentication errors**
   - Verify your access token
   - Ensure you're using the sandbox token, not production

3. **Webhook not receiving events**
   - Check ngrok is running and URL is correct
   - Verify webhook endpoint is set up in Polar dashboard
   - Check webhook signature verification

### Debug Information

The integration includes comprehensive logging in sandbox mode:

- Check browser console for detailed logs
- Look for "🧪 Sandbox Mode Active" message
- Error details are logged with environment info

### Test Cards

Use these test cards in sandbox:

- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **Expired Card**: `4000000000000069`

Any future expiry date and any 3-digit CVC will work.

## Moving to Production

1. Create products in production Polar dashboard
2. Get production API credentials
3. Update environment variables:
   ```env
   VITE_POLAR_ENVIRONMENT=production
   VITE_POLAR_ACCESS_TOKEN=your_production_token
   ```
4. Update webhook URLs to production endpoints
5. Implement proper webhook signature verification

## Support

- Polar.sh Documentation: [docs.polar.sh](https://docs.polar.sh)
- Polar.sh Discord: [discord.gg/STfRufb32V](https://discord.gg/STfRufb32V)
- Check the console logs for detailed error information in sandbox mode
