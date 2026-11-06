import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/auth';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
  isStudent: boolean;
  isWarden: boolean;
  isAdmin: boolean;
  login: (email_or_id: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      if (data.csrf_token) {
        setCsrfToken(data.csrf_token);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email_or_id: string, pass: string) => {
    const data = await authApi.login(email_or_id, pass);
    if (data.success && data.user) {
      setUser(data.user);
      setIsAuthenticated(true);
      if (data.csrf_token) {
        setCsrfToken(data.csrf_token);
      }
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const isStudent = user?.role === 'STUDENT';
  const isWarden = user?.role === 'WARDEN';
  const isAdmin = user?.role === 'ADMIN' || !!user?.is_superuser;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        csrfToken,
        isStudent,
        isWarden,
        isAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
