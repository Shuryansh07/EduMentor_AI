import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints.js';
import { setAccessToken } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // initial session bootstrap

  const applySession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  // On mount, try to restore a session via the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await authApi.refresh();
        if (active) applySession(data);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applySession]);

  // React to a hard logout dispatched by the axios interceptor.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const { data } = await authApi.login(credentials);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authApi.register(payload);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const googleLogin = useCallback(
    async (credential) => {
      const { data } = await authApi.google(credential);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    googleLogin,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
