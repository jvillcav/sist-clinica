import express from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { permitirRoles } from '../middlewares/rol.middleware.js';
import {
  obtenerResumenGeneral,
  obtenerDatasetConsumo,
  obtenerReporteOdontologo,
  obtenerEstadisticasOdontologo,
  obtenerResumenRecepcion
} from '../controllers/reporte.controller.js';

const router = express.Router();

router.get(
  '/resumen',
  verificarToken,
  permitirRoles('administrador', 'odontologo', 'recepcionista'),
  obtenerResumenGeneral
);

router.get(
  '/dataset-consumo',
  verificarToken,
  permitirRoles('administrador', 'odontologo'),
  obtenerDatasetConsumo
);

router.get(
  '/odontologo/estadisticas',
  verificarToken,
  permitirRoles('odontologo'),
  obtenerEstadisticasOdontologo
);

router.get(
  '/odontologo',
  verificarToken,
  permitirRoles('administrador', 'odontologo'),
  obtenerReporteOdontologo
);

router.get(
  '/recepcion',
  verificarToken,
  permitirRoles('recepcionista', 'administrador'),
  obtenerResumenRecepcion
);

export default router;