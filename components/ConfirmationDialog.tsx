import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrashIcon, ExclamationTriangleIcon, SpinnerIcon } from '../constants';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'default' | 'warning';
    isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false
}) => {
    const handleConfirm = () => {
        onConfirm();
        if (!isLoading) {
            onClose();
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'destructive':
                return <TrashIcon className="w-6 h-6 text-destructive" />;
            case 'warning':
                return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'destructive':
                return {
                    iconBg: 'bg-destructive/10',
                    titleColor: 'text-foreground',
                    descriptionColor: 'text-muted-foreground'
                };
            case 'warning':
                return {
                    iconBg: 'bg-yellow-50 dark:bg-yellow-950',
                    titleColor: 'text-foreground',
                    descriptionColor: 'text-muted-foreground'
                };
            default:
                return {
                    iconBg: 'bg-primary/10',
                    titleColor: 'text-foreground',
                    descriptionColor: 'text-muted-foreground'
                };
        }
    };

    const styles = getVariantStyles();
    const icon = getIcon();

    return (
        <Dialog open={isOpen} onOpenChange={!isLoading ? onClose : undefined}>
            <DialogContent className="sm:max-w-md rounded-xl shadow-lg" showCloseButton={!isLoading}>
                <DialogHeader className="text-center sm:text-left">
                    {icon && (
                        <div className={`mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} mb-4`}>
                            {icon}
                        </div>
                    )}
                    <DialogTitle className={`text-xl font-semibold leading-6 ${styles.titleColor}`}>
                        {title}
                    </DialogTitle>
                    <DialogDescription className={`mt-2 text-sm leading-relaxed ${styles.descriptionColor}`}>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-3 sm:gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none h-10 px-6"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none h-10 px-6 min-w-[100px]"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 mr-2" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
