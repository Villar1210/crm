import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

export type UserRole = 'super_admin' | 'account_admin' | 'user';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountId?: string;
};

type AuthContextValue = {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const toCurrentUser = (user: User): CurrentUser => {
  const role: UserRole =
    user.role === 'super_admin'
      ? 'super_admin'
      : user.role === 'admin' || user.role === 'agent'
        ? 'account_admin'
        : 'user';

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    accountId: undefined
  };
};

const getInitialUser = (): CurrentUser | null => {
  const stored = api.auth.getCurrentUser();
  if (stored) {
    return toCurrentUser(stored);
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getInitialUser);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
