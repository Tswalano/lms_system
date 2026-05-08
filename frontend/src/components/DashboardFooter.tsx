import React from 'react';

interface FooterLink {
    name: string;
    href: string;
    external?: boolean;
}

interface DashboardFooterProps {
    companyName?: string;
    links?: FooterLink[];
    className?: string;
    showYear?: boolean;
    copyrightText?: string;
}

const DashboardFooter: React.FC<DashboardFooterProps> = ({
    companyName = "Your Company Name",
    links = [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Support', href: '/support' },
        { name: 'Contact', href: '/contact' }
    ],
    className = "",
    showYear = true,
    copyrightText
}) => {
    const currentYear = new Date().getFullYear();

    const defaultCopyrightText = `© ${showYear ? `${currentYear} ` : ''}${companyName}. All rights reserved.`;
    const displayCopyrightText = copyrightText || defaultCopyrightText;

    return (
        <footer className={`relative z-10 py-6 px-4 lg:px-8 ${className}`}>
            <div className="px-4 lg:px-16 mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Copyright Text - Left Side */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                        {displayCopyrightText}
                    </div>

                    {/* Links - Right Side */}
                    {links.length > 0 && (
                        <div className="flex items-center gap-6 order-1 sm:order-2">
                            {links.map((link, index) => (
                                <React.Fragment key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 hover:underline"
                                        target={link.external ? '_blank' : undefined}
                                        rel={link.external ? 'noopener noreferrer' : undefined}
                                    >
                                        {link.name}
                                    </a>
                                    {index < links.length - 1 && (
                                        <span className="text-gray-300 dark:text-gray-600 select-none">•</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default DashboardFooter;