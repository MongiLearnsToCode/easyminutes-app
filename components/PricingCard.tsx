import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, XCircleIcon } from '../constants';
import { Badge } from '@/components/ui/badge';

interface PricingCardProps {
  planName: string;
  price: string;
  priceDescription: string;
  features: { text: string; included: boolean; description?: string }[];
  isCurrentPlan: boolean;
  onSelectPlan: () => void;
  buttonText: string;
  isRecommended?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ planName, price, priceDescription, features, isCurrentPlan, onSelectPlan, buttonText, isRecommended }) => {
  return (
    <div className={`border rounded-2xl p-8 flex flex-col relative transition-all duration-300 hover:shadow-xl ${isCurrentPlan ? 'border-primary ring-2 ring-primary' : 'border-border'} ${isRecommended ? 'shadow-xl' : ''}`}>
        {isRecommended && (
            <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-sm font-bold">
                Recommended
            </Badge>
        )}
      <h3 className="text-2xl font-bold text-center">{planName}</h3>
      <p className="mt-4 text-center text-4xl font-bold">{price}</p>
      <p className="text-muted-foreground text-center">{priceDescription}</p>
      <ul className="mt-8 space-y-4 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            {feature.included ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
            )}
            <span className="text-sm">{feature.text}</span>
            {feature.description && <span className="text-sm text-muted-foreground ml-2">{`(${feature.description})`}</span>}
          </li>
        ))}
      </ul>
      <Button onClick={onSelectPlan} className="mt-8 w-full" disabled={isCurrentPlan} variant={isRecommended ? 'default' : 'outline'}>
        {isCurrentPlan ? 'Current Plan' : buttonText}
      </Button>
    </div>
  );
};

export default PricingCard;
