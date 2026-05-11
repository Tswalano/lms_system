import React, { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import AppBanners from './AppBanners';
import { Link } from 'react-router-dom';

interface DashboardLayoutProps {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    showSidebar?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
}

// Footer Component
const DashboardFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        { name: 'Terms of Service', href: '/terms-of-service' },
        { name: 'Support', href: '/support' }
    ];

    return (
        <footer className="relative z-10 py-6 px-4 lg:px-8">
            <div className="px-4 lg:px-16 mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Copyright Text - Left Side */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                        {currentYear} © Disraptor System. All rights reserved.
                    </div>

                    {/* Links - Right Side */}
                    <div className="flex items-center gap-6 order-1 sm:order-2">
                        {footerLinks.map((link, index) => (
                            <React.Fragment key={link.name}>
                                <Link
                                    to={link.href}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                                >
                                    {link.name}
                                </Link>
                                {index < footerLinks.length - 1 && (
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Main Dashboard Layout Component
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    className = "",
    contentClassName = "",
    showSidebar = true,
    showHeader = true,
    showFooter = true
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={`min-h-screen bg-gradient-to-br from-green-50/30 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-gray-950/30 dark:to-gray-950/30 transition-colors duration-200 ${className}`}>
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

            {/* Sidebar */}
            {showSidebar && (
                <Sidebar
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isCollapsed={isSidebarCollapsed}
                    setIsCollapsed={setIsSidebarCollapsed}
                />
            )}

            {/* Main Content Area */}
            <div className={`${showSidebar ? (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72') : ''} relative z-10 transition-all duration-300 ease-in-out flex flex-col min-h-screen`}>
                {/* Header */}
                {showHeader && (
                    <DashboardHeader />
                )}

                {/* App-wide alert banners */}
                banner
                <AppBanners />

                {/* Main Content - Flex grow to push footer down */}
                <main className={`flex-grow p-4 lg:p-8 ${contentClassName}`}>
                    <div className="px-4 lg:px-16 mx-auto space-y-8">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                {showFooter && <DashboardFooter />}
            </div>

            {/* Additional Floating Elements for Visual Interest */}
            <div className="absolute top-1/4 left-1/2 w-1 h-1 bg-green-300 rounded-full animate-ping opacity-50" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-emerald-300 rounded-full animate-pulse opacity-60" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce opacity-70" style={{ animationDelay: '4s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-teal-300 rounded-full animate-ping opacity-80" style={{ animationDelay: '5s' }}></div>
        </div>
    );
};

export default DashboardLayout;