import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from '../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { polarService } from '../services/polarService';

interface SuccessPageProps {
    onNavigate: (view: 'dashboard' | 'allMeetings' | 'pricing') => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ onNavigate }) => {
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscriptionDetails, setSubscriptionDetails] = useState<{
        planType: string;
        status: string;
    } | null>(null);

    useEffect(() => {
        const processPaymentSuccess = async () => {
            try {
                // Extract checkout session ID from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const checkoutId = urlParams.get('checkout_id');
                
                if (!checkoutId) {
                    throw new Error('No checkout ID found in URL parameters');
                }

                // Verify the subscription status with Polar
                const checkout = await polarService.getCheckoutSession(checkoutId);

                if (checkout.data.attributes.status !== 'paid') {
                    throw new Error('Checkout session not paid yet.');
                }

                const planType = checkout.data.attributes.variant_name.toLowerCase() as 'pro' | 'trial';
                
                await subscriptionService.upsertUserSubscription({
                    plan_type: planType,
                    status: 'active',
                    meetings_used: 0,
                    meetings_limit: planType === 'pro' ? 100 : 1,
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                });

                setSubscriptionDetails({
                    planType: planType.charAt(0).toUpperCase() + planType.slice(1),
                    status: 'active'
                });

                setIsProcessing(false);
            } catch (error) {
                console.error('Error processing payment success:', error);
                setError(error instanceof Error ? error.message : 'Failed to process payment');
                setIsProcessing(false);
            }
        };

        processPaymentSuccess();
    }, []);

    if (isProcessing) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md mx-auto">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                Processing Your Payment
                            </h2>
                            <p className="text-muted-foreground">
                                Please wait while we activate your subscription...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-center text-destructive">
                            Payment Processing Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="border-destructive">
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => onNavigate('pricing')}
                            >
                                Back to Pricing
                            </Button>
                            <Button 
                                className="flex-1"
                                onClick={() => onNavigate('dashboard')}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <CheckCircleIcon className="h-12 w-12 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Payment Successful!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {subscriptionDetails && (
                        <div className="bg-muted/30 rounded-lg p-4">
                            <h3 className="font-semibold text-foreground mb-3">
                                Subscription Details
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Plan:</span>
                                    <span className="font-medium text-foreground">
                                        {subscriptionDetails.planType}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className="font-medium text-green-600 capitalize">
                                        {subscriptionDetails.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h3 className="font-semibold text-foreground">What's Next?</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                Your subscription is now active
                            </li>
                            <li className="flex items-start">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                All premium features are unlocked
                            </li>
                            <li className="flex items-start">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                You can now save, export, and share your meetings
                            </li>
                            <li className="flex items-start">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                Receipt sent to your email address
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => onNavigate('pricing')}
                        >
                            View Plans
                        </Button>
                        <Button 
                            className="flex-1"
                            onClick={() => onNavigate('dashboard')}
                        >
                            Start Creating Meetings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuccessPage;
