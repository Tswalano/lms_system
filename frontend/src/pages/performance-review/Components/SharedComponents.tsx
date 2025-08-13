import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ReviewRequest } from '../types/types';

export const BackButton = ({ onBack, text = "Back to Dashboard" }: {
    onBack: () => void;
    text?: string;
}) => {
    return (
        <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
            <ArrowLeft className="w-5 h-5" />
            {text}
        </button>
    );
};

export const PageHeader = ({ title, children }: {
    title: string;
    children?: React.ReactNode;
}) => {
    return (
        <div className="flex items-center justify-between mb-8" >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" > {title} </h1>
            {children}
        </div>
    );
};

export const StatusBadge = ({ status }: { status: ReviewRequest['status'] }) => {
    const statusClasses = {
        'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        'completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        'declined': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`
        }>
            {status.replace('-', ' ')}
        </span>
    );
};

export const EmptyState = ({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) => {
    return (
        <div className="text-center py-12" >
            <div className="text-gray-300 dark:text-gray-600 mx-auto mb-4 flex justify-center" >
                {icon}
            </div>
            < h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2" > {title} </h3>
            < p className="text-gray-400 dark:text-gray-500" > {description} </p>
        </div>
    );
};

export const StatCard = ({ title, value, icon, color, onClick }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'orange' | 'blue' | 'purple' | 'green';
    onClick?: () => void;
}) => {
    const colorClasses = {
        orange: 'bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400',
        blue: 'bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
        purple: 'bg-purple-100 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400',
        green: 'bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-400',
    };

    return (
        <div
            onClick={onClick}
            className={`p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' : ''
                }`
            }
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                {icon}
            </div>
            < div >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400" > {title} </p>
                < h3 className="text-2xl font-bold text-gray-900 dark:text-white" > {value} </h3>
            </div>
        </div>
    );
};

export const ActionCard = ({ title, description, icon, color, onClick }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple';
    onClick: () => void;
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    };

    return (
        <button
            onClick={onClick}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-left transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 w-full"
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colorClasses[color]}`}>
                {icon}
            </div>
            < h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" > {title} </h3>
            < p className="text-sm text-gray-600 dark:text-gray-400" > {description} </p>
        </button>
    );
};