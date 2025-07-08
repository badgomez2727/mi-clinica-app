// mi-clinica-app/clinica-frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // ¡Importa tu instancia centralizada!

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Usa 'api' para verificar el token. El interceptor ya añade el header de Authorization.
          const response = await api.get('/auth/verify-token');
          setUser(response.data.user);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          navigate('/login');
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token, navigate]);

  // Función de login: ahora espera documentNumber y password
  const login = async (documentNumber, password) => {
    try {
      // Usa 'api' para la petición de login
      const response = await api.post('/auth/login', { document_number: documentNumber, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      // El interceptor de Axios en src/api/index.js se encargará de añadir el token a futuras peticiones.
      return true;
    } catch (error) {
      console.error("Login failed:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Error de inicio de sesión.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // El interceptor ya no enviará el token si no está en localStorage
  };

  if (loading) {
    return <div>Cargando sesión...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};