import express from 'express';

import {
  crearSolicitudCita,
  obtenerSolicitudesCita,
  confirmarSolicitudCita,
  rechazarSolicitudCita
} from '../controllers/solicitudCita.controller.js';

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
   SOLICITUD PÚBLICA

   Esta ruta no requiere token porque se utiliza desde
   el portal público de la clínica.
===================================================== */

router.post(
  '/',
  crearSolicitudCita
);

/* =====================================================
   CONSULTAR SOLICITUDES

   Solo el administrador y el recepcionista pueden
   consultar las solicitudes enviadas desde el portal.
===================================================== */

router.get(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  obtenerSolicitudesCita
);

/* =====================================================
   CONFIRMAR SOLICITUD

   Convierte una solicitud pendiente en una cita formal.
===================================================== */

router.patch(
  '/:id/confirmar',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  validarObjectId('id'),
  confirmarSolicitudCita
);

/* =====================================================
   RECHAZAR SOLICITUD

   Mantiene la solicitud en el historial y registra
   el motivo por el que fue rechazada.
===================================================== */

router.patch(
  '/:id/rechazar',
  verificarToken,
  permitirRoles(
    'administrador',
    'recepcionista'
  ),
  validarObjectId('id'),
  rechazarSolicitudCita
);

export default router;