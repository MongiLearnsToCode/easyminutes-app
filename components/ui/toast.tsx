import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const getToastIcon = (type: ToastType) => {
    const iconProps = { className: "w-5 h-5 flex-shrink-0" };
    switch (type) {
        case 'success':
            return <CheckCircle2 {...iconProps} className={`${iconProps.className} text-green-500`} />;
        case 'error':
            return <XCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
        case 'warning':
            return <AlertTriangle {...iconProps} className={`${iconProps.className} text-amber-500`} />;
        case 'info':
            return <Info {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    }
};

const getToastStyles = (type: ToastType) => {
    switch (type) {
        case 'success':
            return 'border-green-200 bg-green-50 text-green-800';
        case 'error':
            return 'border-red-200 bg-red-50 text-red-800';
        case 'warning':
            return 'border-amber-200 bg-amber-50 text-amber-800';
        case 'info':
            return 'border-blue-200 bg-blue-50 text-blue-800';
    }
};

const ToastItem: React.FC<{
    toast: Toast;
    onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(() => {
                handleRemove();
            }, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, handleRemove]);

    const handleRemove = useCallback(() => {
        setIsRemoving(true);
        setTimeout(() => {
            onRemove(toast.id);
        }, 200); // Match exit animation duration
    }, [toast.id, onRemove]);

    return (
        <div
            className={`
                relative flex items-start p-4 rounded-lg border shadow-lg max-w-md w-full
                transition-all duration-200 ease-in-out transform
                ${getToastStyles(toast.type)}
                ${isVisible && !isRemoving 
                    ? 'translate-x-0 opacity-100 scale-100' 
                    : 'translate-x-full opacity-0 scale-95'
                }
            `}
        >
            <div className="flex items-start space-x-3 flex-1">
                {getToastIcon(toast.type)}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold">{toast.title}</h4>
                    {toast.message && (
                        <p className="text-sm mt-1 opacity-90">{toast.message}</p>
                    )}
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="text-sm font-medium underline hover:no-underline mt-2 focus:outline-none"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
            </div>
            <button
                onClick={handleRemove}
                className="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
            <div className="space-y-2 pointer-events-auto">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onRemove={removeToast}
                    />
                ))}
            </div>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = {
            ...toast,
            id,
            duration: toast.duration ?? 4000, // Default 4 seconds
        };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'success', title, message, duration });
    }, [addToast]);

    const error = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'error', title, message, duration });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'warning', title, message, duration });
    }, [addToast]);

    const info = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'info', title, message, duration });
    }, [addToast]);

    const value = {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};
