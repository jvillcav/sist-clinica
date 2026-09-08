import express from 'express';

import {
  obtenerReabastecimientos,
  obtenerReabastecimientosPorInsumo,
  obtenerResumenReabastecimientos
} from '../controllers/reabastecimiento.controller.js';

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
   RESUMEN

   Debe estar antes de cualquier ruta dinámica.
===================================================== */

router.get(
  '/resumen',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerResumenReabastecimientos
);


/* =====================================================
   LISTADO GENERAL
===================================================== */

router.get(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerReabastecimientos
);


/* =====================================================
   HISTORIAL POR INSUMO
===================================================== */

router.get(
  '/insumo/:insumoId',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  validarObjectId(
    'insumoId'
  ),
  obtenerReabastecimientosPorInsumo
);


export default router;