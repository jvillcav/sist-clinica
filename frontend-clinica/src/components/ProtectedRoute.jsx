import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { limpiarSesion } from '../api/axios';

const leerPayloadJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const [instanteValidacion] = useState(() => Date.now());
  const token = localStorage.getItem('token');
  const payload = token ? leerPayloadJwt(token) : null;
  const sesionVigente = payload?.exp && payload.exp * 1000 > instanteValidacion;

  if (!sesionVigente) {
    limpiarSesion();
    return <Navigate to="/login" replace />;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(payload.rol)) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
