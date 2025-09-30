// src/lib/auth.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { UserRole } from '@/lib/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setAuthUser: (user: User) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  gender: string;
  nationality: string;
  educationLevel: string;
  university?: string;
  address?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error && data._id) { 
            setUser({ ...data, id: data._id }); 
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(err => {
          console.error('Profile fetch error on load:', err);
          localStorage.removeItem('token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    localStorage.setItem('token', data.token);
    setUser({ ...data.user, id: data.user._id });
  };

  const register = async (userData: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const setAuthUser = (updatedUser: User) => {
    // Mettre à jour le state React
    setUser(updatedUser);

    // Stocker une version minimale dans le localStorage pour éviter quota exceeded
    const minimalUser = {
      id: updatedUser.id, 
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    };

    try {
      localStorage.setItem("user", JSON.stringify(minimalUser));
    } catch (error) {
      console.error("Erreur stockage user:", error);
    }
  };


  return (
    <AuthContext.Provider 
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        setAuthUser,
      }}
    >
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