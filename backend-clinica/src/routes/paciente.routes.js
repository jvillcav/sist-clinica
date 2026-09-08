import express from 'express';

import {
  crearPaciente,
  obtenerPacientes,
  obtenerPaciente,
  actualizarPaciente,
  eliminarPaciente,
  crearAccesoPaciente,
  cambiarEstadoAccesoPaciente,
  obtenerMiPerfilPaciente,
  actualizarMiPerfilPaciente,
  cambiarMiPasswordPaciente,
  obtenerExpedientePacienteOdontologo
} from '../controllers/paciente.controller.js';

import {
  verificarToken
} from '../middlewares/auth.middleware.js';

import {
  permitirRoles
} from '../middlewares/rol.middleware.js';

import {
  validarObjectId
} from '../middlewares/validarObjectId.middleware.js';

const router = express.Router();

/* =====================================================
   PERFIL DEL PACIENTE AUTENTICADO
   Estas rutas deben ir antes de /:id
===================================================== */

router.get(
  '/mi-perfil',
  verificarToken,
  permitirRoles('paciente'),
  obtenerMiPerfilPaciente
);

router.put(
  '/mi-perfil',
  verificarToken,
  permitirRoles('paciente'),
  actualizarMiPerfilPaciente
);

router.put(
  '/mi-password',
  verificarToken,
  permitirRoles('paciente'),
  cambiarMiPasswordPaciente
);

/* =====================================================
   GESTIÓN GENERAL
===================================================== */

router.get(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista',
    'odontologo'
  ),
  obtenerPacientes
);

router.post(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  crearPaciente
);

/* =====================================================
   ACCESO AL PORTAL
===================================================== */

router.post(
  '/:id/acceso',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  validarObjectId('id'),
  crearAccesoPaciente
);

router.put(
  '/:id/acceso/estado',
  verificarToken,
  permitirRoles('administrador'),
  validarObjectId('id'),
  cambiarEstadoAccesoPaciente
);

/* =====================================================
   EXPEDIENTE PARA ODONTÓLOGO
===================================================== */

router.get(
  '/:id/expediente',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  validarObjectId('id'),
  obtenerExpedientePacienteOdontologo
);

/* =====================================================
   PACIENTE INDIVIDUAL
===================================================== */

router.get(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista',
    'odontologo'
  ),
  validarObjectId('id'),
  obtenerPaciente
);

router.put(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  validarObjectId('id'),
  actualizarPaciente
);

router.delete(
  '/:id',
  verificarToken,
  permitirRoles('administrador'),
  validarObjectId('id'),
  eliminarPaciente
);

export default router;