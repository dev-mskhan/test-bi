import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { whApi } from '../api';

interface DashUser { id: string; email: string; name: string; }
interface WebhookEndpoint { webhook_id: string; webhook_secret: string; }

interface AuthCtx {
  user: DashUser | null;
  endpoint: WebhookEndpoint | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, webhookName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<DashUser | null>(null);
  const [endpoint, setEndpoint] = useState<WebhookEndpoint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wh_access');
    if (!token) { setLoading(false); return; }
    whApi.me()
      .then(({ data }) => {
        setUser(data.user);
        setEndpoint(data.endpoint || null);
      })
      .catch(() => {
        localStorage.removeItem('wh_access');
        window.dispatchEvent(new Event('wh_auth_changed'));
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await whApi.login({ email, password });
    localStorage.setItem('wh_access', data.accessToken);
    setUser(data.user);
    setEndpoint(data.endpoint || null);
    window.dispatchEvent(new Event('wh_auth_changed'));
  }

  async function register(name: string, email: string, password: string, webhookName: string) {
    const { data } = await whApi.register({ name, email, password, webhookName });
    localStorage.setItem('wh_access', data.accessToken);
    setUser(data.user);
    setEndpoint(data.endpoint || null);
    window.dispatchEvent(new Event('wh_auth_changed'));
  }

  async function logout() {
    await whApi.logout().catch(() => {});
    localStorage.removeItem('wh_access');
    setUser(null);
    setEndpoint(null);
    window.dispatchEvent(new Event('wh_auth_changed'));
  }

  return <Ctx.Provider value={{ user, endpoint, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth requires AuthProvider');
  return c;
}