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
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NODE_ENV === 'dev'
            ? 'https://xrdpcrhluc.execute-api.af-south-1.amazonaws.com/dev'
            : 'https://9z3skhtfwi.execute-api.af-south-1.amazonaws.com/prod';


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
        return localStorage.getItem('authToken');
    };

    const refreshAuthToken = async (): Promise<TokenRefreshResponse> => {
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
                localStorage.setItem('authToken', data.idToken || data.accessToken);
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
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

    const checkAuthStatus = async (): Promise<boolean> => {
        try {
            const token = getAuthToken();
            console.log('[Auth] checkAuthStatus - Token:', token ? `${token.substring(0, 50)}...` : 'null');

            if (!token) {
                setLoading(false);
                return false;
            }

            let response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            });

            console.log('[Auth] /users/me response status:', response.status);

            if (response.status === 401) {
                const refreshResult = await refreshAuthToken();
                if (refreshResult.success && refreshResult.idToken) {
                    response = await fetch(`${API_BASE_URL}/users/me`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${refreshResult.idToken}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                    });
                } else {
                    throw new Error('Session expired. Please login again.');
                }
            }

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
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsAuthenticated(false);
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
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsAuthenticated(false);
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

    const authFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const token = getAuthToken();
        const options = init || {};

        // if token is not available, throw an error
        if (!token) {
            // user is no authenticated
            throw new Error('Sorry, you are not authenticated');
        }

        // Set default headers if not provided
        const headers = new Headers(options.headers);
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        options.headers = headers;

        // Handle different input types
        const url = typeof input === 'string'
            ? `${API_BASE_URL}${input}`
            : input instanceof URL
                ? `${API_BASE_URL}${input.pathname}${input.search}`
                : input;

        let response = await fetch(url, options);

        // If unauthorized, try to refresh token and retry
        if (response.status === 401) {
            const refreshResult = await refreshAuthToken();
            if (refreshResult.success && refreshResult.idToken) {
                // Update the Authorization header with new token
                headers.set('Authorization', `Bearer ${refreshResult.idToken}`);
                options.headers = headers;

                // Retry the original request with new token
                response = await fetch(url, options);
            } else {
                await logout();
                throw new Error('Session expired. Please login again.');
            }
        }

        return response;
    };

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        forgotPassword,
        changePassword,
        checkAuthStatus,
        authFetch,
        getAuthToken,
        resetPassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};