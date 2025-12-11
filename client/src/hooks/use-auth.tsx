import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(() => localStorage.getItem("refreshToken"));
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const saveTokens = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setToken(accessToken);
    setRefreshTokenValue(refreshToken);
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setRefreshTokenValue(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!refreshTokenValue) {
      clearTokens();
      return;
    }
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
      if (response.ok) {
        const data = await response.json();
        saveTokens(data.accessToken, data.refreshToken);
        await fetchUser(data.accessToken);
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    }
  }, [refreshTokenValue, clearTokens, saveTokens, fetchUser]);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        const success = await fetchUser(token);
        if (!success && refreshTokenValue) {
          await refreshToken();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiRequest("POST", "/api/login", { username, password });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    queryClient.invalidateQueries();
    toast({ title: "Welcome back!", description: `Logged in as ${data.user.username}` });
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiRequest("POST", "/api/register", { username, email, password });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    queryClient.invalidateQueries();
    toast({ title: "Account created!", description: `Welcome, ${data.user.username}` });
  };

  const logout = () => {
    clearTokens();
    queryClient.clear();
    toast({ title: "Logged out", description: "See you next time!" });
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
