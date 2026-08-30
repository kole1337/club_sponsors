import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setMyClubs([]); setLoading(false); return; }
    try {
      const { user, clubs } = await api.get('/auth/me');
      setUser(user);
      setMyClubs(clubs);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    setToken(token);
    setUser(user);
    await refresh();
  };
  const register = async (payload) => {
    const { token, user } = await api.post('/auth/register', payload);
    setToken(token);
    setUser(user);
    await refresh();
  };
  const logout = () => { setToken(null); setUser(null); setMyClubs([]); };

  return (
    <AuthCtx.Provider value={{ user, myClubs, loading, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
