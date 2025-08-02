import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, LogoIcon } from '../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { polarService } from '../services/polarService';
import { supabase } from '../services/dbService';
import { subscriptionService } from '../services/subscriptionService';
import { isSandboxMode, logDevInfo, POLAR_DEV_CONFIG } from '../config/polar-dev';

interface PricingPlan {
    name: string;
    price: string;
    includedMeetings: string;
    effectiveCost: string;
    targetUser: string;
    isPopular?: boolean;
    isBestValue?: boolean;
    features: string[];
    buttonText: string;
    buttonVariant: 'default' | 'outline' | 'secondary';
}

const PricingPage: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Log sandbox mode on component mount
    useEffect(() => {
        if (isSandboxMode()) {
            logDevInfo('PricingPage loaded in sandbox mode');
            console.log('🧪 Sandbox Mode Active - Test cards available:', POLAR_DEV_CONFIG.TEST_CARDS);
        }
    }, []);
    
    const pricingPlans: PricingPlan[] = [
        {
            name: 'One Time Only',
            price: '$6',
            includedMeetings: '1',
            effectiveCost: '$6.00',
            targetUser: 'Light users, testers',
            features: [
                '1 meeting transcription',
                'AI-powered minutes generation',
                'Basic export (PDF/Word)',
                'No monthly commitment'
            ],
            buttonText: 'Try Once',
            buttonVariant: 'outline'
        },
        {
            name: 'Starter',
            price: '$39/month',
            includedMeetings: '30',
            effectiveCost: '$1.30',
            targetUser: 'Small teams, ~1 meeting/day',
            features: [
                '30 meetings per month',
                'AI-powered minutes generation',
                'Full export capabilities',
                'Email sharing',
                'Basic support'
            ],
            buttonText: 'Get Started',
            buttonVariant: 'outline'
        },
        {
            name: 'Pro',
            price: '$99/month',
            includedMeetings: '100',
            effectiveCost: '$0.99',
            targetUser: 'Growing teams, multiple meetings/day',
            isPopular: true,
            features: [
                '100 meetings per month',
                'Advanced AI summarization',
                'Priority export & sharing',
                'Team collaboration tools',
                'Priority support',
                'Custom templates'
            ],
            buttonText: 'Most Popular Choice',
            buttonVariant: 'default'
        },
        {
            name: 'Enterprise',
            price: '$199/month',
            includedMeetings: 'Unlimited',
            effectiveCost: 'Best value',
            targetUser: 'Enterprises & high-frequency users',
            isBestValue: true,
            features: [
                'Unlimited meetings',
                'Enterprise AI features',
                'Advanced analytics',
                'Unlimited exports & sharing',
                'Dedicated support',
                'Custom integrations',
                'API access'
            ],
            buttonText: 'Best Value',
            buttonVariant: 'default'
        }
    ];

    const handlePlanSelect = (planName: string) => {
        setSelectedPlan(planName);
        setIsDialogOpen(true);
    };
    
    const handleConfirmSelection = async () => {
        if (!selectedPlan) return;
        
        setIsProcessing(true);
        setError(null);
        
        try {
            // Handle Free Trial separately
            if (selectedPlan === 'Free Trial') {
                logDevInfo('Starting free trial');
                setIsDialogOpen(false);
                // Navigate back to dashboard to start using the free trial
                return;
            }
            
            const user = await supabase.auth.getUser();
            if (!user.data.user) {
                throw new Error('User not authenticated');
            }
            
            const successUrl = window.location.origin + '?session_id=test_session_' + Date.now();
            const productPriceIdMap = {
                'One Time Only': import.meta.env.VITE_POLAR_PRICE_ONE_TIME || 'price_one_time',
                'Starter': import.meta.env.VITE_POLAR_PRICE_STARTER || 'price_starter',
                'Pro': import.meta.env.VITE_POLAR_PRICE_PRO || 'price_pro',
                'Enterprise': import.meta.env.VITE_POLAR_PRICE_ENTERPRISE || 'price_enterprise',
            };
            
            const productPriceId = productPriceIdMap[selectedPlan];
            if (!productPriceId) {
                throw new Error(`Product price ID not configured for plan: ${selectedPlan}`);
            }
            
            logDevInfo('Creating checkout session', {
                plan: selectedPlan,
                priceId: productPriceId,
                email: user.data.user.email,
                successUrl
            });
            
            const checkoutSession = await polarService.createCheckoutSession({
                product_price_id: productPriceId,
                success_url: successUrl,
                customer_email: user.data.user.email || '',
                customer_name: user.data.user.user_metadata?.full_name || 'Easy Minutes User',
                metadata: {
                    plan_name: selectedPlan,
                    user_id: user.data.user.id,
                    environment: isSandboxMode() ? 'sandbox' : 'production',
                }
            });
            
            logDevInfo('Checkout session created', checkoutSession);
            
            // Redirect to Polar checkout
            window.location.href = checkoutSession.url;
            
        } catch (error) {
            console.error('Error creating checkout session:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment process';
            setError(errorMessage);
            
            if (isSandboxMode()) {
                console.log('🚨 Sandbox Error Details:', {
                    error,
                    environment: import.meta.env.VITE_POLAR_ENVIRONMENT,
                    accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN ? 'Present' : 'Missing',
                    orgId: import.meta.env.VITE_POLAR_ORGANIZATION_ID ? 'Present' : 'Missing'
                });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12 sm:mb-16">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                            Choose Your Plan
                        </h1>
                    </div>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
                        Transform your meetings with AI-powered minutes. Start with one free meeting, 
                        then choose the plan that fits your team's needs.
                    </p>
                    
                    {/* Free Trial Highlight */}
                    <div className="mt-8 sm:mt-12 mb-4">
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl py-6 sm:py-8 px-4 sm:px-6 text-center">
                            <div className="flex flex-col sm:flex-row items-center justify-center mb-4 gap-3 sm:gap-0">
                                <div className="bg-primary/10 rounded-full p-3 sm:mr-4 flex-shrink-0">
                                    <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1 leading-tight">
                                        Try 1 Meeting Absolutely Free
                                    </h3>
                                    <p className="text-muted-foreground text-sm sm:text-base">
                                        Full features unlocked after subscription
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {pricingPlans.map((plan, index) => (
                        <Card 
                            key={plan.name}
                            className={`relative h-full transition-all duration-300 hover:shadow-xl ${
                                plan.isPopular 
                                    ? 'ring-2 ring-primary shadow-xl scale-105' 
                                    : plan.isBestValue 
                                    ? 'ring-2 ring-green-500 shadow-lg' 
                                    : 'hover:scale-105'
                            }`}
                        >
                            {/* Popular/Best Value Badges */}
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-bold">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}
                            {plan.isBestValue && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-green-500 text-white px-4 py-1 text-sm font-bold">
                                        Best Value
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-4">
                                <CardTitle className="text-xl font-bold text-foreground mb-2">
                                    {plan.name}
                                </CardTitle>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-primary">
                                        {plan.price}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {plan.includedMeetings} meetings included
                                    </div>
                                    <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                        {plan.effectiveCost} per meeting
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-sm text-muted-foreground mb-6 text-center italic">
                                    {plan.targetUser}
                                </p>

                                {/* Features List */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start">
                                            <CheckCircleIcon className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <Button
                                    variant={plan.buttonVariant}
                                    size="lg"
                                    className={`w-full font-semibold ${
                                        plan.isPopular 
                                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                                            : plan.isBestValue 
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : ''
                                    }`}
                                    onClick={() => handlePlanSelect(plan.name)}
                                >
                                    {plan.buttonText}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Implementation Flow Section */}
                <div className="bg-card rounded-2xl shadow-lg p-8 mb-16">
                    <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                        How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-primary font-bold text-xl">1</span>
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Try Free</h3>
                            <p className="text-sm text-muted-foreground">
                                Start with 1 completely free meeting to experience our AI-powered minutes generation.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-primary font-bold text-xl">2</span>
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Subscribe to Save</h3>
                            <p className="text-sm text-muted-foreground">
                                Full save, share, export, and autosave features unlock with any paid plan.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-primary font-bold text-xl">3</span>
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Scale as Needed</h3>
                            <p className="text-sm text-muted-foreground">
                                Upgrade or downgrade anytime as your team's meeting frequency changes.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />
                
                {/* FAQ Section */}
                <div className="bg-muted/30 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                What happens after my free meeting?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                You can view your generated minutes, but save, share, export, and autosave features require a subscription.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                Can I change plans anytime?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Yes! Upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                What if I exceed my meeting limit?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                You can purchase additional meetings at the pay-as-you-go rate, or upgrade to a higher plan.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                Do you offer annual discounts?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Yes! Contact us for annual billing options with significant discounts on all plans.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Ready to Transform Your Meetings?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Start with your free meeting today. No credit card required.
                    </p>
                    <Button 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                        onClick={() => handlePlanSelect('Free Trial')}
                    >
                        Start Your Free Meeting
                    </Button>
                </div>
            </div>
            
            {/* Plan Selection Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Confirm Your Plan Selection</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            You've selected the <span className="font-semibold text-primary">{selectedPlan}</span> plan.
                            {selectedPlan === 'Free Trial' 
                                ? ' You can start using the service immediately with no commitment.'
                                : ' You will be redirected to complete your subscription setup.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedPlan && (
                        <div className="py-4">
                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-foreground">Plan:</span>
                                    <span className="font-semibold text-primary">{selectedPlan}</span>
                                </div>
                                {pricingPlans.find(p => p.name === selectedPlan) && (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">Price:</span>
                                            <span className="text-sm font-medium text-foreground">{pricingPlans.find(p => p.name === selectedPlan)?.price}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Meetings:</span>
                                            <span className="text-sm font-medium text-foreground">{pricingPlans.find(p => p.name === selectedPlan)?.includedMeetings}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Error Display */}
                    {error && (
                        <Alert className="border-destructive">
                            <AlertDescription className="text-destructive">
                                {error}
                                {isSandboxMode() && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        💡 Running in sandbox mode - check console for detailed error info
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Sandbox Test Card Info */}
                    {isSandboxMode() && selectedPlan !== 'Free Trial' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start">
                                <div className="text-blue-600 text-xs font-medium mb-1">🧪 SANDBOX MODE</div>
                            </div>
                            <p className="text-xs text-blue-700 mb-2">
                                Use test card: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code>
                            </p>
                            <p className="text-xs text-blue-600">
                                Any future date and any 3-digit CVC will work.
                            </p>
                        </div>
                    )}
                    
                    <DialogFooter className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmSelection}
                            disabled={isProcessing}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedPlan === 'Free Trial' ? 'Start Free Trial' : isProcessing ? 'Processing...' : 'Continue to Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PricingPage;
