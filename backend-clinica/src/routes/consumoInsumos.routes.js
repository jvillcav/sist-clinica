import express from 'express';

import {
  registrarConsumo,
  obtenerConsumos,
  obtenerConsumosOdontologo
} from '../controllers/consumoInsumo.controller.js';

import {
  verificarToken
} from '../middlewares/auth.middleware.js';

import {
  permitirRoles
} from '../middlewares/rol.middleware.js';

const router = express.Router();

/* =====================================================
   HISTORIAL PERSONAL DEL ODONTÓLOGO

   Debe declararse antes de cualquier futura ruta /:id.
===================================================== */

router.get(
  '/odontologo',
  verificarToken,
  permitirRoles('odontologo'),
  obtenerConsumosOdontologo
);

/* =====================================================
   LISTADO GLOBAL

   El administrador ve todos los consumos.
   El odontólogo solo verá los propios por seguridad.
===================================================== */

router.get(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerConsumos
);

/* =====================================================
   REGISTRO MANUAL

   Solo para ajustes administrativos excepcionales.

   El odontólogo registra insumos normalmente mediante:
   POST /api/expedientes/atencion-completa
===================================================== */

router.post(
  '/',
  verificarToken,
  permitirRoles('administrador'),
  registrarConsumo
);

export default router;