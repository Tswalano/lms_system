import React from 'react';
import { FileText, Calendar, Shield, Users, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
    const lastUpdated = "January 15, 2025";
    const effectiveDate = "January 1, 2025";

    const sections = [
        {
            title: "1. Acceptance of Terms",
            icon: CheckCircle,
            content: [
                "By accessing and using the Disraptor Employee Management System (EMS), you accept and agree to be bound by the terms and provision of this agreement.",
                "If you do not agree to abide by the above, please do not use this service.",
                "These terms apply to all users of the system, including employees, administrators, and managers."
            ]
        },
        {
            title: "2. Use License",
            icon: Scale,
            content: [
                "Permission is granted to temporarily access Disraptor EMS for personal, non-commercial transitory viewing only.",
                "This is the grant of a license, not a transfer of title, and under this license you may not:",
                "• Modify or copy the materials",
                "• Use the materials for any commercial purpose or for any public display",
                "• Attempt to reverse engineer any software contained in Disraptor EMS",
                "• Remove any copyright or other proprietary notations from the materials"
            ]
        },
        {
            title: "3. User Accounts and Responsibilities",
            icon: Users,
            content: [
                "Users are responsible for maintaining the confidentiality of their login credentials.",
                "You agree to accept responsibility for all activities that occur under your account.",
                "You must notify us immediately of any unauthorized use of your account.",
                "Users must provide accurate and complete information when creating accounts.",
                "Sharing of login credentials is strictly prohibited and may result in account suspension."
            ]
        },
        {
            title: "4. Data Privacy and Security",
            icon: Shield,
            content: [
                "We are committed to protecting your personal and professional data.",
                "All employee data is encrypted and stored securely in compliance with applicable data protection laws.",
                "We do not sell, trade, or rent your personal information to third parties.",
                "Data retention policies are in place to ensure information is kept only as long as necessary.",
                "Users have the right to request access to, correction of, or deletion of their personal data."
            ]
        },
        {
            title: "5. System Availability",
            icon: AlertTriangle,
            content: [
                "We strive to maintain 99.9% system uptime, but cannot guarantee uninterrupted service.",
                "Scheduled maintenance will be communicated in advance when possible.",
                "We are not liable for any downtime or service interruptions beyond our reasonable control.",
                "Emergency maintenance may be performed without prior notice when necessary for security or stability."
            ]
        },
        {
            title: "6. Prohibited Uses",
            icon: AlertTriangle,
            content: [
                "Users may not use the system for any unlawful purpose or to solicit others to engage in unlawful acts.",
                "Harassment, abuse, or discrimination of any kind is strictly prohibited.",
                "Users may not attempt to gain unauthorized access to other user accounts or system components.",
                "Distribution of malware, viruses, or any other malicious code is prohibited.",
                "Users may not interfere with or disrupt the system or servers connected to the system."
            ]
        },
        {
            title: "7. Intellectual Property",
            icon: FileText,
            content: [
                "All content, features, and functionality of Disraptor EMS are owned by Disraptor Technologies.",
                "This includes but is not limited to text, graphics, logos, icons, images, audio clips, and software.",
                "Users may not reproduce, distribute, modify, create derivative works of, or publicly display any content without express written permission.",
                "User-generated content remains the property of the user, but grants us license to use it within the system."
            ]
        },
        {
            title: "8. Limitation of Liability",
            icon: Scale,
            content: [
                "In no event shall Disraptor Technologies be liable for any damages arising out of the use or inability to use the system.",
                "This includes but is not limited to direct, indirect, incidental, punitive, and consequential damages.",
                "Our total liability shall not exceed the amount paid by the user for the service in the preceding 12 months.",
                "Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for damages."
            ]
        },
        {
            title: "9. Service Modifications",
            icon: Calendar,
            content: [
                "We reserve the right to modify or discontinue the service at any time with or without notice.",
                "We shall not be liable to any user or third party for any modification, suspension, or discontinuance of the service.",
                "Major changes to functionality will be communicated to users in advance when possible.",
                "We may update these terms from time to time, and continued use constitutes acceptance of the updated terms."
            ]
        },
        {
            title: "10. Termination",
            icon: AlertTriangle,
            content: [
                "We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these terms.",
                "Upon termination, your right to use the service will cease immediately.",
                "We will provide reasonable notice for termination due to non-payment or breach of terms.",
                "Users may terminate their accounts at any time by contacting support.",
                "Termination does not relieve users of any obligations incurred prior to termination."
            ]
        },
        {
            title: "11. Governing Law",
            icon: Scale,
            content: [
                "These terms and conditions are governed by and construed in accordance with the laws of South Africa.",
                "Any disputes relating to these terms shall be subject to the exclusive jurisdiction of the South African courts.",
                "If any provision of these terms is deemed invalid or unenforceable, the remainder shall continue in full force and effect.",
                "These terms constitute the entire agreement between you and Disraptor Technologies regarding the use of the service."
            ]
        },
        {
            title: "12. Contact Information",
            icon: Users,
            content: [
                "For questions about these Terms of Service, please contact us:",
                "• Email: legal@lms-disraptor.co.za",
                "• Support: support@lms-disraptor.co.za",
                "• Address: Disraptor Technologies, Johannesburg, South Africa",
                "We aim to respond to all legal inquiries within 5 business days."
            ]
        }
    ];

    return (
        <div className=" mb-8">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Terms of Service</h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400">Disraptor Employee Management System</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Last Updated: {lastUpdated}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Effective Date: {effectiveDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Please read these Terms of Service carefully before using the Disraptor EMS platform.
                            These terms govern your access to and use of our employee management system and related services.
                        </p>
                    </div>
                </div>

                {/* Terms Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => {
                        const IconComponent = section.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <IconComponent className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                                {section.title}
                                            </h2>
                                            <div className="space-y-3">
                                                {section.content.map((paragraph, pIndex) => (
                                                    <p
                                                        key={pIndex}
                                                        className="text-gray-600 dark:text-gray-400 leading-relaxed"
                                                    >
                                                        {paragraph}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            Legal Compliance
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                        By using Disraptor EMS, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        These terms are designed to protect both our users and our platform while ensuring compliance with applicable laws and regulations.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        For legal inquiries or clarifications, please contact our legal department at{" "}
                        <a href="mailto:legal@lms-disraptor.co.za" className="text-blue-600 dark:text-blue-400 hover:underline">
                            legal@lms-disraptor.co.za
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;