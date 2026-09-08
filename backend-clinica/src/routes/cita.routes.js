import express from 'express';

import {
  crearCita,
  obtenerCitas,
  obtenerMisCitas,
  obtenerAgendaOdontologo,
  obtenerDisponibilidad,
  cancelarMiCita,
  reprogramarMiCita,
  confirmarCita,
  reprogramarCitaPersonal,
  cancelarCitaPersonal,
  obtenerCita,
  actualizarCita
} from '../controllers/cita.controller.js';

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
   RUTAS ESPECÍFICAS
   Deben aparecer antes de /:id
===================================================== */

router.get(
  '/mis-citas',
  verificarToken,
  permitirRoles('paciente'),
  obtenerMisCitas
);

router.get(
  '/disponibilidad',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista',
    'odontologo',
    'paciente'
  ),
  obtenerDisponibilidad
);

router.get(
  '/odontologo/agenda',
  verificarToken,
  permitirRoles('odontologo'),
  obtenerAgendaOdontologo
);

router.patch(
  '/mis-citas/:id/cancelar',
  verificarToken,
  permitirRoles('paciente'),
  validarObjectId('id'),
  cancelarMiCita
);

router.patch(
  '/mis-citas/:id/reprogramar',
  verificarToken,
  permitirRoles('paciente'),
  validarObjectId('id'),
  reprogramarMiCita
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
  obtenerCitas
);

router.post(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista',
    'odontologo',
    'paciente'
  ),
  crearCita
);

/* =====================================================
   OPERACIONES DE ESTADO
===================================================== */

router.patch(
  '/:id/confirmar',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  validarObjectId('id'),
  confirmarCita
);

router.patch(
  '/:id/reprogramar',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista',
    'odontologo'
  ),
  validarObjectId('id'),
  reprogramarCitaPersonal
);

router.patch(
  '/:id/cancelar',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  validarObjectId('id'),
  cancelarCitaPersonal
);

/* =====================================================
   CITA INDIVIDUAL
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
  obtenerCita
);

router.put(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista',
    'odontologo'
  ),
  validarObjectId('id'),
  actualizarCita
);

/*
 * No existe DELETE.
 * Las citas se cancelan para conservar historial.
 */

export default router;