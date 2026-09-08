import crypto from 'crypto';
import axios from 'axios';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pacienteRoutes from './routes/paciente.routes.js';
import citaRoutes from './routes/cita.routes.js';
import expedienteRoutes from './routes/expediente.routes.js';
import insumoRoutes from './routes/insumo.routes.js';
import consumoInsumoRoutes from './routes/consumoInsumos.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import reporteRoutes from './routes/reporte.routes.js';
import prediccionRoutes from './routes/prediccion.routes.js';
import reabastecimientoRoutes from './routes/reabastecimiento.routes.js';
import { manejarErrores, normalizarRespuestaError, rutaNoEncontrada } from './middlewares/error.middleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import solicitudCitaRoutes from './routes/solicitudCita.routes.js';
import { config } from './config/env.js';

const app = express();

const origenesPermitidos = config.corsOrigins;

app.disable('x-powered-by');
app.use((req, res, next) => {
  const idRecibido = String(req.headers['x-request-id'] || '');
  req.id = /^[A-Za-z0-9._-]{1,100}$/.test(idRecibido)
    ? idRecibido
    : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});
app.use(normalizarRespuestaError);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || origenesPermitidos.includes(origin)) return callback(null, true);
    const error = new Error('Origen no permitido por CORS.');
    error.statusCode = 403;
    error.codigo = 'ORIGEN_NO_PERMITIDO';
    return callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Total-Count', 'X-Page', 'X-Page-Size', 'X-Total-Pages'],
  maxAge: 86400
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    estado: 'OK',
    servicio: 'sist-clinica-api',
    version: '2.0.0',
    fecha: new Date()
  });
});

app.get('/api/ready', async (req, res) => {
  const mongoConectado = mongoose.connection.readyState === 1;
  let mlDisponible = false;

  try {
    const respuestaML = await axios.get(`${config.mlServiceUrl}/health`, {
      timeout: Math.min(config.mlTimeoutMs, 3000)
    });
    mlDisponible = respuestaML.status === 200;
  } catch {
    mlDisponible = false;
  }

  const listo = mongoConectado && mlDisponible;

  return res.status(listo ? 200 : 503).json({
    estado: listo ? 'listo' : 'no_listo',
    dependencias: {
      mongodb: mongoConectado ? 'disponible' : 'no_disponible',
      ml: mlDisponible ? 'disponible' : 'no_disponible'
    },
    fecha: new Date()
  });
});

app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/insumos', insumoRoutes);
app.use('/api/consumos-insumos', consumoInsumoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/predicciones', prediccionRoutes);
app.use('/api/reabastecimiento', reabastecimientoRoutes);
app.use('/api/solicitudes-citas', solicitudCitaRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(rutaNoEncontrada);
app.use(manejarErrores);

export default app;
