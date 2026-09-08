const entero = (nombre, valor, predeterminado, { minimo = 1, maximo = 65535 } = {}) => {
  const numero = Number(valor ?? predeterminado);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new Error(`${nombre} debe ser un entero entre ${minimo} y ${maximo}.`);
  }
  return numero;
};

const requerido = (nombre) => {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Falta la variable de entorno obligatoria ${nombre}.`);
  return valor;
};

const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
const jwtSecret = requerido('JWT_SECRET');

if (jwtSecret.length < 32) {
  const mensaje = 'JWT_SECRET debe contener al menos 32 caracteres.';
  if (nodeEnv === 'production') throw new Error(mensaje);
  console.warn(`Advertencia de configuración: ${mensaje}`);
}

export const config = Object.freeze({
  nodeEnv,
  port: entero('PORT', process.env.PORT, 3000),
  mongoUri: requerido('MONGO_URI'),
  jwtSecret,
  frontendUrl: process.env.FRONTEND_URL?.trim() || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',').map((valor) => valor.trim()).filter(Boolean),
  mlServiceUrl: (process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000').replace(/\/+$/, ''),
  mlTimeoutMs: entero('ML_TIMEOUT_MS', process.env.ML_TIMEOUT_MS, 20000, { minimo: 1000, maximo: 120000 })
});
