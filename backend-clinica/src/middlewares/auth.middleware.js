import 'dotenv/config';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const extraerBearerToken = (authorization = '') => String(authorization).match(/^Bearer\s+([^\s]+)$/i)?.[1] || null;

export const verificarToken = async (req, res, next) => {
  try {
    const token = extraerBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado.');
      return res.status(500).json({ mensaje: 'No se pudo validar la sesión.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'sist-clinica-api', audience: 'sist-clinica-web'
    });
    const usuario = await Usuario.findById(decoded.sub || decoded.id);
    if (!usuario || usuario.estado === false) return res.status(401).json({ mensaje: 'La sesión ya no está activa.' });
    if (decoded.rol !== usuario.rol) return res.status(401).json({ mensaje: 'Los permisos cambiaron. Inicia sesión nuevamente.' });
    if (usuario.passwordActualizadoEn && decoded.iat * 1000 < usuario.passwordActualizadoEn.getTime()) {
      return res.status(401).json({ mensaje: 'La contraseña cambió. Inicia sesión nuevamente.' });
    }
    req.usuario = { id: String(usuario._id), rol: usuario.rol };
    req.usuarioActual = usuario;
    return next();
  } catch (error) {
    if (error?.name !== 'JsonWebTokenError' && error?.name !== 'TokenExpiredError') console.error('Error al validar la sesión:', error);
    return res.status(401).json({ mensaje: error?.name === 'TokenExpiredError' ? 'La sesión expiró. Inicia sesión nuevamente.' : 'La sesión no es válida.' });
  }
};
