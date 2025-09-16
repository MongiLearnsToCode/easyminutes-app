import React from 'react';
import { Button } from './ui/button';
import { FileTextIcon } from '../constants';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <div className="text-center text-muted-foreground py-24 flex flex-col items-center">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        {icon || <FileTextIcon className="w-16 h-16 text-primary" />}
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
      <p className="max-w-md mx-auto">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.text}
        </Button>
      )}
    </div>
  );
};
