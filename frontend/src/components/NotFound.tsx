import React, { useEffect } from 'react';
import { Search, Home, ArrowLeft, MapPin, HelpCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NotFoundProps {
    onGoHome?: () => void;
    onSearch?: () => void;
    showQuickLinks?: boolean;
    customMessage?: string;
}

const NotFound: React.FC<NotFoundProps> = ({
    customMessage
}) => {
    const location = useLocation();

    useEffect(() => {
        console.error(
            "404 Error: User attempted to access non-existent route:",
            location.pathname
        );
    }, [location.pathname]);

    const handleGoBack = (): void => {
        window.history.back();
    };

    const handleSupportAction = (action: 'contact' | 'report' | 'help'): void => {
        switch (action) {
            case 'contact':
                console.log('Open contact support');
                break;
            case 'report':
                console.log('Open report issue');
                break;
            case 'help':
                console.log('Open help center');
                break;
            default:
                console.warn('Unknown support action:', action);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-green-950 dark:to-cyan-950 flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-teal-200/30 dark:bg-teal-800/20 rounded-full blur-3xl"></div>
            </div>

            {/* Floating Animation Elements */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute bottom-32 right-16 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="absolute bottom-1/4 left-8 w-2 h-2 bg-teal-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                {/* Main Card */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-12">

                    {/* 404 Illustration */}
                    <div className="mb-8">
                        <div className="relative inline-flex items-center justify-center">
                            {/* Large 404 Text */}
                            <div className="relative">
                                <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent leading-none">
                                    404
                                </h1>

                                {/* Floating Search Icon */}
                                <div className="absolute top-4 -right-8 w-16 h-16 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                                    <Search className="w-8 h-8 text-white" />
                                </div>

                                {/* Lost Map Pin */}
                                <div className="absolute bottom-2 -left-6 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>

                                {/* Question Mark */}
                                <div className="absolute top-8 left-8 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-md animate-bounce" style={{ animationDelay: '1s' }}>
                                    <HelpCircle className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 mb-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                                Oops! Page Not Found
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mx-auto mb-6"></div>
                        </div>

                        <div className="space-y-4 max-w-2xl mx-auto">
                            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                                {customMessage || "The page you're looking for seems to have wandered off into the digital wilderness"}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                Don't worry though! Even the best explorers sometimes take a wrong turn. Let's get you back on track with some helpful options below.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 group"
                            aria-label="Navigate to home page"
                        >
                            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Go Home</span>
                        </Link>

                        <button
                            onClick={handleGoBack}
                            className="bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 border border-gray-200 dark:border-slate-600 group"
                            aria-label="Go back to previous page"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Go Back</span>
                        </button>
                    </div>

                    {/* Help Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-slate-700/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Still lost? We're here to help!
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <button
                                onClick={() => handleSupportAction('contact')}
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium"
                            >
                                Contact Support
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <button
                                onClick={() => handleSupportAction('report')}
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium"
                            >
                                Report Issue
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <button
                                onClick={() => handleSupportAction('help')}
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium"
                            >
                                Help Center
                            </button>
                        </div>
                    </div>
                </div>

                {/* Brand Footer */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date().getFullYear()} &copy; Disraptor Systems. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Additional Floating Elements for Visual Interest */}
            <div className="absolute top-1/4 left-1/2 w-1 h-1 bg-green-300 rounded-full animate-ping opacity-50" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-emerald-300 rounded-full animate-pulse opacity-60" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce opacity-70" style={{ animationDelay: '4s' }}></div>
        </div>
    );
};

export default NotFound;