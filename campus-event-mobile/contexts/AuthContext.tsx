import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, User } from "@/utils/api";
import { getAuthToken, removeAuthToken, setAuthToken } from "@/utils/authStorage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; department: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateMailNotifications: (enabled: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await api.me();
    setUser(currentUser);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await getAuthToken();
        if (storedToken) {
          setToken(storedToken);
          await refreshUser();
        }
      } catch {
        await removeAuthToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password });
    await setAuthToken(result.access_token);
    setToken(result.access_token);
    const currentUser = await api.me();
    setUser(currentUser);
    router.replace("/(tabs)/home");
  };

  const register = async (payload: { name: string; email: string; password: string; department: string }) => {
    await api.register(payload);
    await login(payload.email, payload.password);
  };

  const logout = async () => {
    await removeAuthToken();
    setToken(null);
    setUser(null);
    router.replace("/auth/login");
  };

  const updateMailNotifications = async (enabled: boolean) => {
    const updatedUser = await api.updateNotificationPreferences({ mail_notifications_enabled: enabled });
    setUser(updatedUser);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser, updateMailNotifications }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
