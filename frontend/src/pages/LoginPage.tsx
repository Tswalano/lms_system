import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowRight, Clock, Calendar, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage: React.FC = (): JSX.Element => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [username, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const { login, loading, isAuthenticated } = useAuth();
    const navigate: NavigateFunction = useNavigate();

    useEffect((): void => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError(null); // Reset error state

        try {
            const result = await login(username, password);


            if (result?.success) {
                return;
            }

            if (result?.challengeName === 'NEW_PASSWORD_REQUIRED') {
                navigate("/change-password", {
                    state: {
                        forcedChange: true,
                        tempPassword: result.tempPassword,
                        session: result.session,
                        username: result.username
                    }
                });
                return;
            }

            // Handle specific error cases
            if (result?.error) {
                setError(result.error);
            } else {
                setError("LoginPage failed. Please check your credentials and try again.");
            }

        } catch (err: unknown) {
            console.error("LoginPage error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred. Please try again."
            );
        }
    };

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value);
        setError(null); // Clear error when user starts typing
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value);
        setError(null); // Clear error when user starts typing
    };

    const togglePasswordVisibility = (): void => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-green-950 dark:to-cyan-950 flex">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-cyan-200/30 dark:bg-cyan-800/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-teal-200/30 dark:bg-teal-800/20 rounded-full blur-3xl"></div>
                <div className="absolute left-1/3 right-1/3 w-48 h-48 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl"></div>
            </div>

            {/* Floating Animation Elements */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute bottom-32 right-16 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="absolute bottom-1/4 left-8 w-2 h-2 bg-teal-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>

            {/* Left Side - Image/Branding */}
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
                                <Calendar className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-4">
                                Welcome to <span className="text-green-100">Disraptor LMS</span>
                            </h1>
                            <p className="text-green-100 text-lg leading-relaxed mb-8">
                                Streamline your leave requests and workforce management with ease
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-6 max-w-md">
                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Easy Leave Requests</h3>
                                    <p className="text-sm text-green-100">Submit and track leave applications in just a few clicks</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Real-time Approval</h3>
                                    <p className="text-sm text-green-100">Instant notifications and quick approval workflows</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-white/90">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Team Visibility</h3>
                                    <p className="text-sm text-green-100">Keep your team informed and on the same page with real-time visibility of leave requests</p>
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

            {/* Right Side - LoginPage Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md">
                    {/* LoginPage Card */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center mb-4">
                                <img
                                    src='favicon.png'
                                    alt="Disruptor Logo"
                                    className="h-16 w-16 object-contain"
                                />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                                Welcome Back
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Sign in to your account to continue
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

                            <div className="space-y-2">
                                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Username
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        id="username"
                                        type="email"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={handleEmailChange}
                                        className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        required
                                        disabled={loading}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-slate-800/70 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        required
                                        disabled={loading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                        disabled={loading}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                        Remember me
                                    </label>
                                </div>
                                <a
                                    href="/forgot-password"
                                    className="text-sm text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
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

export default LoginPage;