import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isLoading = false,
    type = 'danger'
}) => {
    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'text-red-500',
                    button: 'bg-red-600 hover:bg-red-700',
                    iconBg: 'from-red-500 to-red-600'
                };
            case 'warning':
                return {
                    icon: 'text-yellow-500',
                    button: 'bg-yellow-600 hover:bg-yellow-700',
                    iconBg: 'from-yellow-500 to-yellow-600'
                };
            case 'info':
                return {
                    icon: 'text-blue-500',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    iconBg: 'from-blue-500 to-blue-600'
                };
            default:
                return {
                    icon: 'text-red-500',
                    button: 'bg-red-600 hover:bg-red-700',
                    iconBg: 'from-red-500 to-red-600'
                };
        }
    };

    const styles = getTypeStyles();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-600/50 overflow-hidden">

                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${styles.iconBg} rounded-2xl flex items-center justify-center`}>
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30 rounded-b-2xl">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-2xl disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2 ${styles.button} text-white font-medium rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ConfirmationModal;