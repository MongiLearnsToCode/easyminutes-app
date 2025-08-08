import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BlockingProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

const BlockingProModal: React.FC<BlockingProModalProps> = ({ isOpen, onClose, onSubscribe }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Free Generations Limit Reached</DialogTitle>
          <DialogDescription>
            You have used all your free generations for this session. Please subscribe to the Pro plan to continue generating meeting minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubscribe}>Subscribe to Pro</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockingProModal;