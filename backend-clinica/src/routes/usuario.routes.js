import express from 'express';
import {
  rateLimit
} from 'express-rate-limit';

import {
  verificarToken
} from '../middlewares/auth.middleware.js';

import {
  permitirRoles
} from '../middlewares/rol.middleware.js';

import {
  registrarUsuario,
  loginUsuario,
  solicitarRecuperacionPassword,
  restablecerPassword,
  obtenerSesionActual,
  obtenerUsuarios,
  actualizarRolUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerOdontologos
} from '../controllers/usuario.controller.js';

const router =
  express.Router();

/* =====================================================
   LIMITADORES
===================================================== */

const limitarLogin =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 20,

    standardHeaders:
      'draft-7',

    legacyHeaders: false,

    skipSuccessfulRequests:
      true,

    message: {
      mensaje:
        'Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.'
    }
  });

const limitarSolicitudRecuperacion =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit: 5,

    standardHeaders:
      'draft-7',

    legacyHeaders: false,

    message: {
      mensaje:
        'Se realizaron demasiadas solicitudes de recuperación. Intenta nuevamente más tarde.'
    }
  });

const limitarRestablecimiento =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit: 10,

    standardHeaders:
      'draft-7',

    legacyHeaders: false,

    message: {
      mensaje:
        'Se realizaron demasiados intentos de restablecimiento. Intenta nuevamente más tarde.'
    }
  });

/* =====================================================
   RUTAS PÚBLICAS DE AUTENTICACIÓN
===================================================== */

router.post(
  '/login',
  limitarLogin,
  loginUsuario
);

router.post(
  '/solicitar-recuperacion',
  limitarSolicitudRecuperacion,
  solicitarRecuperacionPassword
);

router.post(
  '/restablecer-password',
  limitarRestablecimiento,
  restablecerPassword
);

/* =====================================================
   RUTAS PROTEGIDAS
===================================================== */

router.get('/me', verificarToken, obtenerSesionActual);

router.post(
  '/registro',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  registrarUsuario
);

router.get(
  '/odontologos',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista',
    'odontologo',
    'paciente'
  ),
  obtenerOdontologos
);

router.get(
  '/',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  obtenerUsuarios
);

router.put(
  '/:id/rol',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  actualizarRolUsuario
);

router.put(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  actualizarUsuario
);

router.delete(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  eliminarUsuario
);

export default router;
