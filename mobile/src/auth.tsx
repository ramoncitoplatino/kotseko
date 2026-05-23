import React, { createContext, useContext, useEffect, useState } from "react";
import { saveAuth, clearAuth, getStoredToken, API_BASE } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredToken().then((t) => {
      if (t) {
        // Decode payload (it's a standard JWT — base64 middle section)
        try {
          const payload = JSON.parse(atob(t.split(".")[1]));
          setUser({ id: payload.id, email: payload.email, name: payload.name });
          setToken(t);
        } catch {
          // Token malformed, clear it
          clearAuth();
        }
      }
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/mobile/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Login failed");
    await saveAuth(json.token, json.cookieName);
    setToken(json.token);
    setUser(json.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/mobile/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Registration failed");
    await saveAuth(json.token, json.cookieName);
    setToken(json.token);
    setUser(json.user);
  }

  async function logout() {
    await clearAuth();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
