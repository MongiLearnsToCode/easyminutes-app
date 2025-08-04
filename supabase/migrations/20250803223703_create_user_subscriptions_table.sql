-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    polar_customer_id TEXT,
    polar_subscription_id TEXT,
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'one_time', 'starter', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'canceled', 'past_due', 'inactive', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    meetings_used INTEGER NOT NULL DEFAULT 0,
    meetings_limit INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one subscription per user
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_polar_customer_id ON user_subscriptions (polar_customer_id);
CREATE INDEX idx_user_subscriptions_polar_subscription_id ON user_subscriptions (polar_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions (status);
CREATE INDEX idx_user_subscriptions_plan_type ON user_subscriptions (plan_type);

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own subscription
CREATE POLICY "Users can only see their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own subscription
CREATE POLICY "Users can only insert their own subscription" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscription
CREATE POLICY "Users can only update their own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own subscription
CREATE POLICY "Users can only delete their own subscription" ON user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
