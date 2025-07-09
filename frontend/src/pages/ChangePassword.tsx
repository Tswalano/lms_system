import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2, Shield, Key, ArrowLeft } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ChangePassword: React.FC = (): JSX.Element => {
    const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const { changePassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isForced = location.state?.forcedChange || false;
    const username = location.state?.username || "";
    const session = location.state?.session || "";

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) return "Password must be at least 8 characters long";
        if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter";
        if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number";
        if (!/(?=.*[!@#$%^&*])/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
        return null;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError("");

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const result = await changePassword(username, newPassword, session);

            if (result.success) {
                navigate("/", {
                    replace: true,
                    state: { passwordChanged: true }
                });

                toast.success("Password changed successfully", {
                    description: "You can now log in with your new password",
                });
            } else {
                setError(result.error || "Failed to change password. Please try again.");
            }
        } catch (err: unknown) {
            console.error("Change password error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-green-950 dark:to-cyan-950 flex">
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

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <div className="w-full h-full bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0">
                        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12">
                        <div className="mb-8">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-4">
                                Secure Your <span className="text-green-100">Account</span>
                            </h1>
                            <p className="text-green-100 text-lg leading-relaxed mb-8">
                                Update your password to keep your account safe and secure
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-6 max-w-md">
                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Enhanced Security</h3>
                                    <p className="text-sm text-green-100">Strong password requirements for protection</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Password Validation</h3>
                                    <p className="text-sm text-green-100">Real-time validation and requirements checking</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Secure Process</h3>
                                    <p className="text-sm text-green-100">Encrypted transmission and storage</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-20 left-20 w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-32 right-20 w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/3 left-16 w-1.5 h-1.5 bg-white/50 rounded-full animate-ping"></div>
                </div>
            </div>

            {/* Right Side - Change Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md">
                    {/* Password Change Card */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-cyan-500 rounded-2xl mb-4">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                                {isForced ? "Set New Password" : "Change Password"}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isForced
                                    ? "Please set a new password to continue"
                                    : "Update your password to keep your account secure"
                                }
                            </p>
                            <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mx-auto mt-4"></div>
                        </div>

                        {/* Form */}
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl">
                                    {error}
                                </div>
                            )}

                            {!isForced && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            placeholder="Enter your current password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                            required
                                            disabled={loading}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                            disabled={loading}
                                            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter your new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                        disabled={loading}
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                        disabled={loading}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            {/* <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Requirements:</p>
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className={`h-4 w-4 ${newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                                        <span className="text-gray-600 dark:text-gray-400">At least 8 characters</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className={`h-4 w-4 ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                        <span className="text-gray-600 dark:text-gray-400">One lowercase letter</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className={`h-4 w-4 ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                        <span className="text-gray-600 dark:text-gray-400">One uppercase letter</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className={`h-4 w-4 ${/(?=.*\d)/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                        <span className="text-gray-600 dark:text-gray-400">One number</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className={`h-4 w-4 ${/(?=.*[!@#$%^&*])/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                        <span className="text-gray-600 dark:text-gray-400">One special character (!@#$%^&*)</span>
                                    </div>
                                </div>
                            </div> */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    "Change Password"
                                )}
                            </button>

                            <div className="text-center">
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="inline-flex items-center text-sm text-green-600 hover:text-green-500 dark:text-green-400 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Back to Login
                                    </button>
                                </div>
                            </div>
                        </form>
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

export default ChangePassword;