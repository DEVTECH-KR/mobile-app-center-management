// src/lib/auth.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { UserRole } from '@/lib/types';
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: 'male' | 'female' | 'other' | undefined;
  nationality?: string;
  otherNationality?: string;
  educationLevel?: string;
  university?: string;
  address?: string;
  phone?: string;
  avatarUrl?: string | null;
  preferences?: {
    theme?: "light" | "dark";
    language?: "fr" | "en";
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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

// MODIF: durée d'inactivité avant logout automatique (ms). Ajuste à volonté.
const DEFAULT_INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const { setTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // MODIF: timer d'inactivité et ref pour listeners
  const inactivityTimeoutRef = useRef<number | null>(null);
  const inactivityMsRef = useRef<number>(DEFAULT_INACTIVITY_MS);

  // Helper: logout propre
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const fetchProfile = async (token: string | null) => {
    if (!token) {
      logout();
      return null;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Si 401 ou autre => logout
        console.warn('Profile fetch failed, status:', res.status);
        logout();
        return null;
      }

      const data = await res.json();
      // L'API renvoie un document utilisateur (Mongo) — convertit _id -> id
      const mapped: User = {
        id: data._id ?? data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        gender: (['male', 'female', 'other'].includes(data.gender) ? data.gender : undefined) as
          | 'male'
          | 'female'
          | 'other'
          | undefined,
        nationality: data.nationality,
        otherNationality: data.otherNationality,
        educationLevel: data.educationLevel,
        university: data.university,
        address: data.address,
        phone: data.phone,
        avatarUrl: data.avatarUrl ?? null,
        preferences: data.preferences || { theme: "light", language: "fr" }
      };

      setUser(mapped);

      // ✅ Appliquer le thème de l’utilisateur
      if (mapped.preferences?.theme) {
        setTheme(mapped.preferences.theme);
      }

      return mapped;
    } catch (err) {
      console.error('Profile fetch error:', err);
      logout();
      return null;
    }
  };

  // MODIF: gestion de l'inactivité — handlers simples
  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = window.setTimeout(() => {
      console.log('Auto-logout due to inactivity');
      logout();
    }, inactivityMsRef.current);
  };

  const attachInactivityListeners = () => {
    // events qui réinitialisent le timer
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'visibilitychange', 'focus'];
    const onActivity = () => resetInactivityTimer();
    events.forEach(e => document.addEventListener(e, onActivity));
    // initial timer
    resetInactivityTimer();

    // retourne une fonction de cleanup
    return () => {
      events.forEach(e => document.removeEventListener(e, onActivity));
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  };

  // MODIF: on mount -> if token present, fetch profile from server (DB) and set user
  useEffect(() => {
    let cleanupInactivity: (() => void) | undefined;
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    setToken(token);
    // fetch profile from backend (ensures data comes from DB — objective)
    (async () => {
      await fetchProfile(token);
      setIsLoading(false);
      // Attache listeners d'inactivité seulement si user est connecté
      cleanupInactivity = attachInactivityListeners();
    })();

    return () => {
      if (cleanupInactivity) cleanupInactivity();
    };
  }, []);

  // MODIF: login récupère et stocke token, puis fetchProfile pour obtenir le user complet depuis DB
  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // store token
    localStorage.setItem('token', data.token);
    setToken(data.token);

    // fetch profile from the server (prefer DB truth)
    const fetched = await fetchProfile(data.token);
    if (!fetched) {
      // If fetching profile failed, trigger logout to be safe
      logout();
      throw new Error('Failed to load profile after login');
    }
  };

  // register stays mostly unchanged (server returns created user+token)
  const register = async (userData: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // Optionally, store token and fetch profile (if server sends token immediately)
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      await fetchProfile(data.token);
    }

    return data;
  };

  // MODIF: setAuthUser permet au Profile page d'updater le state immédiatement
  const setAuthUser = (updatedUser: User) => {
    setUser(updatedUser);

    if (updatedUser.preferences?.theme) {
      setTheme(updatedUser.preferences.theme);
    }
    
    try {
      const minimal = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      };
      localStorage.setItem('user', JSON.stringify(minimal));
    } catch (err) {
      console.error('Erreur stockage minimal user:', err);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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