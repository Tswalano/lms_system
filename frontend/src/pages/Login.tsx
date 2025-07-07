import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate, type NavigateFunction } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Login: React.FC = (): JSX.Element => {
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

            console.log("Login result:", result);

            if (result?.success) {
                console.log("Login successful!");
                return;
            }

            if (result?.challengeName === 'NEW_PASSWORD_REQUIRED') {
                console.log("Password change required", result);
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
                setError("Login failed. Please check your credentials and try again.");
            }

        } catch (err: unknown) {
            console.error("Login error:", err);
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">
                                Username
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="username"
                                    type="email"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={handleEmailChange}
                                    className="pl-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg"
                                    required
                                    disabled={loading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="pl-10 pr-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg"
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
                                    disabled={loading}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {/* Remember me checkbox (optional) */}
                            </div>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </form>

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

export default Login;