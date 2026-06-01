import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sa_token'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sa_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (tokenVal, userData) => {
    localStorage.setItem('sa_token', tokenVal);
    localStorage.setItem('sa_user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
    setToken(null);
    setUser(null);
  };

  const isHr =
    user?.role === 'HR' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isHr }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
