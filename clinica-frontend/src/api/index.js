// mi-clinica-app/clinica-frontend/src/api/index.js

import axios from 'axios';

// --- ¡IMPORTANTE! Configura esta URL base ---
// Debe ser la URL base de tu backend Express.
// Si tu backend corre en http://localhost:5000 y todas tus rutas API empiezan con /api (ej. /api/auth, /api/clinics),
// entonces la URL base debe incluir /api.
const API_BASE_URL = 'http://localhost:5000/api'; // <--- VERIFICA ESTO CUIDADOSAMENTE

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Opcional: tiempo de espera para las peticiones (10 segundos)
});

// Interceptor para añadir automáticamente el token de autenticación a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Obtiene el token del localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Opcional: Interceptor para manejar errores de respuesta (ej. token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Si el token es inválido o expirado, o no autorizado
      console.error('Error de autenticación o autorización:', error.response.data.message);
      // Opcional: Podrías forzar un logout aquí o redirigir al login
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;