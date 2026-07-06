"use client";

import React, { createContext, useContext, ReactNode } from 'react';

export interface UserSession {
  id: string;
  rolId: string;
}

interface AuthContextType {
  user: UserSession | null;
  permisos: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permisos: [],
});

interface AuthProviderProps {
  children: ReactNode;
  user: UserSession | null;
  permisos: string[];
}

export function AuthProvider({ children, user, permisos }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user, permisos }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
