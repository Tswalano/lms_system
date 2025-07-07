import React from 'react';
import { ShieldX, Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PermissionDenied: React.FC = () => {
    const handleBack = () => {
        // Replace with your navigation logic
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950 dark:via-orange-950 dark:to-yellow-950 flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-200/30 dark:bg-red-800/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-orange-200/30 dark:bg-orange-800/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-yellow-200/30 dark:bg-yellow-800/20 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto text-center">
                {/* Main Card */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-12">
                    {/* Icon Section */}
                    <div className="mb-8">
                        <div className="relative inline-flex items-center justify-center">
                            {/* Background Circle */}
                            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center relative">
                                    <ShieldX className="w-12 h-12 text-white" />

                                    {/* Animated Warning Icons */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                                        <AlertTriangle className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-4 -left-4 w-6 h-6 bg-red-200 dark:bg-red-800 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute -bottom-2 -right-6 w-4 h-4 bg-orange-200 dark:bg-orange-800 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
                                Access Denied
                            </h1>
                            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mx-auto mb-6"></div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                                Oops! You don't have permission to view this page
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                                This area is restricted and requires special access privileges. If you believe this is an error, please contact your administrator or try accessing a different section.
                            </p>
                        </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                        <Button
                            onClick={handleBack}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </Button>

                        <Button
                            onClick={handleGoHome}
                            variant="outline"
                            className="border-2 border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </Button>
                    </div>

                    {/* Help Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-slate-700/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Need help getting access?
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                Contact Support
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                Request Access
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                View FAQ
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Error Code: 403 • Forbidden Access
                    </p>
                </div>
            </div>

            {/* Floating Animation Elements */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-red-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute bottom-32 right-16 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></div>
        </div>
    );
};

export default PermissionDenied;