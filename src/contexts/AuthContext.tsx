'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { safeStorage } from '@/lib/storage';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = safeStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        apiClient.setToken(savedToken);
        // TODO: Validate token with server
      }
    } catch (error) {
      console.error('Failed to access storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      setUser(response.user);
      setToken(response.token);
      try {
        safeStorage.setItem('token', response.token);
      } catch (storageError) {
        console.error('Failed to save token to storage:', storageError);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await apiClient.register(email, password, name);
      setUser(response.user);
      setToken(response.token);
      try {
        safeStorage.setItem('token', response.token);
      } catch (storageError) {
        console.error('Failed to save token to storage:', storageError);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      safeStorage.removeItem('token');
    } catch (error) {
      console.error('Failed to remove token from storage:', error);
    }
    apiClient.setToken('');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
