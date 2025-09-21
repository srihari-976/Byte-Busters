import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockAuth } from '../lib/supabase';

interface User {
  user_id: string;
  username: string;
  email: string;
  role_id: string;
  role_name: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data, error } = await mockAuth.getSession();
      
      if (error || !data.session) {
        localStorage.removeItem('token');
        setUser(null);
      } else {
        const sessionUser = data.session.user;
        const userData: User = {
          user_id: sessionUser.id,
          username: sessionUser.user_metadata.username,
          email: sessionUser.email,
          role_id: sessionUser.user_metadata.role_id,
          role_name: sessionUser.user_metadata.role_name,
          is_active: sessionUser.user_metadata.is_active
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await mockAuth.signInWithPassword(email, password);
      
      if (error) {
        throw new Error(error.message || 'Login failed');
      }

      localStorage.setItem('token', data.session.access_token);
      
      const sessionUser = data.user;
      const userData: User = {
        user_id: sessionUser.id,
        username: sessionUser.user_metadata.username,
        email: sessionUser.email,
        role_id: sessionUser.user_metadata.role_id,
        role_name: sessionUser.user_metadata.role_name,
        is_active: sessionUser.user_metadata.is_active
      };
      
      console.log('Setting user data:', userData);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await mockAuth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}