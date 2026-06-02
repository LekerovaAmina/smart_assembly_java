import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Ключ хранилища привязан к конкретному пользователю
function registeredKey(userId) {
  return `my_registered_events_${userId}`;
}

export function getRegisteredEvents(userId) {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(registeredKey(userId)) || '[]');
  } catch { return []; }
}

export function setRegisteredEvents(userId, list) {
  if (!userId) return;
  localStorage.setItem(registeredKey(userId), JSON.stringify(list));
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sa_token'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sa_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (tokenVal, userData) => {
    localStorage.setItem('sa_token', tokenVal);
    localStorage.setItem('sa_user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    // НЕ чистим my_registered_events — они хранятся по userId,
    // при следующем логине другого пользователя его ключ будет другим
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