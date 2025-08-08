import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ProPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToPricing: () => void;
  featureLabel: string;
}

const ProPrompt: React.FC<ProPromptProps> = ({ isOpen, onClose, onGoToPricing, featureLabel }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Pro feature required</DialogTitle>
          <DialogDescription>
            {featureLabel} is available on the Pro plan. Subscribe to unlock this feature and more.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Not now</Button>
          <Button onClick={onGoToPricing}>View Pricing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProPrompt;
