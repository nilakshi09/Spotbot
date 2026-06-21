"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { setAccessToken, clearTokens } from '@/lib/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  orgId: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      try {
        const { accessToken } = await apiClient.post<{ accessToken: string }>('/api/auth/refresh');
        setAccessToken(accessToken);
        
        // Decode user from JWT (naive decoding for frontend context)
        const payloadStr = accessToken.split('.')[1];
        const decoded = JSON.parse(atob(payloadStr));
        setUser({
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name || 'User', // Fallback if name is not in payload
          role: decoded.role,
          orgId: decoded.orgId,
          plan: decoded.plan,
        });
      } catch (err) {
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiClient.post<{ accessToken: string, user: User }>('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    router.push('/dashboard');
  };

  const signup = async (email: string, password: string, name: string) => {
    const data = await apiClient.post<{ accessToken: string, user: User }>('/api/auth/signup', { email, password, name });
    setAccessToken(data.accessToken);
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      // ignore
    }
    clearTokens();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
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
