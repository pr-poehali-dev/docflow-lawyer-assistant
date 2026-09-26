import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url["auth"];
const STORAGE_KEY = "legis_pro_auth_token";
const USER_KEY = "legis_pro_auth_user";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // автовыход после 30 минут бездействия

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "lawyer" | "staff" | "readonly";
}

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  user: AuthUser | null;
  hasUsers: boolean | null;
  login: (email: string, password: string) => Promise<boolean>;
  bootstrap: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const getToken = () => localStorage.getItem(STORAGE_KEY);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => logout(), IDLE_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated) return;
    resetIdleTimer();
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const onActivity = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, onActivity));
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [isAuthenticated, resetIdleTimer]);

  const checkToken = useCallback(async () => {
    const token = getToken();
    if (!token) {
      try {
        const res = await fetch(`${AUTH_URL}?action=status`);
        const data = await res.json();
        setHasUsers(data.has_users);
      } catch {
        setHasUsers(null);
      }
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(AUTH_URL, { headers: { "X-Auth-Token": token } });
      const data = await res.json();
      if (res.ok && data.valid) {
        setIsAuthenticated(true);
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => { checkToken(); }, [checkToken]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Неверный email или пароль");
        return false;
      }
      localStorage.setItem(STORAGE_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch {
      setError("Не удалось подключиться к серверу");
      return false;
    }
  }, []);

  const bootstrap = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${AUTH_URL}?action=bootstrap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось создать администратора");
        return false;
      }
      localStorage.setItem(STORAGE_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch {
      setError("Не удалось подключиться к серверу");
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, error, user, hasUsers, login, bootstrap, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const authFetch = (url: string, options: RequestInit = {}) => {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), "X-Auth-Token": token || "" },
  });
};
