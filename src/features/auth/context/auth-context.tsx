'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SEEKER' | 'RECRUITER' | 'ADMIN';
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
};

type SessionResponse = {
  user: User | null;
  status: number;
};

let refreshRequest: Promise<SessionResponse> | null = null;

async function fetchCurrentUser(): Promise<SessionResponse> {
  const response = await fetch('/api/auth/me');
  if (!response.ok) return { user: null, status: response.status };
  const data: { user: User } = await response.json();
  return { user: data.user, status: response.status };
}

async function requestRefresh(): Promise<SessionResponse> {
  if (!refreshRequest) {
    refreshRequest = fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (response) => {
        if (!response.ok) return { user: null, status: response.status };
        const data: { user: User } = await response.json();
        return { user: data.user, status: response.status };
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

async function recoverSession(): Promise<User | null> {
  const refreshedSession = await requestRefresh();
  if (refreshedSession.user) return refreshedSession.user;
  if (refreshedSession.status !== 401) {
    throw new Error('Failed to refresh session');
  }

  const currentSession = await fetchCurrentUser();
  return currentSession.user;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      try {
        const currentSession = await fetchCurrentUser();
        if (!currentSession.user && currentSession.status !== 401) {
          throw new Error('Failed to fetch user');
        }
        const recoveredUser = currentSession.user ?? await recoverSession();
        if (!isActive) return;
        setUser(recoveredUser);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        if (isActive) setError('Failed to fetch user');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadUser();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !user) return;

    const refresh = async () => {
      try {
        const recoveredUser = await recoverSession();
        setUser(recoveredUser);
        if (!recoveredUser) setError(null);
      } catch (err) {
        console.error('Failed to refresh session:', err);
      }
    };

    const intervalId = window.setInterval(() => void refresh(), ACCESS_TOKEN_REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading, user]);

  const logout = async () => {
    try {
      setError(null);
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout failed');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed');
      throw err;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
