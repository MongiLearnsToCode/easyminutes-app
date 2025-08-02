import React, { useState } from 'react';
import { CheckCircleIcon, LogoIcon } from '../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    
    const handleConfirmSelection = () => {
        // TODO: Implement subscription logic
        console.log(`Confirmed plan: ${selectedPlan}`);
        setIsDialogOpen(false);
        // Here you would redirect to payment flow or subscription setup
        alert(`Proceeding with ${selectedPlan}. Payment flow would be implemented here.`);
    };

    return (
        <div className="min-h-screen bg-brand-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="flex justify-center items-center mb-6">
                        <LogoIcon className="h-12 w-12 mr-4" />
                        <h1 className="text-4xl font-bold text-brand-secondary">
                            Choose Your Plan
                        </h1>
                    </div>
                    <p className="text-xl text-brand-muted max-w-3xl mx-auto leading-relaxed">
                        Transform your meetings with AI-powered minutes. Start with one free meeting, 
                        then choose the plan that fits your team's needs.
                    </p>
                    
                    {/* Free Trial Highlight */}
                    <div className="mt-8 max-w-md mx-auto">
                        <Alert className="border-brand-primary/20 bg-brand-primary/5">
                            <CheckCircleIcon className="h-4 w-4 text-brand-primary" />
                            <AlertDescription className="text-brand-secondary">
                                <div className="text-center">
                                    <div className="font-semibold text-brand-primary mb-1">
                                        Try 1 meeting absolutely free
                                    </div>
                                    <div className="text-sm text-brand-muted">
                                        Full features unlocked after subscription
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {pricingPlans.map((plan, index) => (
                        <Card 
                            key={plan.name}
                            className={`relative h-full transition-all duration-300 hover:shadow-xl ${
                                plan.isPopular 
                                    ? 'ring-2 ring-brand-primary shadow-xl scale-105' 
                                    : plan.isBestValue 
                                    ? 'ring-2 ring-green-500 shadow-lg' 
                                    : 'hover:scale-105'
                            }`}
                        >
                            {/* Popular/Best Value Badges */}
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-brand-primary text-white px-4 py-1 text-sm font-bold">
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
                                <CardTitle className="text-xl font-bold text-brand-secondary mb-2">
                                    {plan.name}
                                </CardTitle>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-brand-primary">
                                        {plan.price}
                                    </div>
                                    <div className="text-sm text-brand-muted">
                                        {plan.includedMeetings} meetings included
                                    </div>
                                    <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                        {plan.effectiveCost} per meeting
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-sm text-brand-muted mb-6 text-center italic">
                                    {plan.targetUser}
                                </p>

                                {/* Features List */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start">
                                            <CheckCircleIcon className="w-5 h-5 text-brand-primary mr-3 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-brand-secondary">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <Button
                                    variant={plan.buttonVariant}
                                    size="lg"
                                    className={`w-full font-semibold ${
                                        plan.isPopular 
                                            ? 'bg-brand-primary hover:bg-brand-primary/90 text-white' 
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
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
                    <h2 className="text-2xl font-bold text-brand-secondary text-center mb-8">
                        How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-brand-primary font-bold text-xl">1</span>
                            </div>
                            <h3 className="font-semibold text-brand-secondary mb-2">Try Free</h3>
                            <p className="text-sm text-brand-muted">
                                Start with 1 completely free meeting to experience our AI-powered minutes generation.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-brand-primary font-bold text-xl">2</span>
                            </div>
                            <h3 className="font-semibold text-brand-secondary mb-2">Subscribe to Save</h3>
                            <p className="text-sm text-brand-muted">
                                Full save, share, export, and autosave features unlock with any paid plan.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-brand-primary font-bold text-xl">3</span>
                            </div>
                            <h3 className="font-semibold text-brand-secondary mb-2">Scale as Needed</h3>
                            <p className="text-sm text-brand-muted">
                                Upgrade or downgrade anytime as your team's meeting frequency changes.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />
                
                {/* FAQ Section */}
                <div className="bg-brand-surface/50 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-brand-secondary text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-brand-secondary mb-2">
                                What happens after my free meeting?
                            </h3>
                            <p className="text-sm text-brand-muted">
                                You can view your generated minutes, but save, share, export, and autosave features require a subscription.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-secondary mb-2">
                                Can I change plans anytime?
                            </h3>
                            <p className="text-sm text-brand-muted">
                                Yes! Upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-secondary mb-2">
                                What if I exceed my meeting limit?
                            </h3>
                            <p className="text-sm text-brand-muted">
                                You can purchase additional meetings at the pay-as-you-go rate, or upgrade to a higher plan.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-secondary mb-2">
                                Do you offer annual discounts?
                            </h3>
                            <p className="text-sm text-brand-muted">
                                Yes! Contact us for annual billing options with significant discounts on all plans.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <h2 className="text-2xl font-bold text-brand-secondary mb-4">
                        Ready to Transform Your Meetings?
                    </h2>
                    <p className="text-brand-muted mb-8">
                        Start with your free meeting today. No credit card required.
                    </p>
                    <Button 
                        size="lg" 
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3"
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
                        <DialogTitle className="text-brand-secondary">Confirm Your Plan Selection</DialogTitle>
                        <DialogDescription className="text-brand-muted">
                            You've selected the <span className="font-semibold text-brand-primary">{selectedPlan}</span> plan.
                            {selectedPlan === 'Free Trial' 
                                ? ' You can start using the service immediately with no commitment.'
                                : ' You will be redirected to complete your subscription setup.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedPlan && (
                        <div className="py-4">
                            <div className="bg-brand-surface/30 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-brand-secondary">Plan:</span>
                                    <span className="font-semibold text-brand-primary">{selectedPlan}</span>
                                </div>
                                {pricingPlans.find(p => p.name === selectedPlan) && (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-brand-muted">Price:</span>
                                            <span className="text-sm font-medium">{pricingPlans.find(p => p.name === selectedPlan)?.price}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-brand-muted">Meetings:</span>
                                            <span className="text-sm font-medium">{pricingPlans.find(p => p.name === selectedPlan)?.includedMeetings}</span>
                                        </div>
                                    </>
                                )}
                            </div>
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
                            className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white"
                        >
                            {selectedPlan === 'Free Trial' ? 'Start Free Trial' : 'Continue to Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PricingPage;
