import { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Lock className="text-white h-6 w-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {isForced ? "Set New Password" : "Change Password"}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                        {isForced
                            ? "Please set a new password to continue"
                            : "Update your password to keep your account secure"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
                                {error}
                            </div>
                        )}

                        {!isForced && (
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300">
                                    Current Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Enter your current password"
                                        value={currentPassword}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                                        className="pl-3 pr-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg"
                                        required
                                        disabled={loading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
                                        disabled={loading}
                                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter your new password"
                                    value={newPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                                    className="pl-3 pr-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg"
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
                                    disabled={loading}
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your new password"
                                    value={confirmPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                    className="pl-3 pr-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg"
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
                                    disabled={loading}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Requirements:</p>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className={`h-3 w-3 ${newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span>At least 8 characters</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className={`h-3 w-3 ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span>One lowercase letter</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className={`h-3 w-3 ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span>One uppercase letter</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className={`h-3 w-3 ${/(?=.*\d)/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span>One number</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className={`h-3 w-3 ${/(?=.*[!@#$%^&*])/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span>One special character (!@#$%^&*)</span>
                                </li>
                            </ul>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Changing Password...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </Button>

                        <div className="mt-6 text-center">
                            <Link
                                to="/"
                                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                &larr; Back to Login
                            </Link>
                        </div>
                    </form>

                    {/* Footer copyright */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            &copy; {new Date().getFullYear()} Disraptor LMS. All rights reserved.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChangePassword;