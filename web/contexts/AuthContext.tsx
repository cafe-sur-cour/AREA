'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { User } from '@/types/user';
import { getToken, deleteToken } from '@/lib/manageToken';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUserInfo: () => Promise<User | null>;
}

const USER_STORAGE_KEY = 'userDataEnriched';
const CACHE_VALIDITY_PERIOD = 60 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_startupInfoRetries, _setStartupInfoRetries] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (token) {
        try {
          const cachedDataStr = localStorage.getItem(USER_STORAGE_KEY);
          if (cachedDataStr) {
            try {
              const cachedData = JSON.parse(cachedDataStr);
              const now = Date.now();

              if (
                cachedData.timestamp &&
                now - cachedData.timestamp < CACHE_VALIDITY_PERIOD &&
                cachedData.user
              ) {
                console.log('Using cached user data', cachedData.user);
                setUser(cachedData.user);
                setIsLoading(false);

                if (cachedData.isFallback) {
                  console.log(
                    'Cached data is fallback, trying to refresh in background'
                  );
                  refreshUserInfo().catch(e =>
                    console.warn('Background refresh failed:', e)
                  );
                }
                return;
              } else {
                console.log('Cached user data expired, fetching fresh data');
              }
            } catch (e) {
              console.error('Error parsing cached user data', e);
              localStorage.removeItem(USER_STORAGE_KEY);
            }
          }

          const resp = await api.get<User>({ endpoint: '/user/me' });
          if (!resp.data) {
            throw new Error('Invalid user data received');
          }

          setUser(resp.data);
        } catch (error) {
          console.error('Authentication error:', error);
          await logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = async () => {
    await api.post('/auth/logout').catch(err => {
      console.error('Logout request failed:', err);
    });
    await deleteToken();
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.nduboi.fr;";
    setUser(null);
  };

  const refreshUserInfo = async (): Promise<User | null> => {
    const token = await getToken();
    if (!token) {
      console.log('refreshUserInfo: No token found');
      return null;
    }

    setIsLoading(true);
    try {
      const response = await api.get<User>({ endpoint: '/user' });

      if (!response.data) {
        throw new Error('Invalid user data');
      }

      const enrichedUser = response.data;

      setUser(enrichedUser);
      console.log(
        'refreshUserInfo: User info refreshed successfully',
        enrichedUser
      );
      return enrichedUser;
    } catch (error) {
      console.error('refreshUserInfo: Failed to refresh user info', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    refreshUserInfo,
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
