import express from 'express';

import {
  crearInsumo,
  obtenerInsumos,
  obtenerResumenInsumos,
  obtenerInsumo,
  obtenerInsumosBajoStock,
  actualizarInsumo,
  cambiarEstadoInsumo,
  eliminarInsumo,
  reabastecerInsumo
} from '../controllers/insumo.controller.js';

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
   CREAR INSUMO
===================================================== */

router.post(
  '/',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  crearInsumo
);

/* =====================================================
   RESUMEN ADMINISTRATIVO

   Debe estar antes de /:id.
===================================================== */

router.get(
  '/resumen',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  obtenerResumenInsumos
);

/* =====================================================
   ALERTAS DE BAJO STOCK

   Debe estar antes de /:id.
===================================================== */

router.get(
  '/alertas/bajo-stock',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerInsumosBajoStock
);

/* =====================================================
   LISTADO GENERAL
===================================================== */

router.get(
  '/',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo',
    'recepcionista'
  ),
  obtenerInsumos
);

/* =====================================================
   REABASTECIMIENTO

   PATCH es la ruta recomendada.
===================================================== */

router.patch(
  '/:id/reabastecer',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  validarObjectId('id'),
  reabastecerInsumo
);

/*
 * Compatibilidad temporal con el frontend antiguo.
 */
router.put(
  '/:id/reabastecer',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  validarObjectId('id'),
  reabastecerInsumo
);

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

router.patch(
  '/:id/estado',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  validarObjectId('id'),
  cambiarEstadoInsumo
);

/* =====================================================
   OBTENER INSUMO
===================================================== */

router.get(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  validarObjectId('id'),
  obtenerInsumo
);

/* =====================================================
   ACTUALIZAR INSUMO

   PATCH es la ruta recomendada.
===================================================== */

router.patch(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  validarObjectId('id'),
  actualizarInsumo
);

/*
 * Compatibilidad temporal con el frontend antiguo.
 */
router.put(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  validarObjectId('id'),
  actualizarInsumo
);

/* =====================================================
   COMPATIBILIDAD CON DELETE ANTIGUO

   No elimina el documento.
   Lo desactiva para conservar el historial.
===================================================== */

router.delete(
  '/:id',
  verificarToken,
  permitirRoles(
    'administrador'
  ),
  validarObjectId('id'),
  eliminarInsumo
);

export default router;
