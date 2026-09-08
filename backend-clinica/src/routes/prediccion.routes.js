import express from 'express';

import {
  obtenerEstadoServicioML,
  obtenerResumenDataset,
  predecirConsumoInsumos,
  predecirConsumoPorInsumo
} from '../controllers/prediccion.controller.js';

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

router.get(
  '/estado',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerEstadoServicioML
);

router.get(
  '/resumen-dataset',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  obtenerResumenDataset
);

router.get(
  '/consumo-insumos',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  predecirConsumoInsumos
);

router.get(
  '/consumo-insumos/:insumoId',
  verificarToken,
  permitirRoles(
    'administrador',
    'odontologo'
  ),
  validarObjectId(
    'insumoId'
  ),
  predecirConsumoPorInsumo
);


export default router;