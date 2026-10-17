import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService, type AuthUser } from './auth-service';
import { isFirebaseConfigured } from './firebase';

const TOKEN_KEY = 'docquiz-ai.auth.token.v2';
const USER_KEY = 'docquiz-ai.auth.user.v2';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  register: (params: {
    username: string;
    password: string;
    confirmPassword?: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => Promise<AuthUser>;
  getSecurityQuestion: (username: string) => Promise<{ username: string; securityQuestion: string }>;
  resetPassword: (params: {
    username: string;
    securityAnswer: string;
    newPassword: string;
    confirmNewPassword?: string;
  }) => Promise<AuthUser>;
  demoLogin: () => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore existing session on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse cached auth state:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const login = async (username: string, password: string) => {
    const { token: newToken, user: newUser } = await authService.login(username, password);
    saveSession(newToken, newUser);
    return newUser;
  };

  const register = async (params: {
    username: string;
    password: string;
    confirmPassword?: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => {
    const { token: newToken, user: newUser } = await authService.register(params);
    saveSession(newToken, newUser);
    return newUser;
  };

  const getSecurityQuestion = async (username: string) => {
    return await authService.getSecurityQuestion(username);
  };

  const resetPassword = async (params: {
    username: string;
    securityAnswer: string;
    newPassword: string;
    confirmNewPassword?: string;
  }) => {
    const { token: newToken, user: newUser } = await authService.resetPassword(params);
    saveSession(newToken, newUser);
    return newUser;
  };

  const demoLogin = async () => {
    return login('alex_morgan', 'DocQuiz2026!');
  };

  const signInWithGoogle = async () => {
    const { token: newToken, user: newUser } = await authService.signInWithGoogle();
    saveSession(newToken, newUser);
    return newUser;
  };

  const logout = async () => {
    await authService.logout(token);
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        getSecurityQuestion,
        resetPassword,
        demoLogin,
        signInWithGoogle,
        logout,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
