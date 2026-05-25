import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  jobTitle: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  leaveData: { leave_type: string; leave_count: number }[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  newPasswordRequired: boolean;
  tempSession: string | null;
  tempUsername: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    newPasswordRequired: false,
    tempSession: null,
    tempUsername: null,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data } = await authApi.getMe();
      setState((s) => ({ ...s, user: data.data, isAuthenticated: true, isLoading: false }));
    } catch {
      setState((s) => ({ ...s, isLoading: false, isAuthenticated: false }));
    }
  }

  async function login(username: string, password: string) {
    const { data } = await authApi.login(username, password);

    if (data.challengeName === 'NEW_PASSWORD_REQUIRED') {
      setState((s) => ({
        ...s,
        newPasswordRequired: true,
        tempSession: data.session,
        tempUsername: username,
      }));
      return;
    }

    await authApi.setTokens(data.accessToken, data.idToken, data.refreshToken);
    const me = await authApi.getMe();
    setState((s) => ({
      ...s,
      user: me.data.data,
      isAuthenticated: true,
      newPasswordRequired: false,
    }));
  }

  async function completeNewPassword(newPassword: string) {
    if (!state.tempUsername || !state.tempSession) throw new Error('No session');
    const { data } = await authApi.completeNewPassword(
      state.tempUsername,
      newPassword,
      state.tempSession
    );
    await authApi.setTokens(data.accessToken, data.idToken, data.refreshToken);
    const me = await authApi.getMe();
    setState((s) => ({
      ...s,
      user: me.data.data,
      isAuthenticated: true,
      newPasswordRequired: false,
      tempSession: null,
      tempUsername: null,
    }));
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {}
    await authApi.clearTokens();
    setState((s) => ({ ...s, user: null, isAuthenticated: false }));
  }

  async function refreshUser() {
    const { data } = await authApi.getMe();
    setState((s) => ({ ...s, user: data.data }));
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, completeNewPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
