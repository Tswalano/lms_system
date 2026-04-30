import { useState, useEffect } from "react";
import { ArrowRight, Calendar, Clock, Users, Shield, CheckCircle, Bell, BarChart3, FileText, Zap, Sun, Moon } from "lucide-react";

const LandingPage: React.FC = (): JSX.Element => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    // Initialize dark mode from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const features = [
        {
            icon: Calendar,
            title: "Easy Leave Requests",
            description: "Submit and track leave applications in just a few clicks with our intuitive interface."
        },
        {
            icon: Clock,
            title: "Real-time Approval",
            description: "Instant notifications and quick approval workflows keep everything moving smoothly."
        },
        {
            icon: Users,
            title: "Team Visibility",
            description: "Keep your team informed and on the same page with real-time visibility of leave requests."
        },
        {
            icon: Shield,
            title: "Secure & Compliant",
            description: "Enterprise-grade security with full compliance to protect your sensitive data."
        },
        {
            icon: Bell,
            title: "Smart Notifications",
            description: "Stay updated with intelligent notifications that keep you informed without overwhelming you."
        },
        {
            icon: BarChart3,
            title: "Analytics & Reports",
            description: "Gain insights into leave patterns and workforce planning with comprehensive reporting."
        }
    ];

    const benefits = [
        "Reduce administrative overhead by up to 80%",
        "Eliminate paper-based processes completely",
        "Improve employee satisfaction with self-service",
        "Ensure compliance with labor regulations",
        "Get real-time visibility into team availability",
        "Streamline approval workflows across departments"
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-green-950 dark:to-cyan-950">
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

            {/* Navigation */}
            <nav className="relative z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <img
                                src="favicon.png"
                                alt="Disraptor Logo"
                                className="h-8 w-8 object-contain"
                            />
                            <span className="text-xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                                Disraptor LMS
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                Features
                            </a>
                            <a href="#benefits" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                Benefits
                            </a>
                            <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                About
                            </a>
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle dark mode"
                            >
                                {isDarkMode ? (
                                    <Sun className="w-5 h-5 text-yellow-500" />
                                ) : (
                                    <Moon className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                            <a
                                href="/login"
                                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                Sign In
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300"
                        >
                            <div className="w-6 h-6 flex flex-col justify-center">
                                <span className={`block h-0.5 w-6 bg-current transform transition ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
                                <span className={`block h-0.5 w-6 bg-current transform transition ${isMenuOpen ? 'opacity-0' : 'my-1'}`}></span>
                                <span className={`block h-0.5 w-6 bg-current transform transition ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
                            </div>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden py-4 border-t border-white/20 dark:border-slate-700/50">
                            <div className="flex flex-col space-y-4">
                                <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                    Features
                                </a>
                                <a href="#benefits" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                    Benefits
                                </a>
                                <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                    About
                                </a>
                                <button
                                    onClick={toggleDarkMode}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors self-start"
                                    aria-label="Toggle dark mode"
                                >
                                    {isDarkMode ? (
                                        <>
                                            <Sun className="w-5 h-5 text-yellow-500" />
                                            <span className="text-gray-700 dark:text-gray-300">Light Mode</span>
                                        </>
                                    ) : (
                                        <>
                                            <Moon className="w-5 h-5 text-gray-600" />
                                            <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                                        </>
                                    )}
                                </button>
                                <a
                                    href="/login"
                                    className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 w-full"
                                >
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center mb-6">
                                <div className="w-20 h-20 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <Calendar className="w-10 h-10 text-green-600" />
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                                Streamline Your
                                <span className="block bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                                    Leave Management
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8 max-w-3xl mx-auto">
                                Transform your workforce management with Disraptor LMS - the modern solution for leave requests, approvals, and team coordination that puts control back in your hands.
                            </p>
                            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mx-auto mb-12"></div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href="/login"
                                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-lg"
                            >
                                Get Started Today
                                <ArrowRight className="w-5 h-5" />
                            </a>
                            <a
                                href="#features"
                                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                            Powerful Features for
                            <span className="block bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                                Modern Teams
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Everything you need to manage leave requests efficiently and keep your team running smoothly.
                        </p>
                        <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mx-auto mt-6"></div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="group">
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl border border-white/20 dark:border-slate-700/50 p-8 transition-all duration-300 hover:scale-105">
                                    <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="relative z-10 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Why Choose
                                <span className="block bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                                    Disraptor LMS?
                                </span>
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                Join thousands of organizations who have transformed their leave management processes with our comprehensive solution.
                            </p>
                            <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mb-8"></div>

                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-1">
                                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-lg">
                                            {benefit}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 rounded-3xl p-8 shadow-2xl">
                                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">Process requests in seconds</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                <Shield className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Secure</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">Enterprise-grade security</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Compliant</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">Meet all regulations</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Collaborative</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">Keep teams aligned</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="relative z-10 py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                            About
                            <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent"> Disraptor LMS</span>
                        </h2>
                        <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mx-auto mb-8"></div>
                        <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
                            Transforming workforce management through innovative technology and user-centered design.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                        <div className="space-y-6">
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-8">
                                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                                    <Calendar className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                    To revolutionize leave management by eliminating administrative burden and creating seamless experiences for employees, managers, and HR teams alike.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-8">
                                <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-green-500 rounded-xl flex items-center justify-center mb-6">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                    A world where managing time off is effortless, transparent, and empowering for organizations of all sizes, fostering better work-life balance and productivity.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Core Values */}
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Core Values</h3>
                        <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mx-auto mb-12"></div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Simplicity</h4>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Complex processes made simple through intuitive design and thoughtful user experience.
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Security</h4>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Enterprise-grade security protecting your most sensitive workforce data with uncompromising standards.
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Bell className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Transparency</h4>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Clear communication and real-time visibility ensuring everyone stays informed and aligned.
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Innovation</h4>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Continuously evolving with cutting-edge technology to meet tomorrow's workforce challenges.
                            </p>
                        </div>
                    </div>

                    {/* What Makes Us Different */}
                    {/* <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 rounded-3xl p-12 shadow-2xl">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-white mb-6">What Makes Disraptor LMS Different?</h3>
                            <div className="w-16 h-1 bg-white/30 rounded-full mx-auto"></div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
                                    <FileText className="w-12 h-12 text-white mx-auto mb-4" />
                                    <h4 className="text-xl font-semibold text-white mb-3">Built for Modern Teams</h4>
                                    <p className="text-green-100 leading-relaxed">
                                        Designed from the ground up for today's hybrid and remote work environments with mobile-first thinking.
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
                                    <Clock className="w-12 h-12 text-white mx-auto mb-4" />
                                    <h4 className="text-xl font-semibold text-white mb-3">Lightning Fast Setup</h4>
                                    <p className="text-green-100 leading-relaxed">
                                        Get up and running in minutes, not months. Our streamlined onboarding process gets your team productive immediately.
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
                                    <Users className="w-12 h-12 text-white mx-auto mb-4" />
                                    <h4 className="text-xl font-semibold text-white mb-3">Human-Centered Design</h4>
                                    <p className="text-green-100 leading-relaxed">
                                        Every feature is crafted with the end user in mind, ensuring adoption is natural and engagement is high.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <p className="text-xl text-white leading-relaxed max-w-4xl mx-auto">
                                Disraptor LMS isn't just another software solution – it's a complete transformation of how organizations think about leave management. We've reimagined every aspect of the process to create something that truly works for everyone involved.
                            </p>
                        </div>
                    </div> */}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 rounded-3xl p-12 shadow-2xl">
                        <h2 className="text-4xl font-bold text-white mb-6">
                            Ready to Transform Your Leave Management?
                        </h2>
                        <p className="text-xl text-green-100 mb-8 leading-relaxed">
                            Join the organizations already using Disraptor LMS to streamline their workforce management.
                        </p>
                        <a
                            href="/login"
                            className="inline-flex items-center gap-3 bg-white text-green-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg hover:scale-105"
                        >
                            Get Started Now
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center space-x-3 mb-4 md:mb-0">
                            <img
                                src="favicon.png"
                                alt="Disraptor Logo"
                                className="h-8 w-8 object-contain"
                            />
                            <span className="text-lg font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                                Disraptor LMS
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            &copy; {new Date().getFullYear()} Disraptor LMS. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;