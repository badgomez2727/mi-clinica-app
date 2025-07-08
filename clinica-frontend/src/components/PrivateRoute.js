// mi-clinica-app/clinica-frontend/src/components/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- Importa el hook desde su nueva ubicación

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // O un spinner de carga
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;