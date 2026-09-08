import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', timeout: 15000 });

export const limpiarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esRutaAutenticacion = /\/usuarios\/(login|solicitar-recuperacion|restablecer-password)$/.test(error.config?.url || '');
    if (error.response?.status === 401 && !esRutaAutenticacion) {
      limpiarSesion();
      if (window.location.pathname !== '/login') window.location.replace('/login?sesion=expirada');
    }
    return Promise.reject(error);
  }
);

export default api;
