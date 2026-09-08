import express from 'express';

import {
  registrarAtencionCompleta,
  obtenerExpedientes,
  obtenerResumenExpedientes,
  obtenerExpediente,
  actualizarExpediente,
  anularExpediente,
  obtenerExpedientesPorPaciente,
  obtenerMiExpediente
} from '../controllers/expediente.controller.js';

import {
  verificarToken
} from '../middlewares/auth.middleware.js';

import {
  permitirRoles
} from '../middlewares/rol.middleware.js';

import {
  validarObjectId
} from '../middlewares/validarObjectId.middleware.js';

const router =
  express.Router();

/* =====================================================
   REGISTRO DE ATENCIÓN CLÍNICA

   Diagnóstico, tratamiento, expediente,
   consumo de insumos y cierre de cita.
===================================================== */

router.post(
  '/atencion-completa',
  verificarToken,
  permitirRoles('odontologo'),
  registrarAtencionCompleta
);

/* =====================================================
   RESUMEN ADMINISTRATIVO

   Debe estar antes de /:id.
===================================================== */

router.get(
  '/resumen',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerResumenExpedientes
);

/* =====================================================
   EXPEDIENTE DEL PACIENTE AUTENTICADO

   Debe estar antes de /:id.
===================================================== */

router.get(
  '/mi-expediente',
  verificarToken,
  permitirRoles('paciente'),
  obtenerMiExpediente
);

/* =====================================================
   HISTORIAL POR PACIENTE
===================================================== */

router.get(
  '/paciente/:pacienteId',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  validarObjectId('pacienteId'),
  obtenerExpedientesPorPaciente
);

/* =====================================================
   LISTADO GLOBAL
===================================================== */

router.get(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerExpedientes
);

/* =====================================================
   DETALLE
===================================================== */

router.get(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  validarObjectId('id'),
  obtenerExpediente
);

/* =====================================================
   ACTUALIZACIÓN CLÍNICA

   Solamente el odontólogo propietario.
===================================================== */

router.patch(
  '/:id',
  verificarToken,
  permitirRoles('odontologo'),
  validarObjectId('id'),
  actualizarExpediente
);

/* =====================================================
   ANULACIÓN ADMINISTRATIVA

   Conserva el expediente para auditoría.
===================================================== */

router.patch(
  '/:id/anular',
  verificarToken,
  permitirRoles('administrador'),
  validarObjectId('id'),
  anularExpediente
);

export default router;