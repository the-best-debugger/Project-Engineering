import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const AuthContext = createContext();

const decodeToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const user = useMemo(() => decodeToken(token), [token]);
  const role = user?.role ?? null;

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = (data) => {
    setToken(data.token);
    if (data.csrfToken) {
      sessionStorage.setItem('csrfToken', data.csrfToken);
    }
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem('csrfToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
