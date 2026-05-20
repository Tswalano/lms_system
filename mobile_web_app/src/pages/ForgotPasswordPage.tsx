import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPasswordPage = () => {
    const { forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState<"request" | "verify" | "success">("request");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
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
            console.error("Forgot password error:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
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
            console.error("Reset password error:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const pageMeta = {
        request: {
            icon: <Mail className="h-10 w-10 text-white" />,
            title: "Reset Password",
            description: "Enter your email address to receive a verification code.",
        },
        verify: {
            icon: <KeyRound className="h-10 w-10 text-white" />,
            title: "Verify Reset",
            description: successMessage || `Enter the code sent to ${email}`,
        },
        success: {
            icon: <CheckCircle className="h-10 w-10 text-white" />,
            title: "Password Updated",
            description: successMessage || "Your password has been updated successfully.",
        },
    } as const;

    const currentMeta = pageMeta[step];

    return (
        <>
            <header className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-xl backdrop-blur-md">
                    <img
                        src="favicon.png"
                        alt="Disruptor Logo"
                        className="h-10 w-10 object-contain"
                    />
                </div>
                <h1 className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-[2rem] font-bold tracking-tight text-transparent">
                    Disraptor LMS
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                    Secure account recovery
                </p>
            </header>

            <section className="rounded-[2rem] border border-slate-700/50 bg-slate-900/80 px-5 pb-6 pt-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-cyan-500 shadow-lg">
                        {currentMeta.icon}
                    </div>
                    <h2 className="text-[1.75rem] font-semibold leading-tight text-white">
                        {currentMeta.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        {currentMeta.description}
                    </p>
                    <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-green-500 to-cyan-500"></div>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {step === "request" && (
                    <form className="space-y-5" onSubmit={handleRequestReset}>
                        <div className="space-y-2.5">
                            <label className="text-sm font-medium text-slate-300">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 w-full rounded-full border border-slate-700 bg-slate-800/70 pl-11 pr-4 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 px-6 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send verification code
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="inline-flex items-center text-sm text-green-400 transition-colors hover:text-green-300"
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back to login
                            </button>
                        </div>
                    </form>
                )}

                {step === "verify" && (
                    <form className="space-y-5" onSubmit={handleResetPassword}>
                        <div className="space-y-2.5">
                            <label className="text-sm font-medium text-slate-300">
                                Verification code
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Enter verification code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="h-12 w-full rounded-full border border-slate-700 bg-slate-800/70 pl-11 pr-4 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-sm font-medium text-slate-300">
                                New password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-12 w-full rounded-full border border-slate-700 bg-slate-800/70 pl-11 pr-4 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-sm font-medium text-slate-300">
                                Confirm password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-12 w-full rounded-full border border-slate-700 bg-slate-800/70 pl-11 pr-4 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 px-6 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Reset password"
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep("request")}
                                className="inline-flex items-center text-sm text-green-400 transition-colors hover:text-green-300"
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back to email entry
                            </button>
                        </div>
                    </form>
                )}

                {step === "success" && (
                    <div className="space-y-5">
                        <div className="rounded-2xl bg-slate-800/80 px-4 py-4 text-center">
                            <p className="text-sm leading-relaxed text-slate-400">
                                Your password has been reset. Use your new credentials the next time you sign in.
                            </p>
                        </div>

                        <Link
                            to="/login"
                            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-cyan-500 px-6 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-cyan-600"
                        >
                            Back to login
                        </Link>
                    </div>
                )}
            </section>

            <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                    {new Date().getFullYear()} &copy; Disraptor Systems. All rights reserved.
                </p>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
