import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url["auth"];
const STORAGE_KEY = "legis_pro_auth_token";

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkToken = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(AUTH_URL, { headers: { "X-Auth-Token": token } });
      setIsAuthenticated(res.ok);
      if (!res.ok) localStorage.removeItem(STORAGE_KEY);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkToken(); }, [checkToken]);

  const login = useCallback(async (password: string) => {
    setError(null);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Неверный пароль");
        return false;
      }
      localStorage.setItem(STORAGE_KEY, data.token);
      setIsAuthenticated(true);
      return true;
    } catch {
      setError("Не удалось подключиться к серверу");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
