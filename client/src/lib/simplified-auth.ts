import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, LoginData, RegisterData } from '@shared/schema';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) {
            setIsAuthenticated(false);
            setUser(null);
          } else {
            console.error('Failed to fetch user:', res.statusText);
          }
        } else {
          const userData = await res.json();
          setUser(userData as User);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Login function
  const login = async (data: LoginData): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }

      const userData = await res.json();
      setUser(userData as User);
      setIsAuthenticated(true);
      return userData as User;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
      }

      const userData = await res.json();
      setUser(userData as User);
      setIsAuthenticated(true);
      return userData as User;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        console.error('Logout failed:', res.statusText);
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const authValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout
  };

  return React.createElement(
    AuthContext.Provider,
    { value: authValue },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};