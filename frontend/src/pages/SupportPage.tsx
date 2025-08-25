import React, { useState } from 'react';
import {
    Headphones,
    Mail,
    Phone,
    MapPin,
    Clock,
    MessageSquare,
    Send,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

const SupportPage: React.FC = () => {
    // const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        category: '',
        priority: 'medium',
        message: ''
    });

    const supportChannels = [
        {
            icon: Mail,
            title: "Email Support",
            description: "Get help via email with detailed responses",
            contact: "support@lms-disraptor.co.za",
            responseTime: "Within 24 hours",
            availability: "24/7",
            color: "from-blue-500 to-blue-600"
        },
        {
            icon: Phone,
            title: "Phone Support",
            description: "Speak directly with our support team",
            contact: "+27 11 123 4567",
            responseTime: "Immediate",
            availability: "Mon-Fri 8AM-6PM SAST",
            color: "from-green-500 to-green-600"
        },
        {
            icon: MessageSquare,
            title: "Live Chat",
            description: "Chat support for quick questions",
            contact: "Available in the system",
            responseTime: "Within 5 minutes",
            availability: "Mon-Fri 8AM-8PM SAST",
            color: "from-purple-500 to-purple-600"
        }
    ];

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted:', formData);
        // Reset form or show success message
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className=" mb-8">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                            <Headphones className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Support Center</h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400">We're here to help you succeed</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">System Status: Operational</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">All systems running normally</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>Average response time: 2.3 hours</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Channels */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Get in Touch</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {supportChannels.map((channel, index) => {
                            const IconComponent = channel.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="text-center">
                                        <div className={`w-16 h-16 bg-gradient-to-br ${channel.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                            <IconComponent className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                            {channel.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                                            {channel.description}
                                        </p>
                                        <div className="space-y-2">
                                            <a
                                                href={channel.icon === Mail ? `mailto:${channel.contact}` : channel.icon === Phone ? `tel:${channel.contact}` : '#'}
                                                className="block font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {channel.contact}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contact Form */}
                <div className="mb-12">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Submit a Support Request</h2>
                            <p className="text-gray-600 dark:text-gray-400">Fill out the form below and we'll get back to you as soon as possible</p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Brief description of your issue"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select a category</option>
                                        <option value="user-management">User Management</option>
                                        <option value="system-config">System Configuration</option>
                                        <option value="document-management">Document Management</option>
                                        <option value="data-reports">Data & Reports</option>
                                        <option value="security">Security & Privacy</option>
                                        <option value="technical">Technical Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Please provide detailed information about your issue or question..."
                                ></textarea>
                            </div>

                            <div className="text-center">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
                                >
                                    <Send className="w-4 h-4" />
                                    Submit Support Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Contact Information</h2>
                        <p className="text-gray-600 dark:text-gray-400">Multiple ways to reach our support team</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Email Support</h3>
                            <a
                                href="mailto:support@lms-disraptor.co.za"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                            >
                                support@lms-disraptor.co.za
                            </a>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Phone className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Phone Support</h3>
                            <a
                                href="tel:+27111234567"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                            >
                                +27 11 123 4567
                            </a>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Office Address</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Johannesburg<br />South Africa
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Business Hours</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Mon-Fri: 8AM-6PM<br />SAST
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-blue-200 dark:border-blue-800">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                <span className="font-semibold text-gray-800 dark:text-gray-200">Emergency Support</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                For critical system outages or security incidents
                            </p>
                            <a
                                href="mailto:emergency@lms-disraptor.co.za"
                                className="text-red-600 dark:text-red-400 hover:underline font-medium"
                            >
                                emergency@lms-disraptor.co.za
                            </a>
                        </div>
                    </div>
                </div>

                {/* Service Level Agreement */}
                <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Service Level Agreement</h2>
                        <p className="text-gray-600 dark:text-gray-400">Our commitment to response times</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 border border-gray-200 dark:border-slate-600 rounded-xl">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">&lt; 1 hour</div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Urgent</div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">System down, critical bugs</p>
                        </div>
                        <div className="text-center p-4 border border-gray-200 dark:border-slate-600 rounded-xl">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">&lt; 4 hours</div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">High</div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Major functionality issues</p>
                        </div>
                        <div className="text-center p-4 border border-gray-200 dark:border-slate-600 rounded-xl">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">&lt; 24 hours</div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Medium</div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">General questions, minor issues</p>
                        </div>
                        <div className="text-center p-4 border border-gray-200 dark:border-slate-600 rounded-xl">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">&lt; 48 hours</div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Low</div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Feature requests, documentation</p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            <strong>Note:</strong> Response times are measured during business hours (Mon-Fri, 8AM-6PM SAST).
                            Emergency issues receive 24/7 attention regardless of business hours.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;