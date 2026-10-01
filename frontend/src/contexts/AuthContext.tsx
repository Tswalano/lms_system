/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Types and Interfaces
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dob: string;
    gender: string;
    jobTitle: string;
    role: 'admin' | 'user' | string;
    createdAt: string;
    updatedAt: string;
    leaveData: LeaveData[];
}

interface LeaveData {
    leave_type: string;
    leave_count: number;
}

interface TokenUser {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    forgotPassword: (username: string) => Promise<AuthResponse>;
    changePassword: (username: string, newPassword: string, session: string) => Promise<ChangePasswordResponse>;
    checkAuthStatus: () => Promise<boolean>;
    authFetch: typeof fetch; // Matches standard fetch API
    resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResponse>;
    getAuthToken: () => string | null;
}

interface AuthResponse {
    success: boolean;
    error?: string;
    message?: string;
    challengeName?: string;
    tempPassword?: string;
    username?: string;
    session?: string;
}

interface AuthProviderProps {
    children: ReactNode;
}

interface LoginApiResponse {
    success: boolean;
    message: string;
    token: string;
    idToken: string;
    user: TokenUser;
    challengeName?: string;
    session?: string;
    requiresNewPassword?: boolean;
}

interface ApiAuthResponse {
    success: boolean;
    error: string;
    message: string;
    payload: User;
}

interface ApiErrorResponse {
    message: string;
}

interface ChangePasswordResponse {
    success: boolean;
    error?: string;
}

interface TokenRefreshResponse {
    success: boolean;
    token?: string;
    idToken?: string;
    refreshToken?: string;
    error?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// if development environment
export const API_BASE_URL: string =
    import.meta.env.DEV
        ? 'http://localhost:3000'
        : import.meta.env.MODE === 'dev'
            ? 'https://xrdpcrhluc.execute-api.af-south-1.amazonaws.com/dev'
            : 'https://9z3skhtfwi.execute-api.af-south-1.amazonaws.com/prod';


console.log(`[AuthContext] Environment set to: ${import.meta.env.MODE}`);

const doRefreshAuthToken = async (): Promise<TokenRefreshResponse> => {
    try {
        const currentRefreshToken = localStorage.getItem('refreshToken');
        if (!currentRefreshToken) {
            return { success: false, error: 'No refresh token available' };
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            // The backend role checks read custom: claims that only exist on the
            // idToken — never store the accessToken as authToken
            if (!data.idToken) {
                return { success: false, error: 'Refresh response missing idToken' };
            }
            localStorage.setItem('authToken', data.idToken);
            if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
            // Cognito does not rotate the refresh token on refresh; only overwrite
            // it when a new one is actually returned
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            return {
                success: true,
                idToken: data.idToken,
                refreshToken: data.refreshToken
            };
        } else {
            const errorData = await response.json();
            return { success: false, error: errorData.message || 'Token refresh failed' };
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        return { success: false, error: 'Network error during token refresh' };
    }
};

let refreshInFlight: Promise<TokenRefreshResponse> | null = null;

// Single-flight: parallel 401s (e.g. several queries expiring at once) share one
// refresh call instead of racing each other
export const refreshAuthToken = (): Promise<TokenRefreshResponse> => {
    if (!refreshInFlight) {
        refreshInFlight = doRefreshAuthToken().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
};

const getStoredAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

const buildApiFetchUrl = (input: string | URL | Request): string | URL | Request => {
    if (typeof input === 'string') {
        return /^https?:\/\//i.test(input)
            ? input
            : `${API_BASE_URL}${input.startsWith('/') ? input : `/${input}`}`;
    }

    if (input instanceof URL) {
        return input.toString();
    }

    return input;
};

const authenticatedFetch = async (
    input: string | URL | Request,
    init?: RequestInit,
    onSessionExpired?: () => void | Promise<void>
): Promise<Response> => {
    const token = getStoredAuthToken();

    if (!token) {
        throw new Error('Sorry, you are not authenticated');
    }

    const options: RequestInit = { ...init };
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }
    if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    options.headers = headers;

    const url = buildApiFetchUrl(input);
    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshResult = await refreshAuthToken();

        if (refreshResult.success && refreshResult.idToken) {
            headers.set('Authorization', `Bearer ${refreshResult.idToken}`);
            options.headers = headers;
            response = await fetch(url, options);
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            await onSessionExpired?.();
            throw new Error('Session expired. Please login again.');
        }
    }

    return response;
};

export const authFetch: typeof fetch = (input, init) => authenticatedFetch(input, init);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const getAuthToken = (): string | null => {
        return getStoredAuthToken();
    };

    const clearAuthState = (): void => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
    };

    const checkAuthStatus = async (): Promise<boolean> => {
        try {
            const token = getAuthToken();

            if (!token) {
                setLoading(false);
                return false;
            }

            const response = await authenticatedFetch('/users/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            }, clearAuthState);

            console.log('[Auth] /users/me response status:', response.status);

            if (response.ok) {
                const userData: ApiAuthResponse = await response.json();
                setUser(userData.payload);
                setIsAuthenticated(true);
                return true;
            } else {
                throw new Error('Authentication check failed');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            clearAuthState();
            return false;
        } finally {
            setLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<AuthResponse> => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data: LoginApiResponse = await response.json();

                if (data.requiresNewPassword) {
                    return {
                        success: false,
                        challengeName: 'NEW_PASSWORD_REQUIRED',
                        session: data.session,
                        tempPassword: password,
                        username: username,
                        error: 'Password change required'
                    };
                }

                localStorage.setItem('authToken', data.user.idToken);
                localStorage.setItem('accessToken', data.user.accessToken);
                localStorage.setItem('refreshToken', data.user.refreshToken);
                // Clear any prior dismissal so the missing-DOB prompt (DashboardHeader) resurfaces on every login
                localStorage.removeItem('dismissedBirthdayBanner');

                const authOk = await checkAuthStatus();
                if (!authOk) {
                    return { success: false, error: 'ERR_CODE: DB, Your account exists, but it has not yet been configured. Please contact your administrator.' };
                }

                return { success: true };
            } else {
                const errorData: ApiErrorResponse = await response.json();
                return { success: false, error: errorData.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            const token = getAuthToken();
            if (token) {
                await authenticatedFetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }, clearAuthState);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuthState();
        }
    };

    const forgotPassword = async (email: string): Promise<AuthResponse> => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                return { success: true, message: 'Password reset email sent successfully' };
            } else {
                const errorData: ApiErrorResponse = await response.json();
                return { success: false, error: errorData.message || 'Failed to send reset email' };
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, message: 'Sorry, something went wrong. Please try again.' };
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string, code: string, newPassword: string): Promise<AuthResponse> => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, newPassword }),
            });

            if (response.ok) {
                return {
                    success: true,
                    message: 'Password reset successfully. You can now login with your new password.'
                };
            } else {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.message || 'Failed to reset password'
                };
            }
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                error: 'Network error. Please try again.'
            };
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (
        username: string,
        newPassword: string,
        session: string
    ): Promise<ChangePasswordResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/complete-new-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, newPassword, session }),
            });

            if (response.ok) {
                return { success: true };
            } else {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.message || 'Failed to change password'
                };
            }
        } catch (error: any) {
            console.error('Change password error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const authFetchWithLogout: typeof fetch = (input, init) => authenticatedFetch(input, init, clearAuthState);

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        forgotPassword,
        changePassword,
        checkAuthStatus,
        authFetch: authFetchWithLogout,
        getAuthToken,
        resetPassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
