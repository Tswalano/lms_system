import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, Lock, Key, Loader2, Shield, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
    const { forgotPassword, resetPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState<"request" | "verify" | "success">("request");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await forgotPassword(email);
            if (result.success) {
                setStep("verify");
                setSuccessMessage(result.message || "Verification code sent to your email");
            } else {
                setError(result.error || "Failed to send verification code");
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await resetPassword(email, code, newPassword);
            if (result.success) {
                setStep("success");
                setSuccessMessage(result.message || "Password reset successfully");
            } else {
                setError(result.error || "Failed to reset password");
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (step === "success") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-green-950 dark:to-emerald-950 flex">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-teal-200/30 dark:bg-teal-800/20 rounded-full blur-2xl"></div>
                </div>

                {/* Floating Animation Elements */}
                <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute bottom-32 right-16 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>

                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative">
                    <div className="w-full h-full bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
                        <div className="absolute inset-0">
                            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12">
                            <div className="mb-8">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-4xl font-bold text-white mb-4">
                                    Password <span className="text-green-200">Reset Complete</span>
                                </h1>
                                <p className="text-green-100 text-lg leading-relaxed mb-8">
                                    Your password has been successfully updated. You can now sign in with your new credentials.
                                </p>
                            </div>

                            {/* Success Features */}
                            <div className="space-y-6 max-w-md">
                                <div className="flex items-center space-x-4 text-white/90">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Secure Reset</h3>
                                        <p className="text-sm text-green-100">Your password was changed securely</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Success Card */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
                    <div className="w-full max-w-md">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                                    Success!
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {successMessage}
                                </p>
                                <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mt-4"></div>
                            </div>

                            <Link
                                to="/login"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "verify") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/30 dark:bg-blue-800/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-indigo-200/30 dark:bg-indigo-800/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full blur-3xl"></div>
                </div>

                {/* Floating Animation Elements */}
                <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute bottom-32 right-16 w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="absolute bottom-1/4 left-8 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>

                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative">
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
                        <div className="absolute inset-0">
                            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12">
                            <div className="mb-8">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                    <Key className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-4xl font-bold text-white mb-4">
                                    Almost <span className="text-purple-200">There!</span>
                                </h1>
                                <p className="text-purple-100 text-lg leading-relaxed mb-8">
                                    Check your email for the verification code and create your new secure password
                                </p>
                            </div>

                            {/* Verify Features */}
                            <div className="space-y-6 max-w-md">
                                <div className="flex items-center space-x-4 text-white/90">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Check Your Email</h3>
                                        <p className="text-sm text-purple-100">Verification code sent to {email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 text-white/90">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Create New Password</h3>
                                        <p className="text-sm text-purple-100">Choose a strong, secure password</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Verify Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
                    <div className="w-full max-w-md">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
                                    <Key className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
                                    Reset Password
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {successMessage || `Enter the code sent to ${email}`}
                                </p>
                                <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mt-4"></div>
                            </div>

                            <div className="space-y-6">
                                {error && (
                                    <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter verification code (try: 123456)"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="Enter new password (min 8 characters)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleResetPassword}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>

                                <div className="text-center">
                                    <button
                                        onClick={() => setStep("request")}
                                        className="inline-flex items-center text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Back to email entry
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Demo Info */}
                        <div className="mt-6 text-center">
                            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    <strong>Demo:</strong> Use code "123456"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/30 dark:bg-blue-800/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-indigo-200/30 dark:bg-indigo-800/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full blur-3xl"></div>
            </div>

            {/* Floating Animation Elements */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute bottom-32 right-16 w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="absolute bottom-1/4 left-8 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12">
                        <div className="mb-8">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <Mail className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-4">
                                Forgot Your <span className="text-blue-200">Password?</span>
                            </h1>
                            <p className="text-blue-100 text-lg leading-relaxed mb-8">
                                No worries! We'll help you reset your password quickly and securely
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-6 max-w-md">
                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Email Verification</h3>
                                    <p className="text-sm text-blue-100">Secure code sent to your email</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Quick Process</h3>
                                    <p className="text-sm text-blue-100">Reset your password in minutes</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Secure Reset</h3>
                                    <p className="text-sm text-blue-100">Bank-level security protection</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Request Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                                <span className="text-white font-bold text-xl">D</span>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Reset Password
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Enter your email address to reset your password
                            </p>
                            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mt-4"></div>
                        </div>

                        <div className="space-y-6">
                            {error && (
                                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleRequestReset}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Verification Code"
                                )}
                            </button>

                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back to login
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            &copy; {new Date().getFullYear()} Disraptor LMS. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;