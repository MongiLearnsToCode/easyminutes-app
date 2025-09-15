import React, { useState, useEffect } from 'react';
import PricingCard from './PricingCard';
import { subscriptionService, PlanLimits } from '../services/subscriptionService';
import { polarService } from '../services/polarService';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { USER_MESSAGES } from '../constants/userMessages';

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<{ [key: string]: PlanLimits }>({});
  const [currentPlan, setCurrentPlan] = useState('trial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    const fetchPlans = async () => {
      const proPlan = subscriptionService.getPlanLimits('pro');
      const trialPlan = subscriptionService.getPlanLimits('trial');
      setPlans({ pro: proPlan, trial: trialPlan });
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (plan: string) => {
    if (plan === 'trial') {
        window.dispatchEvent(new CustomEvent('navigate-dashboard'));
        return;
    }

    setLoading(true);
    setError(null);

    try {
        if (!user) {
            throw new Error(USER_MESSAGES.AUTH.SIGN_IN_TO_SAVE);
        }

        

        const successUrl = process.env.POLAR_SUCCESS_URL!;

        const checkoutUrl = await polarService.createCheckoutUrl(process.env.NEXT_PUBLIC_STARTER_SLUG!, user.email!, successUrl);

        window.location.href = checkoutUrl;

    } catch (err) {
        console.error('Error creating checkout session:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment process';
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  const getFeatures = (plan: PlanLimits) => {
    return [
      { text: 'AI Generations', included: plan.session_generation_limit === -1, description: plan.session_generation_limit === -1 ? 'Unlimited' : `${plan.session_generation_limit} per session` },
      { text: 'Save & Export', included: plan.can_save && plan.can_export },
      { text: 'Audio Transcription', included: plan.has_audio_transcription },
      { text: 'Auto-save', included: plan.has_autosave },
      { text: 'Priority Support', included: plan.has_priority_support },
    ];
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Choose your plan</h1>
        <p className="text-xl text-muted-foreground mt-2">Start for free, then upgrade to unlock all features.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.trial && (
          <PricingCard
            planName="Free"
            price="$0"
            priceDescription="For personal use"
            features={getFeatures(plans.trial)}
            isCurrentPlan={currentPlan === 'trial'}
            onSelectPlan={() => handleSelectPlan('trial')}
            buttonText="Start for Free"
          />
        )}
        {plans.pro && (
          <PricingCard
            planName="Pro"
            price="$10"
            priceDescription="Per user, per month"
            features={getFeatures(plans.pro)}
            isCurrentPlan={currentPlan === 'pro'}
            onSelectPlan={() => handleSelectPlan('pro')}
            buttonText={loading ? 'Processing...' : 'Upgrade to Pro'}
            isRecommended={true}
          />
        )}
      </div>
      {error && (
        <p className="text-center text-red-500 mt-8">{error}</p>
      )}
    </div>
  );
};

export default PricingPage;
