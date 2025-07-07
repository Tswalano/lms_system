import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, Lock, Key, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Password Reset Successful
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            {successMessage}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Back to login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === "verify") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <Key className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Reset Your Password
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            {successMessage || `Enter the verification code sent to ${email} and your new password`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-gray-700 dark:text-gray-300">
                                    Verification Code
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="Enter verification code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Enter new password (min 8 characters)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setStep("request")}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to email entry
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Forgot your password?
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                        Enter your email address to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRequestReset} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                                Email address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Verification Code"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;