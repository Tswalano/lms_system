import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
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
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 px-4 py-6 dark:from-slate-900 dark:via-green-950 dark:to-cyan-950">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-8 left-0 h-40 w-40 rounded-full bg-green-200/35 blur-3xl dark:bg-green-800/20"></div>
                <div className="absolute right-0 top-1/3 h-44 w-44 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-800/20"></div>
                <div className="absolute bottom-10 left-10 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-800/20"></div>
            </div>

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-sm flex-col justify-center">
                <header className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-xl backdrop-blur-md dark:bg-slate-900/70">
                        <img
                            src="favicon.png"
                            alt="Disraptor Logo"
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                    <h1 className="bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-[2rem] font-bold tracking-tight text-transparent">
                        Disraptor LMS
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Sign in to continue
                    </p>
                </header>

                <section className="rounded-[2rem] border border-white/40 bg-white/85 px-5 pb-6 pt-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
                    <div className="mb-6 text-center">
                        <h2 className="mx-auto max-w-[14rem] text-[1.75rem] font-semibold leading-tight text-slate-900 dark:text-white">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Access your leave and workforce tools from one place
                        </p>
                        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-green-500 to-cyan-500"></div>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2.5">
                            <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="username"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={username}
                                    onChange={handleEmailChange}
                                    className="h-12 w-full rounded-full border border-white/60 bg-white/70 pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500"
                                    required
                                    disabled={loading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="h-12 w-full rounded-full border border-white/60 bg-white/70 pl-11 pr-12 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500"
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed dark:hover:text-slate-300"
                                    disabled={loading}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-800"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                    Remember me
                                </label>
                            </div>
                            <a
                                href="/forgot-password"
                                className="text-sm font-medium text-green-600 transition-colors hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                            >
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 px-6 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </section>

                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date().getFullYear()} &copy; Disraptor Systems. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
